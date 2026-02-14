"""
Sentiment Prediction Engine

Uses historical sentiment data to predict future trends.
Simple momentum-based prediction for hackathon demo.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Optional, Tuple
from collections import deque
import math
import logging

logger = logging.getLogger(__name__)


@dataclass
class Prediction:
    """Sentiment prediction result."""
    predicted_score: float
    confidence: float  # 0-100
    direction: str  # UP, DOWN, STABLE
    time_horizon: str  # 1h, 6h, 24h
    momentum: float
    volatility: float
    support_level: float
    resistance_level: float
    
    def to_dict(self) -> dict:
        return {
            "predicted_score": round(self.predicted_score, 4),
            "confidence": round(self.confidence, 1),
            "direction": self.direction,
            "time_horizon": self.time_horizon,
            "momentum": round(self.momentum, 4),
            "volatility": round(self.volatility, 4),
            "support_level": round(self.support_level, 4),
            "resistance_level": round(self.resistance_level, 4)
        }


class SentimentPredictor:
    """
    Predicts future sentiment based on historical data.
    
    Uses:
    - Exponential Moving Average (EMA) for trend
    - Momentum calculation
    - Volatility estimation
    - Support/Resistance levels
    """
    
    # EMA periods
    SHORT_EMA = 5
    LONG_EMA = 10
    
    def __init__(self):
        self.history: deque = deque(maxlen=100)
        self._last_prediction: Optional[Prediction] = None
    
    def add_datapoint(self, score: float, timestamp: Optional[datetime] = None):
        """Add a sentiment datapoint."""
        self.history.append({
            "score": score,
            "timestamp": timestamp or datetime.utcnow()
        })
    
    def calculate_ema(self, period: int) -> float:
        """Calculate Exponential Moving Average."""
        if len(self.history) < period:
            return self.history[-1]["score"] if self.history else 0
        
        multiplier = 2 / (period + 1)
        data = [h["score"] for h in list(self.history)[-period:]]
        
        ema = data[0]
        for score in data[1:]:
            ema = (score * multiplier) + (ema * (1 - multiplier))
        
        return ema
    
    def calculate_momentum(self) -> float:
        """
        Calculate momentum (rate of change).
        Positive = upward trend, Negative = downward trend
        """
        if len(self.history) < 3:
            return 0.0
        
        scores = [h["score"] for h in list(self.history)[-10:]]
        
        # Simple momentum: difference between recent and older
        recent = sum(scores[-3:]) / 3
        older = sum(scores[:3]) / 3 if len(scores) >= 6 else scores[0]
        
        return recent - older
    
    def calculate_volatility(self) -> float:
        """Calculate sentiment volatility (standard deviation)."""
        if len(self.history) < 5:
            return 0.1  # Default volatility
        
        scores = [h["score"] for h in list(self.history)[-20:]]
        mean = sum(scores) / len(scores)
        variance = sum((s - mean) ** 2 for s in scores) / len(scores)
        
        return math.sqrt(variance)
    
    def calculate_support_resistance(self) -> Tuple[float, float]:
        """
        Calculate support and resistance levels.
        Support: recent low
        Resistance: recent high
        """
        if len(self.history) < 5:
            current = self.history[-1]["score"] if self.history else 0
            return current - 0.2, current + 0.2
        
        scores = [h["score"] for h in list(self.history)[-20:]]
        
        # Use recent min/max as support/resistance
        support = min(scores)
        resistance = max(scores)
        
        return support, resistance
    
    def predict(self, time_horizon: str = "1h") -> Prediction:
        """
        Generate sentiment prediction.
        
        Args:
            time_horizon: "1h", "6h", or "24h"
        """
        if not self.history:
            return Prediction(
                predicted_score=0.0,
                confidence=0.0,
                direction="STABLE",
                time_horizon=time_horizon,
                momentum=0.0,
                volatility=0.1,
                support_level=-0.2,
                resistance_level=0.2
            )
        
        current = self.history[-1]["score"]
        
        # Calculate indicators
        short_ema = self.calculate_ema(self.SHORT_EMA)
        long_ema = self.calculate_ema(self.LONG_EMA)
        momentum = self.calculate_momentum()
        volatility = self.calculate_volatility()
        support, resistance = self.calculate_support_resistance()
        
        # Time horizon multiplier
        horizon_mult = {"1h": 1.0, "6h": 2.0, "24h": 3.0}.get(time_horizon, 1.0)
        
        # Predict based on EMA crossover and momentum
        ema_signal = short_ema - long_ema  # Positive = bullish, Negative = bearish
        
        # Combine signals
        trend_signal = (ema_signal * 0.6) + (momentum * 0.4)
        
        # Apply momentum-based prediction
        predicted_change = trend_signal * horizon_mult * 0.1
        predicted_score = current + predicted_change
        
        # Clamp to valid range
        predicted_score = max(-1, min(1, predicted_score))
        
        # Determine direction
        if predicted_change > 0.05:
            direction = "UP"
        elif predicted_change < -0.05:
            direction = "DOWN"
        else:
            direction = "STABLE"
        
        # Calculate confidence
        # Higher confidence when momentum and EMA agree
        signal_agreement = abs(ema_signal) * abs(momentum)
        base_confidence = 40 + (signal_agreement * 100)
        
        # Reduce confidence with higher volatility
        volatility_penalty = volatility * 30
        
        # Reduce confidence with less data
        data_factor = min(len(self.history) / 20, 1.0)
        
        confidence = (base_confidence - volatility_penalty) * data_factor
        confidence = max(10, min(95, confidence))  # Clamp to 10-95
        
        prediction = Prediction(
            predicted_score=predicted_score,
            confidence=confidence,
            direction=direction,
            time_horizon=time_horizon,
            momentum=momentum,
            volatility=volatility,
            support_level=support,
            resistance_level=resistance
        )
        
        self._last_prediction = prediction
        return prediction
    
    def get_all_predictions(self) -> dict:
        """Get predictions for all time horizons."""
        return {
            "1h": self.predict("1h").to_dict(),
            "6h": self.predict("6h").to_dict(),
            "24h": self.predict("24h").to_dict(),
            "current_score": self.history[-1]["score"] if self.history else 0,
            "data_points": len(self.history),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def get_technical_indicators(self) -> dict:
        """Get all technical indicators."""
        short_ema = self.calculate_ema(self.SHORT_EMA)
        long_ema = self.calculate_ema(self.LONG_EMA)
        momentum = self.calculate_momentum()
        volatility = self.calculate_volatility()
        support, resistance = self.calculate_support_resistance()
        
        # RSI-like indicator (0-100)
        if len(self.history) >= 5:
            scores = [h["score"] for h in list(self.history)[-14:]]
            gains = [scores[i] - scores[i-1] for i in range(1, len(scores)) if scores[i] > scores[i-1]]
            losses = [scores[i-1] - scores[i] for i in range(1, len(scores)) if scores[i] < scores[i-1]]
            
            avg_gain = sum(gains) / len(gains) if gains else 0
            avg_loss = sum(losses) / len(losses) if losses else 0.001
            
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
        else:
            rsi = 50
        
        # Signal strength
        ema_crossover = short_ema - long_ema
        if ema_crossover > 0.05:
            signal = "STRONG_BUY"
        elif ema_crossover > 0:
            signal = "BUY"
        elif ema_crossover < -0.05:
            signal = "STRONG_SELL"
        elif ema_crossover < 0:
            signal = "SELL"
        else:
            signal = "HOLD"
        
        return {
            "short_ema": round(short_ema, 4),
            "long_ema": round(long_ema, 4),
            "ema_crossover": round(ema_crossover, 4),
            "momentum": round(momentum, 4),
            "volatility": round(volatility, 4),
            "rsi": round(rsi, 1),
            "support": round(support, 4),
            "resistance": round(resistance, 4),
            "signal": signal,
            "trend": "BULLISH" if momentum > 0 else "BEARISH" if momentum < 0 else "NEUTRAL"
        }


# Global instance
predictor = SentimentPredictor()
