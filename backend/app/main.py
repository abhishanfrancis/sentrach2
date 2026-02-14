"""
Tokenized Sentiment Oracle - FastAPI Backend

Fetches crypto news every 60 seconds, computes sentiment,
and provides aggregated Community Vibe Score via REST API.
"""

import asyncio
import logging
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import config
from app.news_fetcher import news_fetcher
from app.sentiment import get_analyzer
from app.aggregator import aggregator, ArticleSentiment
from app.websocket import manager
from app.triggers import triggers, Signal
from app.blockchain import blockchain
from app.multi_coin import multi_coin
from app.social_sentiment import social_sentiment
from app.prediction import predictor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Background task control
_running = False
_last_update_time: datetime | None = None


def get_vibe_response():
    """Build the vibe response with timing info."""
    global _last_update_time
    
    result = aggregator.compute_vibe()
    now = datetime.utcnow()
    
    # Calculate seconds until next update
    if _last_update_time:
        elapsed = (now - _last_update_time).total_seconds()
        next_update_in = max(0, config.NEWS_FETCH_INTERVAL - int(elapsed))
    else:
        next_update_in = 0
    
    # Get latest alert signal
    latest_alert = triggers.get_latest_alert()
    current_signal = latest_alert["signal"] if latest_alert else "NEUTRAL"
    
    return {
        "vibe_score": result.vibe_score,
        "average_sentiment": result.average_sentiment,
        "volume": result.volume,
        "trend": result.trend,
        "signal": current_signal,
        "last_updated_timestamp": result.last_updated.isoformat(),
        "next_update_in": next_update_in,
        "update_interval": config.NEWS_FETCH_INTERVAL
    }


