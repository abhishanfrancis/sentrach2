#!/bin/bash
# =============================================
# Production Deployment Script
# Tokenized Sentiment Oracle
# =============================================

set -e  # Exit on error

echo "🚀 Deploying Tokenized Sentiment Oracle..."
echo ""

# Check requirements
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed."; exit 1; }

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found!"
    echo "   Creating from template..."
    cp backend/.env.production .env
    echo "   ✅ Created .env - Please configure it before proceeding!"
    echo ""
    echo "   Required values:"
    echo "   - WEB3_PROVIDER_URL (Alchemy/Infura RPC)"
    echo "   - PRIVATE_KEY (Oracle wallet)"
    echo "   - CONTRACT_ADDRESS (After deployment)"
    echo "   - NEWS_API_KEY"
    echo ""
    exit 1
fi

# Check required env vars
source .env

if [ -z "$WEB3_PROVIDER_URL" ] || [ "$WEB3_PROVIDER_URL" == "https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY" ]; then
    echo "❌ WEB3_PROVIDER_URL not configured in .env"
    exit 1
fi

if [ -z "$NEWS_API_KEY" ]; then
    echo "❌ NEWS_API_KEY not configured in .env"
    exit 1
fi

echo "✅ Environment configured"
echo ""

# Build images
echo "📦 Building Docker images..."
docker-compose build --no-cache

# Start services
echo ""
echo "🐳 Starting services..."
docker-compose up -d

# Wait for health checks
echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health
echo ""
echo "🏥 Checking service health..."

# Check backend
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ Backend: Running"
else
    echo "   ❌ Backend: Not responding"
fi

# Check dashboard
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✅ Dashboard: Running"
else
    echo "   ⚠️  Dashboard: Still starting..."
fi

# Print summary
echo ""
echo "================================================"
echo "🎉 DEPLOYMENT COMPLETE"
echo "================================================"
echo ""
echo "📊 Dashboard:  http://localhost:3000"
echo "🔌 API:        http://localhost:8000"
echo "📚 API Docs:   http://localhost:8000/docs"
echo ""
echo "📝 Logs:       docker-compose logs -f"
echo "🛑 Stop:       docker-compose down"
echo ""

# Show contract info if configured
if [ -n "$CONTRACT_ADDRESS" ]; then
    echo "⛓️  Contract:   https://sepolia.etherscan.io/address/$CONTRACT_ADDRESS"
    echo ""
fi

echo "================================================"
