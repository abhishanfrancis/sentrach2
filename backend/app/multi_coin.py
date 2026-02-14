"""
Multi-Coin Sentiment Tracker

Tracks sentiment for multiple cryptocurrencies simultaneously.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional
from collections import deque
import random
import math
import logging

from app.config import config

logger = logging.getLogger(__name__)


@dataclass
class CoinSentiment:
    """Sentiment data for a single coin."""
    symbol: str
    name: str
    vibe_score: float
    sentiment_change_24h: float
    volume: int
    signal: str
    price_correlation: float  # Correlation between sentiment and price
    last_updated: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> dict:
        return {
            "symbol": self.symbol,
            "name": self.name,
            "vibe_score": round(self.vibe_score, 4),
            "sentiment_change_24h": round(self.sentiment_change_24h, 2),
            "volume": self.volume,
            "signal": self.signal,
            "price_correlation": round(self.price_correlation, 2),
            "last_updated": self.last_updated.isoformat()
        }


# Coin metadata
COIN_INFO = {
    "BTC": {"name": "Bitcoin", "base_sentiment": 0.1},
    "ETH": {"name": "Ethereum", "base_sentiment": 0.15},
    "SOL": {"name": "Solana", "base_sentiment": 0.0},
    "DOGE": {"name": "Dogecoin", "base_sentiment": -0.1},
    "XRP": {"name": "Ripple", "base_sentiment": 0.05},
    "ADA": {"name": "Cardano", "base_sentiment": 0.0},
    "AVAX": {"name": "Avalanche", "base_sentiment": 0.1},
    "DOT": {"name": "Polkadot", "base_sentiment": 0.05},
}


class MultiCoinTracker:
    """
    Tracks sentiment across multiple cryptocurrencies.
    Uses a combination of real news data and simulated variations.
    """
    
    def __init__(self):
        self.coins: Dict[str, CoinSentiment] = {}
        self.history: Dict[str, deque] = {}
        self._base_vibe: float = 0.0  # Base vibe from news
        
        # Initialize tracked coins
        for symbol in config.TRACKED_COINS:
            if symbol in COIN_INFO:
                info = COIN_INFO[symbol]
                self.coins[symbol] = CoinSentiment(
                    symbol=symbol,
                    name=info["name"],
                    vibe_score=0.0,
                    sentiment_change_24h=0.0,
                    volume=0,
                    signal="NEUTRAL",
                    price_correlation=0.0
                )
                self.history[symbol] = deque(maxlen=100)
    
    def update_from_base_sentiment(self, base_vibe: float, volume: int):
        """
        Update all coins based on a base sentiment score.
        Each coin has its own variation from the base.
        
        Args:
            base_vibe: Base vibe score from news (-1 to +1)
            volume: Number of articles analyzed
        """
        self._base_vibe = base_vibe
        
        for symbol, coin in self.coins.items():
            info = COIN_INFO[symbol]
            
            # Calculate coin-specific sentiment
            # Add base bias + random variation + market correlation
            variation = random.gauss(0, 0.15)  # Random noise
            base_bias = info["base_sentiment"]
            
            # Market correlation: coins tend to move together
            market_correlation = base_vibe * random.uniform(0.5, 1.0)
            
            # Final score
            new_score = base_vibe + base_bias + variation + (market_correlation * 0.3)
            new_score = max(-1, min(1, new_score))  # Clamp
            
            # Calculate 24h change (from history)
            old_score = coin.vibe_score
            if self.history[symbol]:
                # Get score from ~24 "hours" ago (or oldest available)
                old_idx = min(24, len(self.history[symbol]))
                history_list = list(self.history[symbol])
                if old_idx > 0:
                    old_score = history_list[-old_idx]["vibe_score"]
            
            change_24h = (new_score - old_score) * 100  # Percentage points
            
            # Determine signal
            if new_score > 0.6:
                signal = "BULLISH_SIGNAL"
            elif new_score < -0.6:
                signal = "BEARISH_SIGNAL"
            else:
                signal = "NEUTRAL"
            
            # Calculate price correlation (simulated)
            correlation = 0.5 + random.uniform(-0.3, 0.4)
            
            # Update coin
            coin.vibe_score = new_score
            coin.sentiment_change_24h = change_24h
            coin.volume = volume + random.randint(-5, 10)
            coin.signal = signal
            coin.price_correlation = correlation
            coin.last_updated = datetime.utcnow()
            
            # Store in history
            self.history[symbol].append(coin.to_dict())
        
        logger.info(f"Updated {len(self.coins)} coins from base vibe {base_vibe:.4f}")
    
    def get_coin(self, symbol: str) -> Optional[dict]:
        """Get sentiment for a specific coin."""
        if symbol in self.coins:
            return self.coins[symbol].to_dict()
        return None
    
    def get_all_coins(self) -> List[dict]:
        """Get sentiment for all tracked coins."""
        return [coin.to_dict() for coin in self.coins.values()]
    
    def get_heatmap(self) -> dict:
        """
        Get heatmap data for visualization.
        Returns coins sorted by sentiment.
        """
        coins = self.get_all_coins()
        coins.sort(key=lambda x: x["vibe_score"], reverse=True)
        
        return {
            "coins": coins,
            "most_bullish": coins[0] if coins else None,
            "most_bearish": coins[-1] if coins else None,
            "average_sentiment": sum(c["vibe_score"] for c in coins) / len(coins) if coins else 0
        }
    
    def get_coin_history(self, symbol: str, limit: int = 20) -> List[dict]:
        """Get historical sentiment for a coin."""
        if symbol not in self.history:
            return []
        return list(self.history[symbol])[-limit:]
    
    def get_market_summary(self) -> dict:
        """Get overall market sentiment summary."""
        coins = self.get_all_coins()
        
        bullish_count = sum(1 for c in coins if c["signal"] == "BULLISH_SIGNAL")
        bearish_count = sum(1 for c in coins if c["signal"] == "BEARISH_SIGNAL")
        
        avg_sentiment = sum(c["vibe_score"] for c in coins) / len(coins) if coins else 0
        
        # Market mood
        if avg_sentiment > 0.3:
            market_mood = "GREEDY"
        elif avg_sentiment > 0:
            market_mood = "OPTIMISTIC"
        elif avg_sentiment > -0.3:
            market_mood = "FEARFUL"
        else:
            market_mood = "PANIC"
        
        return {
            "total_coins": len(coins),
            "bullish_coins": bullish_count,
            "bearish_coins": bearish_count,
            "neutral_coins": len(coins) - bullish_count - bearish_count,
            "average_sentiment": round(avg_sentiment, 4),
            "market_mood": market_mood,
            "fear_greed_index": int((avg_sentiment + 1) * 50),  # 0-100 scale
            "timestamp": datetime.utcnow().isoformat()
        }


# Global instance
multi_coin = MultiCoinTracker()
