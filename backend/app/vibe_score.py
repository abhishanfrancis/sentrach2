from collections import deque
from datetime import datetime, timedelta
from typing import List, Tuple
import math
from app.models import SocialPost, VibeScore
from app.config import config


class VibeScoreAggregator:
    """
    Advanced sentiment aggregator using:
    - Exponential Moving Average (EMA) for recency weighting
    - Volume-weighted confidence scoring
    - Statistical variance for confidence intervals
    - Momentum-based trend detection
    """
    
    # EMA decay factor (α = 2/(N+1), higher = more weight on recent)
    EMA_ALPHA = 0.15
    
    # Volume baseline for normalization
    VOLUME_BASELINE = 30  # posts per minute baseline
    
    def __init__(self, window_size: int = None):
        self.window_size = window_size or config.ROLLING_WINDOW_SIZE
        self.scores: deque = deque(maxlen=self.window_size)
        self.timestamps: deque = deque(maxlen=self.window_size)
        self.posts: deque = deque(maxlen=self.window_size)
        self.ema_score = 0.0
        self.prev_ema = 0.0
    
    def add_score(self, score: float, post: SocialPost):
        """Add a new sentiment score with timestamp weighting."""
        self.scores.append(score)
        self.timestamps.append(datetime.utcnow())
        self.posts.append(post)
        
        # Update EMA: EMA_t = α * x_t + (1-α) * EMA_{t-1}
        self.prev_ema = self.ema_score
        self.ema_score = (self.EMA_ALPHA * score) + ((1 - self.EMA_ALPHA) * self.ema_score)
    
    def _compute_volume_weighted_score(self) -> float:
        """
        Compute volume-weighted sentiment using time-decay.
        Recent posts have exponentially higher weight.
        """
        if not self.scores:
            return 0.0
        
        scores_list = list(self.scores)
        n = len(scores_list)
        
        # Exponential weights: w_i = e^(λ * i) where λ controls decay
        lambda_decay = 0.1
        weights = [math.exp(lambda_decay * i) for i in range(n)]
        weight_sum = sum(weights)
        
        # Weighted average
        weighted_sum = sum(s * w for s, w in zip(scores_list, weights))
        return weighted_sum / weight_sum if weight_sum > 0 else 0.0
    
    def _compute_confidence(self) -> float:
        """
        Confidence based on:
        - Sample size (more data = higher confidence)
        - Score variance (lower variance = higher confidence)
        - Agreement ratio (consensus strength)
        """
        if len(self.scores) < 3:
            return 0.0
        
        scores_list = list(self.scores)
        n = len(scores_list)
        mean = sum(scores_list) / n
        
        # Variance calculation
        variance = sum((s - mean) ** 2 for s in scores_list) / n
        std_dev = math.sqrt(variance)
        
        # Sample size factor: sigmoid approaching 100% as n grows
        size_factor = 1 - math.exp(-n / 20)  # ~95% at n=60
        
        # Consensus factor: lower std_dev = higher agreement
        # Max std_dev for [-1,1] range is 1, so normalize
        consensus_factor = max(0, 1 - std_dev)
        
        # Agreement ratio: % of scores matching dominant direction
        positive = sum(1 for s in scores_list if s > 0)
        negative = sum(1 for s in scores_list if s < 0)
        dominant_ratio = max(positive, negative) / n if n > 0 else 0
        
        # Combined confidence (geometric mean for balance)
        confidence = (size_factor * consensus_factor * dominant_ratio) ** (1/3)
        
        return round(confidence * 100, 1)
    
    def _compute_volume_index(self) -> float:
        """
        Volume index: normalized activity rate.
        1.0 = baseline activity, >1 = high activity, <1 = low activity
        """
        if len(self.timestamps) < 2:
            return 1.0
        
        ts_list = list(self.timestamps)
        time_span = (ts_list[-1] - ts_list[0]).total_seconds()
        
        if time_span <= 0:
            return 1.0
        
        # Posts per minute
        posts_per_minute = (len(ts_list) / time_span) * 60
        
        # Normalize to baseline
        volume_index = posts_per_minute / self.VOLUME_BASELINE
        
        return round(volume_index, 2)
    
    def _compute_trend(self) -> str:
        """
        Trend detection using EMA momentum.
        Compare current EMA to previous EMA with threshold.
        """
        if len(self.scores) < 5:
            return "STABLE"
        
        # Momentum = current EMA - previous EMA
        momentum = self.ema_score - self.prev_ema
        
        # Also check short-term vs long-term average
        recent = list(self.scores)[-10:]
        older = list(self.scores)[:-10] if len(self.scores) > 10 else recent
        
        recent_avg = sum(recent) / len(recent)
        older_avg = sum(older) / len(older)
        
        trend_delta = recent_avg - older_avg
        
        # Combined signal
        signal = (momentum * 0.4) + (trend_delta * 0.6)
        
        threshold = 0.02
        if signal > threshold:
            return "UP"
        elif signal < -threshold:
            return "DOWN"
        return "STABLE"
    
    def _get_label(self, score: float) -> str:
        """Get human-readable sentiment label."""
        if score > 0.4:
            return "🚀 Very Bullish"
        elif score > 0.2:
            return "📈 Bullish"
        elif score > 0.05:
            return "↗️ Slightly Bullish"
        elif score < -0.4:
            return "💀 Very Bearish"
        elif score < -0.2:
            return "🐻 Bearish"
        elif score < -0.05:
            return "↘️ Slightly Bearish"
        return "😐 Neutral"
    
    def get_vibe_score(self) -> VibeScore:
        """
        Compute comprehensive vibe score with all metrics.
        """
        if not self.scores:
            return VibeScore(
                score=0.0,
                label="No Data",
                post_count=0,
                last_updated=datetime.utcnow(),
                confidence=0.0,
                volume_index=0.0,
                trend_direction="STABLE"
            )
        
        # Primary score: blend of EMA and volume-weighted
        vw_score = self._compute_volume_weighted_score()
        blended_score = (self.ema_score * 0.6) + (vw_score * 0.4)
        
        # Clamp to [-1, 1]
        final_score = max(-1.0, min(1.0, blended_score))
        
        return VibeScore(
            score=round(final_score, 4),
            label=self._get_label(final_score),
            post_count=len(self.scores),
            last_updated=datetime.utcnow(),
            confidence=self._compute_confidence(),
            volume_index=self._compute_volume_index(),
            trend_direction=self._compute_trend()
        )
    
    def get_recent_posts(self, limit: int = 10) -> List[SocialPost]:
        """Get the most recent analyzed posts."""
        posts_list = list(self.posts)
        return posts_list[-limit:][::-1]
    
    def get_score_for_chain(self) -> int:
        """Get score scaled for blockchain (-100 to +100)."""
        vibe = self.get_vibe_score()
        return int(vibe.score * 100)


# Global singleton
aggregator = VibeScoreAggregator()
