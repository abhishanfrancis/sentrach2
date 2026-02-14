from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SocialPost(BaseModel):
    id: str
    username: str
    content: str
    timestamp: datetime
    sentiment_score: Optional[float] = None
    sentiment_label: Optional[str] = None

class VibeScore(BaseModel):
    score: float              # -1 to +1 (EMA-weighted)
    label: str                # "Bearish", "Neutral", "Bullish"
    post_count: int
    last_updated: datetime
    confidence: float         # 0-100% confidence level
    volume_index: float       # Normalized activity metric
    trend_direction: str      # "UP" | "DOWN" | "STABLE"

class SentimentUpdate(BaseModel):
    post: SocialPost
    vibe_score: VibeScore

class BlockchainTx(BaseModel):
    tx_hash: str
    score_pushed: int
    timestamp: datetime
    status: str
