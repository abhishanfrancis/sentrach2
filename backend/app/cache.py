"""
Redis Caching Layer

Provides caching for API responses and rate limiting.
"""

import json
from datetime import datetime, timedelta
from typing import Any, Optional, Callable
from functools import wraps
import logging
import hashlib

from app.config import config

logger = logging.getLogger(__name__)

# Try to import redis, fallback to in-memory cache if not available
try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("Redis not installed, using in-memory fallback")


class InMemoryCache:
    """Simple in-memory cache fallback when Redis is not available."""
    
    def __init__(self):
        self._cache: dict = {}
        self._expires: dict = {}
    
    async def get(self, key: str) -> Optional[str]:
        if key in self._expires:
            if datetime.utcnow() > self._expires[key]:
                del self._cache[key]
                del self._expires[key]
                return None
        return self._cache.get(key)
    
    async def set(self, key: str, value: str, ex: int = None):
        self._cache[key] = value
        if ex:
            self._expires[key] = datetime.utcnow() + timedelta(seconds=ex)
    
    async def delete(self, key: str):
        self._cache.pop(key, None)
        self._expires.pop(key, None)
    
    async def incr(self, key: str) -> int:
        value = int(self._cache.get(key, 0)) + 1
        self._cache[key] = str(value)
        return value
    
    async def expire(self, key: str, seconds: int):
        self._expires[key] = datetime.utcnow() + timedelta(seconds=seconds)
    
    async def ttl(self, key: str) -> int:
        if key in self._expires:
            remaining = (self._expires[key] - datetime.utcnow()).total_seconds()
            return max(0, int(remaining))
        return -1
    
    async def close(self):
        pass


class CacheManager:
    """
    Redis cache manager with in-memory fallback.
    
    Supports:
    - Key-value caching with TTL
    - Rate limiting
    - Cache invalidation
    """
    
    CACHE_PREFIX = "sentiment_oracle:"
    
    def __init__(self):
        self._client = None
        self._initialized = False
        self._using_redis = False
    
    async def init(self, redis_url: str = None):
        """Initialize cache connection."""
        url = redis_url or config.REDIS_URL
        
        if url and REDIS_AVAILABLE:
            try:
                self._client = redis.from_url(
                    url,
                    encoding="utf-8",
                    decode_responses=True
                )
                # Test connection
                await self._client.ping()
                self._using_redis = True
                self._initialized = True
                logger.info("Redis cache initialized")
                return True
            except Exception as e:
                logger.warning(f"Redis connection failed: {e}, using in-memory cache")
        
        # Fallback to in-memory
        self._client = InMemoryCache()
        self._using_redis = False
        self._initialized = True
        logger.info("Using in-memory cache fallback")
        return True
    
    async def close(self):
        """Close cache connection."""
        if self._client:
            await self._client.close()
    
    @property
    def is_initialized(self) -> bool:
        return self._initialized
    
    def _make_key(self, key: str) -> str:
        """Create prefixed cache key."""
        return f"{self.CACHE_PREFIX}{key}"
    
    async def get(self, key: str) -> Optional[Any]:
        """Get cached value."""
        if not self._initialized:
            return None
        
        try:
            data = await self._client.get(self._make_key(key))
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None
    
    async def set(
        self, 
        key: str, 
        value: Any, 
        ttl: int = None
    ):
        """Set cached value with optional TTL."""
        if not self._initialized:
            return
        
        ttl = ttl or config.CACHE_TTL
        
        try:
            data = json.dumps(value, default=str)
            await self._client.set(self._make_key(key), data, ex=ttl)
        except Exception as e:
            logger.error(f"Cache set error: {e}")
    
    async def delete(self, key: str):
        """Delete cached value."""
        if not self._initialized:
            return
        
        try:
            await self._client.delete(self._make_key(key))
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
    
    async def invalidate_pattern(self, pattern: str):
        """Invalidate all keys matching pattern."""
        if not self._initialized or not self._using_redis:
            return
        
        try:
            keys = await self._client.keys(f"{self.CACHE_PREFIX}{pattern}")
            if keys:
                await self._client.delete(*keys)
        except Exception as e:
            logger.error(f"Cache invalidate error: {e}")
    
    # ================================
    # RATE LIMITING
    # ================================
    
    async def check_rate_limit(
        self,
        identifier: str,
        max_requests: int = None,
        window_seconds: int = None
    ) -> tuple[bool, int, int]:
        """
        Check if rate limit is exceeded.
        
        Args:
            identifier: Unique identifier (IP, API key, etc.)
            max_requests: Maximum requests allowed
            window_seconds: Time window in seconds
            
        Returns:
            (allowed, remaining, reset_in)
        """
        if not self._initialized:
            return (True, max_requests or 100, 0)
        
        max_requests = max_requests or config.RATE_LIMIT_REQUESTS
        window_seconds = window_seconds or config.RATE_LIMIT_WINDOW
        
        key = f"ratelimit:{identifier}"
        
        try:
            current = await self._client.incr(self._make_key(key))
            
            if current == 1:
                # First request, set expiry
                await self._client.expire(self._make_key(key), window_seconds)
            
            ttl = await self._client.ttl(self._make_key(key))
            remaining = max(0, max_requests - current)
            
            return (current <= max_requests, remaining, ttl)
            
        except Exception as e:
            logger.error(f"Rate limit check error: {e}")
            return (True, max_requests, 0)
    
    # ================================
    # CACHE DECORATOR
    # ================================
    
    def cached(self, ttl: int = None, key_prefix: str = ""):
        """
        Decorator to cache function results.
        
        Usage:
            @cache.cached(ttl=60, key_prefix="vibe")
            async def get_vibe():
                ...
        """
        def decorator(func: Callable):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Generate cache key from function name and args
                key_parts = [key_prefix, func.__name__]
                if args:
                    key_parts.extend(str(a) for a in args)
                if kwargs:
                    key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
                
                cache_key = ":".join(key_parts)
                key_hash = hashlib.md5(cache_key.encode()).hexdigest()[:16]
                full_key = f"{key_prefix}:{func.__name__}:{key_hash}"
                
                # Try to get from cache
                cached = await self.get(full_key)
                if cached is not None:
                    return cached
                
                # Execute function and cache result
                result = await func(*args, **kwargs)
                await self.set(full_key, result, ttl=ttl)
                
                return result
            
            return wrapper
        return decorator
    
    def get_status(self) -> dict:
        return {
            "initialized": self._initialized,
            "using_redis": self._using_redis,
            "redis_url": bool(config.REDIS_URL)
        }


# Global instance
cache = CacheManager()
