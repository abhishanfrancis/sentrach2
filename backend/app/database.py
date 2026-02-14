"""
Database Models and Session Management

PostgreSQL models for persistent storage of sentiment data.
"""

from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, DateTime, 
    Boolean, Text, JSON, Index, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from sqlalchemy.pool import QueuePool
from contextlib import contextmanager
import enum
import logging

from app.config import config

logger = logging.getLogger(__name__)

Base = declarative_base()


class SignalType(enum.Enum):
    NEUTRAL = "NEUTRAL"
    BULLISH_SIGNAL = "BULLISH_SIGNAL"
    BEARISH_SIGNAL = "BEARISH_SIGNAL"


class SourceType(enum.Enum):
    NEWS = "news"
    TWITTER = "twitter"
    REDDIT = "reddit"
    DISCORD = "discord"


# ============================================
# DATABASE MODELS
# ============================================

class VibeScoreRecord(Base):
    """Historical vibe score records."""
    __tablename__ = "vibe_scores"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    vibe_score = Column(Float, nullable=False)
    average_sentiment = Column(Float)
    volume = Column(Integer)
    confidence = Column(Float)
    trend = Column(String(20))
    signal = Column(String(50))
    
    # Breakdown by source
    news_sentiment = Column(Float)
    twitter_sentiment = Column(Float)
    reddit_sentiment = Column(Float)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    tx_hash = Column(String(66))  # Blockchain tx if pushed
    
    __table_args__ = (
        Index("ix_vibe_scores_created_at_desc", created_at.desc()),
    )
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "vibe_score": self.vibe_score,
            "average_sentiment": self.average_sentiment,
            "volume": self.volume,
            "confidence": self.confidence,
            "trend": self.trend,
            "signal": self.signal,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "tx_hash": self.tx_hash
        }


class CoinSentimentRecord(Base):
    """Historical sentiment for individual coins."""
    __tablename__ = "coin_sentiments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(10), nullable=False, index=True)
    name = Column(String(50))
    vibe_score = Column(Float, nullable=False)
    sentiment_change_24h = Column(Float)
    volume = Column(Integer)
    signal = Column(String(50))
    price_correlation = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    __table_args__ = (
        Index("ix_coin_sentiments_symbol_created", symbol, created_at.desc()),
    )


class AlertRecord(Base):
    """Historical alerts/signals."""
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    signal = Column(String(50), nullable=False, index=True)
    vibe_score = Column(Float, nullable=False)
    average_sentiment = Column(Float)
    volume = Column(Integer)
    tx_hash = Column(String(66))
    triggered_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "signal": self.signal,
            "vibe_score": self.vibe_score,
            "tx_hash": self.tx_hash,
            "timestamp": self.triggered_at.isoformat() if self.triggered_at else None
        }


class ArticleRecord(Base):
    """Analyzed news articles."""
    __tablename__ = "articles"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String(100))
    title = Column(Text)
    description = Column(Text)
    url = Column(String(500), unique=True)
    published_at = Column(DateTime)
    
    # Sentiment analysis
    sentiment_score = Column(Float)
    sentiment_label = Column(String(20))
    analyzed_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index("ix_articles_url", url),
        Index("ix_articles_published", published_at.desc()),
    )


class SocialPostRecord(Base):
    """Analyzed social media posts."""
    __tablename__ = "social_posts"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    post_id = Column(String(100), unique=True)  # Platform post ID
    platform = Column(String(20), nullable=False)  # twitter, reddit, discord
    text = Column(Text)
    author = Column(String(100))
    
    # Engagement metrics
    likes = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    
    # Sentiment
    sentiment_score = Column(Float)
    engagement_weight = Column(Float)
    
    posted_at = Column(DateTime)
    analyzed_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    __table_args__ = (
        Index("ix_social_platform_posted", platform, posted_at.desc()),
    )


