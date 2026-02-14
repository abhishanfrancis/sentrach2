"""
API Authentication & Rate Limiting Middleware

Production-grade security middleware for the Sentiment Oracle API.
"""

import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Callable
from fastapi import Request, HTTPException, Security
from fastapi.security import APIKeyHeader
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import logging

from app.config import config
from app.cache import cache

logger = logging.getLogger(__name__)

# API Key header
api_key_header = APIKeyHeader(name=config.API_KEY_HEADER, auto_error=False)


# ============================================
# API KEY AUTHENTICATION
# ============================================

class APIKeyManager:
    """Manages API key authentication."""
    
    # In-memory store for demo (use database in production)
    _keys: dict = {}
    
    @staticmethod
    def hash_key(key: str) -> str:
        """Hash API key for secure storage."""
        return hashlib.sha256(key.encode()).hexdigest()
    
    @classmethod
    def generate_key(cls, name: str, owner: str = None) -> tuple[str, str]:
        """
        Generate a new API key.
        
        Returns:
            (raw_key, key_hash) - raw_key is shown once, hash is stored
        """
        raw_key = f"so_{secrets.token_urlsafe(32)}"  # so_ prefix for identification
        key_hash = cls.hash_key(raw_key)
        
        cls._keys[key_hash] = {
            "name": name,
            "owner": owner,
            "created_at": datetime.utcnow().isoformat(),
            "is_active": True,
            "rate_limit": config.RATE_LIMIT_REQUESTS
        }
        
        return raw_key, key_hash
    
    @classmethod
    def validate_key(cls, key: str) -> Optional[dict]:
        """
        Validate an API key.
        
        Returns:
            Key info dict if valid, None if invalid
        """
        if not key:
            return None
        
        key_hash = cls.hash_key(key)
        key_info = cls._keys.get(key_hash)
        
        if key_info and key_info.get("is_active", False):
            return key_info
        
        return None
    
    @classmethod
    def revoke_key(cls, key_hash: str):
        """Revoke an API key."""
        if key_hash in cls._keys:
            cls._keys[key_hash]["is_active"] = False


async def verify_api_key(
    request: Request,
    api_key: str = Security(api_key_header)
) -> Optional[dict]:
    """
    FastAPI dependency to verify API key.
    
    Usage:
        @app.get("/protected")
        async def protected(key_info: dict = Depends(verify_api_key)):
            ...
    """
    # Skip if API keys not enabled
    if not config.ENABLE_API_KEYS:
        return {"name": "anonymous", "rate_limit": config.RATE_LIMIT_REQUESTS}
    
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="API key required",
            headers={"WWW-Authenticate": f'{config.API_KEY_HEADER}="Bearer"'}
        )
    
    key_info = APIKeyManager.validate_key(api_key)
    
    if not key_info:
        raise HTTPException(
            status_code=401,
            detail="Invalid or revoked API key"
        )
    
    return key_info


# ============================================
# RATE LIMITING MIDDLEWARE
# ============================================

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware using Redis or in-memory cache.
    
    Applies per-IP rate limiting for unauthenticated requests,
    and per-API-key limits for authenticated requests.
    """
    
    # Exempt paths from rate limiting
    EXEMPT_PATHS = {"/", "/health", "/docs", "/openapi.json", "/redoc"}
    
    async def dispatch(self, request: Request, call_next: Callable):
        # Skip rate limiting for exempt paths
        if request.url.path in self.EXEMPT_PATHS:
            return await call_next(request)
        
        # Skip if cache not initialized
        if not cache.is_initialized:
            return await call_next(request)
        
        # Get identifier (API key or IP)
        api_key = request.headers.get(config.API_KEY_HEADER)
        
        if api_key:
            key_info = APIKeyManager.validate_key(api_key)
            if key_info:
                identifier = f"key:{APIKeyManager.hash_key(api_key)[:16]}"
                max_requests = key_info.get("rate_limit", config.RATE_LIMIT_REQUESTS)
            else:
                identifier = f"ip:{self._get_client_ip(request)}"
                max_requests = config.RATE_LIMIT_REQUESTS
        else:
            identifier = f"ip:{self._get_client_ip(request)}"
            max_requests = config.RATE_LIMIT_REQUESTS
        
        # Check rate limit
        allowed, remaining, reset_in = await cache.check_rate_limit(
            identifier,
            max_requests=max_requests,
            window_seconds=config.RATE_LIMIT_WINDOW
        )
        
        # Add rate limit headers
        response = await call_next(request) if allowed else None
        
        if not allowed:
            response = JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded",
                    "retry_after": reset_in
                }
            )
        
        # Add rate limit headers to response
        if response:
            response.headers["X-RateLimit-Limit"] = str(max_requests)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            response.headers["X-RateLimit-Reset"] = str(reset_in)
        
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP, handling proxies."""
        # Check for forwarded headers (behind reverse proxy)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Direct connection
        return request.client.host if request.client else "unknown"


# ============================================
# CORS MIDDLEWARE SETTINGS
# ============================================

CORS_SETTINGS = {
    "allow_origins": [
        "http://localhost:3000",
        "https://localhost:3000",
        "https://sentiment-oracle.vercel.app",  # Production frontend
    ],
    "allow_credentials": True,
    "allow_methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["*"],
    "expose_headers": [
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining", 
        "X-RateLimit-Reset"
    ]
}


# ============================================
# REQUEST LOGGING MIDDLEWARE
# ============================================

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs all API requests for monitoring."""
    
    async def dispatch(self, request: Request, call_next: Callable):
        start_time = datetime.utcnow()
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        # Log request
        logger.info(
            f"{request.method} {request.url.path} "
            f"status={response.status_code} "
            f"duration={duration:.2f}ms "
            f"ip={self._get_client_ip(request)}"
        )
        
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"


# ============================================
# SECURITY HEADERS MIDDLEWARE
# ============================================

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds security headers to all responses."""
    
    async def dispatch(self, request: Request, call_next: Callable):
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        if config.is_production():
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response
