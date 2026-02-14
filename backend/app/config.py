import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Blockchain
    WEB3_PROVIDER_URL = os.getenv("WEB3_PROVIDER_URL", "http://127.0.0.1:8545")
    CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS", "")
    PRIVATE_KEY = os.getenv("PRIVATE_KEY", "")
    
    # Server
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 8000))
    
    # NewsAPI
    NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")
    NEWS_FETCH_INTERVAL = int(os.getenv("NEWS_FETCH_INTERVAL", 60))  # seconds
    NEWS_QUERY = os.getenv("NEWS_QUERY", "bitcoin OR ethereum")
    NEWS_MAX_ARTICLES = int(os.getenv("NEWS_MAX_ARTICLES", 20))
    
    # Aggregation
    HISTORY_SIZE = 20  # Store last 20 vibe scores
    
    # Multi-coin tracking
    TRACKED_COINS = ["BTC", "ETH", "SOL", "DOGE", "XRP"]
    
    # Social sentiment weights
    TWITTER_WEIGHT = 0.3
    REDDIT_WEIGHT = 0.2
    NEWS_WEIGHT = 0.5

config = Config()