class APIKeyRecord(Base):
    """API keys for authentication."""
    __tablename__ = "api_keys"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    key_hash = Column(String(64), unique=True, nullable=False)  # SHA256 hash
    name = Column(String(100))
    owner = Column(String(100))
    
    # Permissions
    can_read = Column(Boolean, default=True)
    can_write = Column(Boolean, default=False)
    rate_limit = Column(Integer, default=100)  # Requests per minute
    
    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime)
    expires_at = Column(DateTime)


# ============================================
# DATABASE SESSION MANAGEMENT
# ============================================

class DatabaseManager:
    """Manages database connections and sessions."""
    
    def __init__(self):
        self.engine = None
        self.SessionLocal = None
        self._initialized = False
    
    def init(self, database_url: str = None):
        """Initialize database connection."""
        url = database_url or config.DATABASE_URL
        
        if not url:
            logger.warning("No DATABASE_URL configured, database features disabled")
            return False
        
        try:
            self.engine = create_engine(
                url,
                poolclass=QueuePool,
                pool_size=config.DATABASE_POOL_SIZE,
                max_overflow=config.DATABASE_MAX_OVERFLOW,
                pool_pre_ping=True,  # Test connections before use
                echo=config.DEBUG
            )
            
            self.SessionLocal = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self.engine
            )
            
            # Create tables
            Base.metadata.create_all(bind=self.engine)
            
            self._initialized = True
            logger.info("Database initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            return False
    
    @property
    def is_initialized(self) -> bool:
        return self._initialized
    
    @contextmanager
    def get_session(self):
        """Context manager for database sessions."""
        if not self._initialized:
            raise RuntimeError("Database not initialized")
        
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()
    
    def get_db(self) -> Session:
        """Dependency for FastAPI routes."""
        if not self._initialized:
            return None
        
        session = self.SessionLocal()
        try:
            yield session
        finally:
            session.close()


# ============================================
# REPOSITORY FUNCTIONS
# ============================================

class VibeScoreRepository:
    """Repository for vibe score operations."""
    
    def __init__(self, db: DatabaseManager):
        self.db = db
    
    def save(self, vibe_score: float, **kwargs) -> Optional[VibeScoreRecord]:
        """Save a new vibe score record."""
        if not self.db.is_initialized:
            return None
        
        with self.db.get_session() as session:
            record = VibeScoreRecord(
                vibe_score=vibe_score,
                **kwargs
            )
            session.add(record)
            session.flush()
            return record
    
    def get_history(self, limit: int = 100) -> List[VibeScoreRecord]:
        """Get recent vibe score history."""
        if not self.db.is_initialized:
            return []
        
        with self.db.get_session() as session:
            return session.query(VibeScoreRecord)\
                .order_by(VibeScoreRecord.created_at.desc())\
                .limit(limit)\
                .all()
    
    def get_average(self, hours: int = 24) -> Optional[float]:
        """Get average vibe score over time period."""
        if not self.db.is_initialized:
            return None
        
        from sqlalchemy import func
        cutoff = datetime.utcnow() - __import__("datetime").timedelta(hours=hours)
        
        with self.db.get_session() as session:
            result = session.query(func.avg(VibeScoreRecord.vibe_score))\
                .filter(VibeScoreRecord.created_at >= cutoff)\
                .scalar()
            return result


class AlertRepository:
    """Repository for alert operations."""
    
    def __init__(self, db: DatabaseManager):
        self.db = db
    
    def save(self, signal: str, vibe_score: float, **kwargs) -> Optional[AlertRecord]:
        """Save a new alert."""
        if not self.db.is_initialized:
            return None
        
        with self.db.get_session() as session:
            record = AlertRecord(
                signal=signal,
                vibe_score=vibe_score,
                **kwargs
            )
            session.add(record)
            session.flush()
            return record
    
    def get_recent(self, limit: int = 20) -> List[AlertRecord]:
        """Get recent alerts."""
        if not self.db.is_initialized:
            return []
        
        with self.db.get_session() as session:
            return session.query(AlertRecord)\
                .order_by(AlertRecord.triggered_at.desc())\
                .limit(limit)\
                .all()


# Global instances
db_manager = DatabaseManager()
vibe_repo = VibeScoreRepository(db_manager)
alert_repo = AlertRepository(db_manager)
