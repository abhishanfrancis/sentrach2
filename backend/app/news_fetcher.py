"""
Cryptocurrency News Fetcher using NewsAPI
With cooldown mechanism and caching.
"""

import asyncio
import httpx
from typing import List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
import logging

from app.config import config

logger = logging.getLogger(__name__)

NEWSAPI_BASE_URL = "https://newsapi.org/v2/everything"


@dataclass
class Article:
    """Represents a news article."""
    title: str
    description: str
    text: str  # Combined title + description
    published_at: datetime
    source: str


class AsyncNewsFetcher:
    """
    Async news fetcher with cooldown and caching.
    
    - Fetches from NewsAPI only once every cooldown_seconds.
    - Caches results in memory.
    - Returns cached data during cooldown period.
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        cooldown_seconds: int = 60
    ):
        self.api_key = api_key or config.NEWS_API_KEY
        self.cooldown_seconds = cooldown_seconds
        
        # Cache
        self._cached_articles: List[Article] = []
        self._last_fetch_time: Optional[datetime] = None
        
        # Lock to prevent concurrent fetches
        self._fetch_lock = asyncio.Lock()
    
    @property
    def is_configured(self) -> bool:
        """Check if API key is configured."""
        return bool(self.api_key)
    
    @property
    def is_on_cooldown(self) -> bool:
        """Check if we're still in cooldown period."""
        if self._last_fetch_time is None:
            return False
        
        elapsed = (datetime.utcnow() - self._last_fetch_time).total_seconds()
        return elapsed < self.cooldown_seconds
    
    @property
    def seconds_until_next_fetch(self) -> int:
        """Seconds remaining until next fetch is allowed."""
        if self._last_fetch_time is None:
            return 0
        
        elapsed = (datetime.utcnow() - self._last_fetch_time).total_seconds()
        remaining = self.cooldown_seconds - elapsed
        return max(0, int(remaining))
    
    async def fetch_news(
        self,
        query: str = None,
        max_results: int = None,
        force: bool = False
    ) -> List[Article]:
        """
        Fetch crypto news articles.
        
        Args:
            query: Search query (default from config)
            max_results: Max articles to fetch (default from config)
            force: Force fetch even during cooldown
            
        Returns:
            List of Article objects (from cache if on cooldown)
        """
        query = query or config.NEWS_QUERY
        max_results = max_results or config.NEWS_MAX_ARTICLES
        
        # Return cached if on cooldown (unless forced)
        if not force and self.is_on_cooldown:
            logger.debug(
                f"On cooldown, returning cached ({len(self._cached_articles)} articles). "
                f"Next fetch in {self.seconds_until_next_fetch}s"
            )
            return self._cached_articles
        
        # Prevent concurrent fetches
        async with self._fetch_lock:
            # Double-check after acquiring lock
            if not force and self.is_on_cooldown:
                return self._cached_articles
            
            return await self._do_fetch(query, max_results)
    
    async def _do_fetch(self, query: str, max_results: int) -> List[Article]:
        """Actually perform the API fetch."""
        if not self.is_configured:
            logger.warning("NEWS_API_KEY not configured, returning empty list")
            return []
        
        from_date = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
        
        params = {
            "q": query,
            "apiKey": self.api_key,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": max_results,
            "from": from_date
        }
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(NEWSAPI_BASE_URL, params=params)
                response.raise_for_status()
                data = response.json()
            
            if data.get("status") != "ok":
                logger.error(f"NewsAPI error: {data.get('message')}")
                return self._cached_articles  # Return stale cache on error
            
            articles = self._parse_articles(data.get("articles", []))
            
            # Update cache
            self._cached_articles = articles
            self._last_fetch_time = datetime.utcnow()
            
            logger.info(f"Fetched {len(articles)} articles from NewsAPI")
            return articles
            
        except httpx.HTTPStatusError as e:
            logger.error(f"NewsAPI HTTP error: {e.response.status_code}")
            return self._cached_articles
        except httpx.RequestError as e:
            logger.error(f"NewsAPI request error: {e}")
            return self._cached_articles
        except Exception as e:
            logger.error(f"NewsAPI unexpected error: {e}")
            return self._cached_articles
    
    def _parse_articles(self, raw_articles: List[dict]) -> List[Article]:
        """Parse raw API response into Article objects."""
        articles = []
        
        for item in raw_articles:
            title = (item.get("title") or "").strip()
            description = (item.get("description") or "").strip()
            
            if not title or title == "[Removed]":
                continue
            
            # Clean description
            if description == "[Removed]":
                description = ""
            
            # Combine for analysis
            if description and description != title:
                text = f"{title}. {description}"
            else:
                text = title
            
            # Parse date
            try:
                published = datetime.fromisoformat(
                    item.get("publishedAt", "").replace("Z", "+00:00")
                )
            except:
                published = datetime.utcnow()
            
            articles.append(Article(
                title=title,
                description=description,
                text=text,
                published_at=published,
                source=item.get("source", {}).get("name", "Unknown")
            ))
        
        return articles
    
    def get_cached_texts(self) -> List[str]:
        """Get combined text from cached articles (for sentiment analysis)."""
        return [a.text for a in self._cached_articles]
    
    def clear_cache(self) -> None:
        """Clear cached articles and reset cooldown."""
        self._cached_articles = []
        self._last_fetch_time = None


# Global singleton instance
news_fetcher = AsyncNewsFetcher(
    cooldown_seconds=config.NEWS_FETCH_INTERVAL
)
