"""
Vibe Score Aggregator
Computes Community Vibe Score from sentiment data.
"""

import math
from datetime import datetime
from collections import deque
from typing import List, Literal, Optional
from dataclasses import dataclass, field
import logging

from app.config import config

logger = logging.getLogger(__name__)


@dataclass
class VibeResult:
    """Result of vibe score computation."""
    vibe_score: float
    average_sentiment: float
    volume: int
    trend: Literal["UP", "DOWN", "STABLE"]
    last_updated: datetime


@dataclass
class ArticleSentiment:
    """Sentiment data for a single article."""
    text: str
    score: float  # -1 to +1
    timestamp: datetime
    title: str = ""
    source: str = ""
    url: str = ""
    image_url: str = ""


class VibeAggregator:
    """
    Aggregates sentiment scores from news articles and computes
    a Community Vibe Score.
    
    Formula:
        average_sentiment = sum(scores) / total_articles
        volume_weight = log(volume + 1)
        vibe_score = average_sentiment * volume_weight (normalized to [-1, 1])
    """
    
    def __init__(self, history_size: int = 20):
        self.history_size = history_size
        
        # Current batch of article sentiments
        self.current_articles: List[ArticleSentiment] = []
        
        # Historical vibe scores (for trend calculation)
        self.history: deque[VibeResult] = deque(maxlen=history_size)
        
        # Last computed result (cached)
        self._cached_result: Optional[VibeResult] = None
    
    def set_articles(self, articles: List[ArticleSentiment]) -> None:
        """
        Set the current batch of article sentiments.
        Called after fetching and analyzing news.
        """
        self.current_articles = articles
        self._cached_result = None  # Invalidate cache
    
    def add_article(
        self, 
        text: str, 
        score: float,
        title: str = "",
        source: str = "",
        url: str = "",
        image_url: str = "",
        timestamp: datetime = None
    ) -> None:
        """Add a single article sentiment."""
        self.current_articles.append(ArticleSentiment(
            text=text,
            score=score,
            timestamp=timestamp or datetime.utcnow(),
            title=title,
            source=source,
            url=url,
            image_url=image_url
        ))
        self._cached_result = None
    
    def compute_vibe(self) -> VibeResult:
        """
        Compute the Community Vibe Score from current articles.
        
        Returns cached result if no new data.
        """
        if self._cached_result is not None:
            return self._cached_result
        
        now = datetime.utcnow()
        
        # Handle empty case
        if not self.current_articles:
            result = VibeResult(
                vibe_score=0.0,
                average_sentiment=0.0,
                volume=0,
                trend="STABLE",
                last_updated=now
            )
            return result
        
        # Calculate average sentiment
        scores = [a.score for a in self.current_articles]
        average_sentiment = sum(scores) / len(scores)
        
        # Calculate volume
        volume = len(self.current_articles)
        
        # Volume weight using log scale
        volume_weight = math.log(volume + 1)
        
        # Raw vibe score
        raw_vibe = average_sentiment * volume_weight
        
        # Normalize to [-1, 1] using tanh
        # This ensures the score stays bounded
        vibe_score = math.tanh(raw_vibe)
        
        # Calculate trend
        trend = self._calculate_trend(vibe_score)
        
        result = VibeResult(
            vibe_score=round(vibe_score, 4),
            average_sentiment=round(average_sentiment, 4),
            volume=volume,
            trend=trend,
            last_updated=now
        )
        
        # Store in history
        self.history.append(result)
        
        # Cache result
        self._cached_result = result
        
        logger.info(
            f"Vibe computed: score={vibe_score:.4f}, "
            f"avg_sentiment={average_sentiment:.4f}, "
            f"volume={volume}, trend={trend}"
        )
        
        return result
    
    def _calculate_trend(self, current_score: float) -> Literal["UP", "DOWN", "STABLE"]:
        """
        Calculate trend based on previous vibe score.
        """
        if not self.history:
            return "STABLE"
        
        previous = self.history[-1].vibe_score
        delta = current_score - previous
        
        # Use threshold to avoid noise
        if delta > 0.01:
            return "UP"
        elif delta < -0.01:
            return "DOWN"
        else:
            return "STABLE"
    
    def get_history(self) -> List[dict]:
        """
        Get historical vibe scores.
        
        Returns:
            List of last N vibe score records.
        """
        return [
            {
                "vibe_score": r.vibe_score,
                "average_sentiment": r.average_sentiment,
                "volume": r.volume,
                "trend": r.trend,
                "timestamp": r.last_updated.isoformat()
            }
            for r in self.history
        ]
    
    def clear(self) -> None:
        """Clear current articles (not history)."""
        self.current_articles = []
        self._cached_result = None


# Global singleton instance
aggregator = VibeAggregator(history_size=config.HISTORY_SIZE)
