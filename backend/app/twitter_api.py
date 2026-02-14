"""
Real Twitter/X API Integration

Fetches real tweets using Twitter API v2 for sentiment analysis.
"""

import asyncio
import aiohttp
from datetime import datetime, timedelta
from typing import List, Optional
from dataclasses import dataclass
import logging

from app.config import config

logger = logging.getLogger(__name__)


@dataclass
class Tweet:
    """Represents a tweet from the API."""
    id: str
    text: str
    author_id: str
    author_username: str
    created_at: datetime
    retweet_count: int
    like_count: int
    reply_count: int
    
    @property
    def engagement(self) -> int:
        return self.retweet_count + self.like_count + self.reply_count
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "text": self.text,
            "author": self.author_username,
            "created_at": self.created_at.isoformat(),
            "engagement": self.engagement,
            "metrics": {
                "retweets": self.retweet_count,
                "likes": self.like_count,
                "replies": self.reply_count
            }
        }


class TwitterClient:
    """
    Twitter API v2 client for fetching crypto-related tweets.
    
    Requires:
    - Bearer Token from Twitter Developer Portal
    - Elevated access for search endpoints
    """
    
    BASE_URL = "https://api.twitter.com/2"
    
    def __init__(self):
        self.bearer_token = config.TWITTER_BEARER_TOKEN
        self._session: Optional[aiohttp.ClientSession] = None
        self._rate_limit_remaining = 450  # Default for search
        self._rate_limit_reset = None
        
    @property
    def is_configured(self) -> bool:
        return bool(self.bearer_token)
    
    @property
    def headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.bearer_token}",
            "Content-Type": "application/json"
        }
    
    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(headers=self.headers)
        return self._session
    
    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()
    
    async def search_tweets(
        self,
        query: str = "bitcoin OR ethereum OR crypto",
        max_results: int = 100,
        lang: str = "en"
    ) -> List[Tweet]:
        """
        Search recent tweets using Twitter API v2.
        
        Args:
            query: Search query (supports operators like OR, AND, -excludes)
            max_results: Maximum tweets to return (10-100)
            lang: Language filter
            
        Returns:
            List of Tweet objects
        """
        if not self.is_configured:
            logger.warning("Twitter API not configured, returning empty list")
            return []
        
        # Check rate limits
        if self._rate_limit_remaining <= 0 and self._rate_limit_reset:
            wait_time = (self._rate_limit_reset - datetime.utcnow()).total_seconds()
            if wait_time > 0:
                logger.warning(f"Rate limited, waiting {wait_time:.0f}s")
                await asyncio.sleep(min(wait_time, 60))
        
        try:
            session = await self._get_session()
            
            # Build query with filters
            full_query = f"{query} lang:{lang} -is:retweet -is:reply"
            
            params = {
                "query": full_query,
                "max_results": min(max_results, 100),
                "tweet.fields": "created_at,public_metrics,author_id",
                "expansions": "author_id",
                "user.fields": "username"
            }
            
            async with session.get(
                f"{self.BASE_URL}/tweets/search/recent",
                params=params
            ) as response:
                # Track rate limits
                self._rate_limit_remaining = int(
                    response.headers.get("x-rate-limit-remaining", 450)
                )
                reset_ts = response.headers.get("x-rate-limit-reset")
                if reset_ts:
                    self._rate_limit_reset = datetime.fromtimestamp(int(reset_ts))
                
                if response.status == 429:
                    logger.warning("Twitter rate limit exceeded")
                    return []
                
                if response.status != 200:
                    logger.error(f"Twitter API error: {response.status}")
                    return []
                
                data = await response.json()
                
                if "data" not in data:
                    return []
                
                # Build username lookup
                users = {}
                if "includes" in data and "users" in data["includes"]:
                    for user in data["includes"]["users"]:
                        users[user["id"]] = user["username"]
                
                # Parse tweets
                tweets = []
                for tweet_data in data["data"]:
                    metrics = tweet_data.get("public_metrics", {})
                    
                    tweets.append(Tweet(
                        id=tweet_data["id"],
                        text=tweet_data["text"],
                        author_id=tweet_data["author_id"],
                        author_username=users.get(tweet_data["author_id"], "unknown"),
                        created_at=datetime.fromisoformat(
                            tweet_data["created_at"].replace("Z", "+00:00")
                        ),
                        retweet_count=metrics.get("retweet_count", 0),
                        like_count=metrics.get("like_count", 0),
                        reply_count=metrics.get("reply_count", 0)
                    ))
                
                logger.info(f"Fetched {len(tweets)} tweets from Twitter")
                return tweets
                
        except aiohttp.ClientError as e:
            logger.error(f"Twitter API request failed: {e}")
            return []
        except Exception as e:
            logger.error(f"Twitter fetch error: {e}")
            return []
    
    async def get_trending_crypto(self) -> List[str]:
        """
        Get trending crypto hashtags/topics.
        Requires elevated API access.
        """
        # This requires Twitter API v2 trends endpoint
        # For now, return common crypto topics
        return [
            "#Bitcoin", "#Ethereum", "#Crypto", "#BTC", "#ETH",
            "#Solana", "#DeFi", "#NFT", "#Web3", "#Blockchain"
        ]
    
    def get_status(self) -> dict:
        return {
            "configured": self.is_configured,
            "rate_limit_remaining": self._rate_limit_remaining,
            "rate_limit_reset": self._rate_limit_reset.isoformat() if self._rate_limit_reset else None
        }


# Singleton instance
twitter_client = TwitterClient()
