"""
Social Media Sentiment Aggregator

Simulates social sentiment from Twitter, Reddit, and Discord
for hackathon demo purposes.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List
from collections import deque
import random
import math
import logging

logger = logging.getLogger(__name__)


@dataclass
class SocialPost:
    """Represents a social media post."""
    platform: str
    text: str
    sentiment: float
    engagement: int
    timestamp: datetime
    
    def to_dict(self) -> dict:
        return {
            "platform": self.platform,
            "text": self.text[:100] + "..." if len(self.text) > 100 else self.text,
            "sentiment": round(self.sentiment, 4),
            "engagement": self.engagement,
            "timestamp": self.timestamp.isoformat()
        }


@dataclass
class PlatformMetrics:
    """Metrics for a social platform."""
    platform: str
    sentiment: float
    post_count: int
    total_engagement: int
    trending_topics: List[str]
    sentiment_breakdown: Dict[str, int]  # positive/negative/neutral counts
    
    def to_dict(self) -> dict:
        return {
            "platform": self.platform,
            "sentiment": round(self.sentiment, 4),
            "post_count": self.post_count,
            "total_engagement": self.total_engagement,
            "trending_topics": self.trending_topics,
            "sentiment_breakdown": self.sentiment_breakdown
        }


# Simulated tweet templates
TWEET_TEMPLATES = {
    "positive": [
        "🚀 $BTC looking strong today! Moon soon?",
        "Just bought more $ETH, feeling bullish! 💎🙌",
        "The crypto market is about to explode! NFA but DYOR",
        "$SOL ecosystem is fire right now 🔥",
        "Diamond hands paying off! $BTC to 100k!",
        "Institutional adoption is here. Bullish AF 📈",
        "Web3 is the future. Load up on $ETH while you can!",
    ],
    "negative": [
        "$BTC dumping hard. Is this the end? 😰",
        "Sold everything. This market is dead 💀",
        "Another rug pull. Crypto is a scam",
        "Worst week ever for my portfolio 📉",
        "Why did I buy the top? $ETH bleeding out",
        "Bear market confirmed. See you in 4 years",
        "Lost half my portfolio. Should have listened",
    ],
    "neutral": [
        "Watching the charts. Interesting price action 👀",
        "What do you guys think about $BTC right now?",
        "Market seems uncertain. Waiting for direction",
        "HODL or sell? Can't decide 🤔",
        "Crypto Twitter is quiet today",
        "Just DCA and chill. NFA",
    ]
}

# Reddit post templates
REDDIT_TEMPLATES = {
    "positive": [
        "[Discussion] Why I'm extremely bullish on crypto right now",
        "BTC technical analysis shows massive breakout incoming",
        "ETH 2.0 is undervalued - here's my thesis",
        "Just hit my portfolio goal! Thanks to this community",
        "Institutions are quietly accumulating - proof inside",
    ],
    "negative": [
        "Am I the only one worried about this market?",
        "Realistic bear case for BTC - unpopular opinion",
        "Lost my life savings in crypto. AMA",
        "This pump feels fake. Expecting dump soon",
        "Crypto winter is back. Here's why",
    ],
    "neutral": [
        "Weekly Discussion Thread - Share your thoughts",
        "New to crypto - what should I know?",
        "Technical analysis request for BTC",
        "What's your average buy price? Curious",
    ]
}


class SocialSentimentAggregator:
    """
    Aggregates sentiment from multiple social platforms.
    Uses simulated data for hackathon demo.
    """
    
    def __init__(self):
        self.posts: deque = deque(maxlen=100)
        self.platform_metrics: Dict[str, PlatformMetrics] = {}
        self._base_sentiment: float = 0.0
        self._last_update: datetime = datetime.utcnow()
        
        # Initialize platforms
        for platform in ["twitter", "reddit", "discord"]:
            self.platform_metrics[platform] = PlatformMetrics(
                platform=platform,
                sentiment=0.0,
                post_count=0,
                total_engagement=0,
                trending_topics=[],
                sentiment_breakdown={"positive": 0, "negative": 0, "neutral": 0}
            )
    
    def generate_posts(self, base_sentiment: float, count: int = 50) -> List[SocialPost]:
        """
        Generate simulated social posts based on market sentiment.
        
        Args:
            base_sentiment: Market sentiment to bias posts towards
            count: Number of posts to generate
        """
        self._base_sentiment = base_sentiment
        posts = []
        
        # Determine distribution based on sentiment
        if base_sentiment > 0.3:
            pos_prob, neg_prob = 0.6, 0.2
        elif base_sentiment < -0.3:
            pos_prob, neg_prob = 0.2, 0.6
        else:
            pos_prob, neg_prob = 0.35, 0.35
        
        for _ in range(count):
            # Choose platform
            platform = random.choices(
                ["twitter", "reddit", "discord"],
                weights=[0.5, 0.3, 0.2]
            )[0]
            
            # Determine sentiment type
            rand = random.random()
            if rand < pos_prob:
                sentiment_type = "positive"
                sentiment = random.uniform(0.3, 1.0)
            elif rand < pos_prob + neg_prob:
                sentiment_type = "negative"
                sentiment = random.uniform(-1.0, -0.3)
            else:
                sentiment_type = "neutral"
                sentiment = random.uniform(-0.3, 0.3)
            
            # Get text template
            if platform == "twitter":
                templates = TWEET_TEMPLATES[sentiment_type]
            elif platform == "reddit":
                templates = REDDIT_TEMPLATES.get(sentiment_type, TWEET_TEMPLATES[sentiment_type])
            else:  # discord
                templates = TWEET_TEMPLATES[sentiment_type]
            
            text = random.choice(templates)
            
            # Generate engagement based on sentiment strength
            base_engagement = random.randint(10, 500)
            engagement = int(base_engagement * (1 + abs(sentiment)))
            
            post = SocialPost(
                platform=platform,
                text=text,
                sentiment=sentiment,
                engagement=engagement,
                timestamp=datetime.utcnow() - timedelta(minutes=random.randint(0, 60))
            )
            posts.append(post)
        
        # Update internal state
        self.posts.clear()
        self.posts.extend(posts)
        self._update_platform_metrics()
        self._last_update = datetime.utcnow()
        
        return posts
    
    def _update_platform_metrics(self):
        """Update metrics for each platform."""
        platform_posts: Dict[str, List[SocialPost]] = {
            "twitter": [], "reddit": [], "discord": []
        }
        
        for post in self.posts:
            platform_posts[post.platform].append(post)
        
        trending = ["#BTC", "#ETH", "#Crypto", "#Web3", "#DeFi", "#NFT", "#HODL"]
        
        for platform, posts in platform_posts.items():
            if not posts:
                continue
            
            total_sentiment = sum(p.sentiment for p in posts)
            total_engagement = sum(p.engagement for p in posts)
            
            positive = sum(1 for p in posts if p.sentiment > 0.3)
            negative = sum(1 for p in posts if p.sentiment < -0.3)
            neutral = len(posts) - positive - negative
            
            self.platform_metrics[platform] = PlatformMetrics(
                platform=platform,
                sentiment=total_sentiment / len(posts),
                post_count=len(posts),
                total_engagement=total_engagement,
                trending_topics=random.sample(trending, k=min(5, len(trending))),
                sentiment_breakdown={
                    "positive": positive,
                    "negative": negative,
                    "neutral": neutral
                }
            )
    
    def get_combined_sentiment(self) -> dict:
        """Get weighted combined sentiment from all platforms."""
        weights = {"twitter": 0.55, "reddit": 0.25, "discord": 0.20}
        
        total_weight = 0
        weighted_sentiment = 0
        total_posts = 0
        total_engagement = 0
        
        for platform, metrics in self.platform_metrics.items():
            weight = weights.get(platform, 0.1)
            weighted_sentiment += metrics.sentiment * weight
            total_weight += weight
            total_posts += metrics.post_count
            total_engagement += metrics.total_engagement
        
        combined = weighted_sentiment / total_weight if total_weight > 0 else 0
        
        return {
            "combined_sentiment": round(combined, 4),
            "total_posts": total_posts,
            "total_engagement": total_engagement,
            "platform_breakdown": {
                p: m.to_dict() for p, m in self.platform_metrics.items()
            },
            "last_updated": self._last_update.isoformat()
        }
    
    def get_recent_posts(self, limit: int = 20) -> List[dict]:
        """Get recent posts."""
        posts = list(self.posts)[-limit:]
        return [p.to_dict() for p in reversed(posts)]
    
    def get_viral_posts(self, limit: int = 5) -> List[dict]:
        """Get posts with highest engagement."""
        posts = sorted(self.posts, key=lambda x: x.engagement, reverse=True)
        return [p.to_dict() for p in posts[:limit]]
    
    def get_sentiment_timeline(self) -> List[dict]:
        """Get sentiment distribution over time."""
        # Group by 5-minute intervals
        timeline = []
        now = datetime.utcnow()
        
        for i in range(12):  # Last 60 minutes in 5-minute intervals
            start = now - timedelta(minutes=(i + 1) * 5)
            end = now - timedelta(minutes=i * 5)
            
            interval_posts = [
                p for p in self.posts 
                if start <= p.timestamp < end
            ]
            
            if interval_posts:
                avg_sentiment = sum(p.sentiment for p in interval_posts) / len(interval_posts)
            else:
                avg_sentiment = 0
            
            timeline.append({
                "time": end.strftime("%H:%M"),
                "sentiment": round(avg_sentiment, 4),
                "post_count": len(interval_posts)
            })
        
        return list(reversed(timeline))


# Global instance
social_sentiment = SocialSentimentAggregator()
