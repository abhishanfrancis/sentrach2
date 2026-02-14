import os
from dotenv import load_dotenv

# Load environment-specific .env file
env = os.getenv("ENVIRONMENT", "development")
if env == "production":
    load_dotenv(".env.production")
else:
    load_dotenv()


class Config:
    # Environment
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    DEBUG = os.getenv("DEBUG", "true").lower() == "true"
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    
    # Blockchain
    WEB3_PROVIDER_URL = os.getenv("WEB3_PROVIDER_URL", "http://127.0.0.1:8545")
    CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS", "")
    PRIVATE_KEY = os.getenv("PRIVATE_KEY", "")
    CHAIN_ID = int(os.getenv("CHAIN_ID", 31337))  # 31337=hardhat, 11155111=sepolia
    NETWORK_NAME = os.getenv("NETWORK_NAME", "localhost")
    
    # Server
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 8000))
    
    # NewsAPI
    NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")
    NEWS_FETCH_INTERVAL = int(os.getenv("NEWS_FETCH_INTERVAL", 25))  # seconds
    NEWS_QUERY = os.getenv("NEWS_QUERY", "bitcoin OR ethereum")
    NEWS_MAX_ARTICLES = int(os.getenv("NEWS_MAX_ARTICLES", 20))
    
    # Twitter/X API
    TWITTER_BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN", "")
    TWITTER_API_KEY = os.getenv("TWITTER_API_KEY", "")
    TWITTER_API_SECRET = os.getenv("TWITTER_API_SECRET", "")
    TWITTER_ACCESS_TOKEN = os.getenv("TWITTER_ACCESS_TOKEN", "")
    TWITTER_ACCESS_SECRET = os.getenv("TWITTER_ACCESS_SECRET", "")
    TWITTER_ENABLED = os.getenv("TWITTER_ENABLED", "false").lower() == "true"
    
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "")
    DATABASE_POOL_SIZE = int(os.getenv("DATABASE_POOL_SIZE", 5))
    DATABASE_MAX_OVERFLOW = int(os.getenv("DATABASE_MAX_OVERFLOW", 10))
    
    # Redis
    REDIS_URL = os.getenv("REDIS_URL", "")
    CACHE_TTL = int(os.getenv("CACHE_TTL", 60))
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", 100))
    RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", 60))
    
    # API Authentication
    API_KEY_HEADER = os.getenv("API_KEY_HEADER", "X-API-Key")
    ENABLE_API_KEYS = os.getenv("ENABLE_API_KEYS", "false").lower() == "true"
    
    # Aggregation
    HISTORY_SIZE = 20  # Store last 20 vibe scores
    ROLLING_WINDOW_SIZE = int(os.getenv("ROLLING_WINDOW_SIZE", 100))
    
    # Multi-coin tracking
    TRACKED_COINS = ["BTC", "ETH", "SOL", "DOGE", "XRP"]
    
    # Social sentiment weights
    TWITTER_WEIGHT = 0.4
    NEWS_WEIGHT = 0.6
    
    @classmethod
    def is_production(cls) -> bool:
        return cls.ENVIRONMENT == "production"
    
    @classmethod
    def has_database(cls) -> bool:
        return bool(cls.DATABASE_URL)
    
    @classmethod
    def has_redis(cls) -> bool:
        return bool(cls.REDIS_URL)
    
    @classmethod
    def has_twitter(cls) -> bool:
        return cls.TWITTER_ENABLED and bool(cls.TWITTER_BEARER_TOKEN)


config = Config()
