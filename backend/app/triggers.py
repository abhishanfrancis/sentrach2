"""
Predefined Action Triggers Module

Detects BULLISH/BEARISH/NEUTRAL signals based on vibe score
and maintains alert history.
"""

from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field
from collections import deque
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class Signal(str, Enum):
    BULLISH = "BULLISH_SIGNAL"
    BEARISH = "BEARISH_SIGNAL"
    NEUTRAL = "NEUTRAL"


@dataclass
class Alert:
    """Represents a triggered alert."""
    signal: Signal
    vibe_score: float
    average_sentiment: float
    volume: int
    timestamp: datetime = field(default_factory=datetime.utcnow)
    tx_hash: Optional[str] = None  # Blockchain tx hash if pushed

    def to_dict(self) -> dict:
        return {
            "signal": self.signal.value,
            "vibe_score": round(self.vibe_score, 4),
            "average_sentiment": round(self.average_sentiment, 4),
            "volume": self.volume,
            "timestamp": self.timestamp.isoformat(),
            "tx_hash": self.tx_hash
        }


class TriggerEngine:
    """
    Evaluates vibe scores and triggers alerts based on thresholds.
    
    Thresholds:
        - BULLISH_SIGNAL: vibe_score > 0.6
        - BEARISH_SIGNAL: vibe_score < -0.6
        - NEUTRAL: otherwise
    """
    
    # Signal thresholds
    BULLISH_THRESHOLD = 0.6
    BEARISH_THRESHOLD = -0.6
    
    # Alert history size
    HISTORY_SIZE = 50
    
    def __init__(self):
        self.alert_history: deque[Alert] = deque(maxlen=self.HISTORY_SIZE)
        self.last_signal: Signal = Signal.NEUTRAL
        self._total_alerts = 0
        self._bullish_count = 0
        self._bearish_count = 0
    
    def evaluate(
        self,
        vibe_score: float,
        average_sentiment: float,
        volume: int,
        tx_hash: Optional[str] = None
    ) -> Alert:
        """
        Evaluate vibe score and generate appropriate signal/alert.
        
        Args:
            vibe_score: Current aggregated vibe score (-1 to +1)
            average_sentiment: Raw sentiment average
            volume: Number of articles analyzed
            tx_hash: Optional blockchain transaction hash
            
        Returns:
            Alert object with signal and metadata
        """
        # Determine signal
        if vibe_score > self.BULLISH_THRESHOLD:
            signal = Signal.BULLISH
            self._bullish_count += 1
            logger.info(f"🟢 BULLISH_SIGNAL triggered: vibe={vibe_score:.4f}")
        elif vibe_score < self.BEARISH_THRESHOLD:
            signal = Signal.BEARISH
            self._bearish_count += 1
            logger.info(f"🔴 BEARISH_SIGNAL triggered: vibe={vibe_score:.4f}")
        else:
            signal = Signal.NEUTRAL
            logger.debug(f"⚪ NEUTRAL: vibe={vibe_score:.4f}")
        
        # Create alert
        alert = Alert(
            signal=signal,
            vibe_score=vibe_score,
            average_sentiment=average_sentiment,
            volume=volume,
            tx_hash=tx_hash
        )
        
        # Store in history
        self.alert_history.append(alert)
        self._total_alerts += 1
        self.last_signal = signal
        
        return alert
    
    def get_alerts(self, limit: int = 20) -> list[dict]:
        """Get recent alerts."""
        alerts = list(self.alert_history)[-limit:]
        return [a.to_dict() for a in reversed(alerts)]
    
    def get_latest_alert(self) -> Optional[dict]:
        """Get the most recent alert."""
        if self.alert_history:
            return self.alert_history[-1].to_dict()
        return None
    
    def get_stats(self) -> dict:
        """Get trigger statistics."""
        return {
            "total_evaluations": self._total_alerts,
            "bullish_signals": self._bullish_count,
            "bearish_signals": self._bearish_count,
            "neutral_count": self._total_alerts - self._bullish_count - self._bearish_count,
            "last_signal": self.last_signal.value,
            "history_size": len(self.alert_history),
            "thresholds": {
                "bullish": self.BULLISH_THRESHOLD,
                "bearish": self.BEARISH_THRESHOLD
            }
        }
    
    def clear_history(self):
        """Clear alert history (for testing)."""
        self.alert_history.clear()


# Global instance
triggers = TriggerEngine()