async def news_sentiment_task():
    """
    Background task that:
    1. Fetches crypto news every 60 seconds
    2. Analyzes sentiment of each article
    3. Updates the vibe score aggregator
    4. Pushes score to blockchain
    5. Evaluates triggers for BULLISH/BEARISH signals
    6. Broadcasts to WebSocket clients
    """
    global _running, _last_update_time
    analyzer = get_analyzer()
    
    logger.info("Starting news sentiment background task...")
    
    # Attempt blockchain connection
    if blockchain.connect():
        logger.info("✅ Connected to blockchain")
    else:
        logger.warning("⚠️ Blockchain not connected - will skip on-chain push")
    
    while _running:
        try:
            # Fetch news (respects cooldown internally)
            articles = await news_fetcher.fetch_news()
            
            if articles:
                # Get texts for sentiment analysis
                texts = [a.text for a in articles]
                
                # Batch analyze sentiment
                sentiments = analyzer.analyze_batch(texts)
                
                # Clear old articles and add new ones
                aggregator.clear()
                
                for article, (score, label) in zip(articles, sentiments):
                    aggregator.add_article(
                        text=article.text,
                        score=score
                    )
                
                # Compute new vibe score
                vibe = aggregator.compute_vibe()
                _last_update_time = datetime.utcnow()
                
                logger.info(
                    f"Updated vibe: score={vibe.vibe_score:.4f}, "
                    f"articles={vibe.volume}, trend={vibe.trend}"
                )
                
                # Push to blockchain (async)
                tx_hash = None
                if blockchain.is_connected():
                    tx_hash = await blockchain.async_push_sentiment(vibe.vibe_score)
                
                # Evaluate triggers and create alert
                alert = triggers.evaluate(
                    vibe_score=vibe.vibe_score,
                    average_sentiment=vibe.average_sentiment,
                    volume=vibe.volume,
                    tx_hash=tx_hash
                )
                
                # Update multi-coin tracker
                multi_coin.update_from_base_sentiment(vibe.vibe_score, vibe.volume)
                
                # Generate social sentiment (simulated)
                social_sentiment.generate_posts(vibe.vibe_score, count=50)
                
                # Update prediction engine
                predictor.add_datapoint(vibe.vibe_score)
                
                # Broadcast to WebSocket clients
                ws_data = get_vibe_response()
                ws_data["type"] = "vibe_update"
                ws_data["signal"] = alert.signal.value
                ws_data["tx_hash"] = tx_hash
                ws_data["market_summary"] = multi_coin.get_market_summary()
                ws_data["prediction"] = predictor.predict("1h").to_dict()
                await manager.broadcast(ws_data)
                
            else:
                logger.warning("No articles fetched")
            
            # Wait for next cycle (60 seconds)
            await asyncio.sleep(config.NEWS_FETCH_INTERVAL)
            
        except Exception as e:
            logger.error(f"News sentiment task error: {e}")
            await asyncio.sleep(10)  # Retry after 10s on error


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown."""
    global _running
    
    logger.info("🚀 Starting Tokenized Sentiment Oracle...")
    
    # Pre-load the sentiment model
    logger.info("Loading sentiment model...")
    get_analyzer()
    
    # Check NewsAPI configuration
    if not news_fetcher.is_configured:
        logger.warning("⚠️  NEWS_API_KEY not set - using mock data")
    
    # Start background task
    _running = True
    task = asyncio.create_task(news_sentiment_task())
    
    logger.info("✅ Server ready!")
    
    yield
    
    # Shutdown
    _running = False
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    
    logger.info("👋 Shutting down...")


# Create FastAPI app
app = FastAPI(
    title="Tokenized Sentiment Oracle",
    description="Real-time crypto sentiment analysis from news",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ REST Endpoints ============

@app.get("/")
async def root():
    """API root endpoint."""
    return {
        "message": "Tokenized Sentiment Oracle API",
        "version": "2.0.0",
        "status": "running"
    }


@app.get("/vibe")
async def get_vibe():
    """
    Get current Community Vibe Score.
    
    Returns:
        vibe_score: Aggregated score (-1 to +1)
        average_sentiment: Raw average of article sentiments
        volume: Number of articles analyzed
        trend: UP, DOWN, or STABLE
        last_updated_timestamp: ISO timestamp
        next_update_in: Seconds until next refresh
        update_interval: Update interval in seconds
    """
    return get_vibe_response()


@app.get("/history")
async def get_history():
    """
    Get historical vibe scores (last 20).
    
    Returns:
        history: List of vibe score records
        count: Number of records
    """
    history = aggregator.get_history()
    
    return {
        "history": history,
        "count": len(history)
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "news_api_configured": news_fetcher.is_configured,
        "cooldown_remaining": news_fetcher.seconds_until_next_fetch,
        "cached_articles": len(news_fetcher._cached_articles),
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/articles")
async def get_articles():
    """Get current cached articles with sentiment."""
    articles = []
    
    for article_sentiment in aggregator.current_articles:
        articles.append({
            "text": article_sentiment.text[:200] + "..." if len(article_sentiment.text) > 200 else article_sentiment.text,
            "score": article_sentiment.score,
            "timestamp": article_sentiment.timestamp.isoformat()
        })
    
    return {
        "articles": articles,
        "count": len(articles)
    }


@app.get("/alerts")
async def get_alerts(limit: int = 20):
    """
    Get recent alerts/signals.
    
    Args:
        limit: Maximum number of alerts to return (default 20)
    
    Returns:
        alerts: List of alert records with signal, vibe_score, tx_hash
        count: Number of alerts returned
        stats: Trigger statistics (bullish/bearish counts)
    """
    alerts = triggers.get_alerts(limit=limit)
    stats = triggers.get_stats()
    
    return {
        "alerts": alerts,
        "count": len(alerts),
        "stats": stats
    }


@app.get("/status")
async def get_status():
    """
    Get comprehensive system status.
    
    Returns:
        server: Server health info
        news_api: NewsAPI configuration status
        blockchain: Blockchain connection and transaction status
        triggers: Alert trigger statistics
        aggregator: Vibe aggregator stats
    """
    return {
        "server": {
            "status": "running",
            "version": "3.0.0",
            "timestamp": datetime.utcnow().isoformat()
        },
        "news_api": {
            "configured": news_fetcher.is_configured,
            "cooldown_remaining": news_fetcher.seconds_until_next_fetch,
            "cached_articles": len(news_fetcher._cached_articles),
            "fetch_interval": config.NEWS_FETCH_INTERVAL
        },
        "blockchain": blockchain.get_status(),
        "triggers": triggers.get_stats(),
        "aggregator": {
            "current_articles": len(aggregator.current_articles),
            "history_size": len(aggregator.get_history()),
            "latest_vibe": aggregator.compute_vibe().vibe_score
        },
        "multi_coin": {
            "tracked_coins": len(multi_coin.coins),
            "market_mood": multi_coin.get_market_summary().get("market_mood", "UNKNOWN")
        },
        "prediction": {
            "data_points": len(predictor.history),
            "last_prediction": predictor.get_all_predictions() if predictor.history else None
        }
    }


# ============ Multi-Coin Endpoints ============

@app.get("/coins")
async def get_coins():
    """
    Get sentiment for all tracked cryptocurrencies.
    
    Returns:
        coins: List of coin sentiment data
        market_summary: Overall market mood
    """
    return {
        "coins": multi_coin.get_all_coins(),
        "market_summary": multi_coin.get_market_summary()
    }


@app.get("/coins/{symbol}")
async def get_coin(symbol: str):
    """
    Get sentiment for a specific coin.
    
    Args:
        symbol: Coin symbol (e.g., BTC, ETH)
    """
    coin = multi_coin.get_coin(symbol.upper())
    if not coin:
        return {"error": f"Coin {symbol} not found"}
    
    return {
        "coin": coin,
        "history": multi_coin.get_coin_history(symbol.upper(), limit=20)
    }


@app.get("/heatmap")
async def get_heatmap():
    """
    Get heatmap data for coin sentiment visualization.
    
    Returns:
        coins: Sorted by sentiment (most bullish first)
        most_bullish: Highest sentiment coin
        most_bearish: Lowest sentiment coin
    """
    return multi_coin.get_heatmap()


@app.get("/market")
async def get_market():
    """
    Get overall market sentiment summary.
    
    Returns:
        fear_greed_index: 0-100 (0=extreme fear, 100=extreme greed)
        market_mood: PANIC, FEARFUL, NEUTRAL, OPTIMISTIC, GREEDY
        bullish/bearish/neutral counts
    """
    return multi_coin.get_market_summary()


# ============ Social Sentiment Endpoints ============

@app.get("/social")
async def get_social():
    """
    Get combined social media sentiment.
    
    Returns:
        combined_sentiment: Weighted average across platforms
        platform_breakdown: Per-platform metrics
    """
    return social_sentiment.get_combined_sentiment()


@app.get("/social/posts")
async def get_social_posts(limit: int = 20):
    """
    Get recent social media posts.
    
    Args:
        limit: Maximum posts to return
    """
    return {
        "posts": social_sentiment.get_recent_posts(limit),
        "viral_posts": social_sentiment.get_viral_posts(5)
    }


@app.get("/social/timeline")
async def get_social_timeline():
    """
    Get social sentiment over time (last 60 minutes).
    """
    return {
        "timeline": social_sentiment.get_sentiment_timeline()
    }


# ============ Prediction Endpoints ============

@app.get("/predict")
async def get_predictions():
    """
    Get sentiment predictions for multiple time horizons.
    
    Returns:
        1h, 6h, 24h predictions with confidence scores
        technical indicators (EMA, momentum, RSI, etc.)
    """
    return {
        "predictions": predictor.get_all_predictions(),
        "indicators": predictor.get_technical_indicators()
    }


@app.get("/predict/{horizon}")
async def get_prediction(horizon: str = "1h"):
    """
    Get prediction for specific time horizon.
    
    Args:
        horizon: "1h", "6h", or "24h"
    """
    if horizon not in ["1h", "6h", "24h"]:
        return {"error": "Invalid horizon. Use 1h, 6h, or 24h"}
    
    return predictor.predict(horizon).to_dict()


@app.get("/indicators")
async def get_indicators():
    """
    Get technical indicators for sentiment analysis.
    
    Returns:
        EMA crossovers, momentum, RSI, support/resistance
        Overall signal: STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL
    """
    return predictor.get_technical_indicators()


# ============ WebSocket Endpoint ============

@app.websocket("/ws/vibe")
async def websocket_vibe(websocket: WebSocket):
    """
    WebSocket endpoint for real-time vibe score updates.
    Receives updates every 60 seconds when new data is computed.
    """
    await manager.connect(websocket)
    
    # Send current state immediately on connect
    initial_data = get_vibe_response()
    initial_data["type"] = "initial"
    await websocket.send_json(initial_data)
    
    try:
        while True:
            # Keep connection alive, handle pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ============ Run with uvicorn ============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=config.HOST,
        port=config.PORT,
        reload=True
    )
