# 🚀 Production Deployment Guide

## Tokenized Sentiment Oracle - Real-World Deployment

This guide covers deploying the Sentiment Oracle to production with:
- **Sepolia Testnet** (or mainnet)
- **Real social APIs** (Twitter/X)
- **PostgreSQL** database
- **Redis** caching
- **Docker** containerization

---

## 📋 Prerequisites

1. **Accounts Required**:
   - [Alchemy](https://www.alchemy.com) or [Infura](https://infura.io) - Blockchain RPC
   - [Twitter Developer](https://developer.twitter.com) - Twitter API v2
   - [NewsAPI](https://newsapi.org) - News data
   - [Etherscan](https://etherscan.io/myapikey) - Contract verification

2. **Tools**:
   - Docker & Docker Compose
   - Node.js 18+
   - Python 3.11+

---

## 🔧 Step 1: Environment Setup

### Create `.env` file in project root:

```bash
# Copy template
cp backend/.env.production .env
```

### Configure required values:

```env
# BLOCKCHAIN (Required)
WEB3_PROVIDER_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
CONTRACT_ADDRESS=  # Set after deployment
PRIVATE_KEY=  # Oracle wallet private key
CHAIN_ID=11155111
NETWORK_NAME=sepolia

# DATABASE (Required)
POSTGRES_PASSWORD=your-strong-password-here
DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/sentiment_oracle

# NEWS (Required)
NEWS_API_KEY=your-newsapi-key

# SOCIAL (Optional but recommended)
TWITTER_BEARER_TOKEN=your-twitter-bearer-token
TWITTER_ENABLED=true

# SECURITY
ENABLE_API_KEYS=true
SECRET_KEY=generate-a-secure-random-key
```

---

## ⛓️ Step 2: Deploy Smart Contract to Sepolia

### 2.1 Get Sepolia ETH
- Faucet: https://sepoliafaucet.com
- You need ~0.1 ETH for deployment

### 2.2 Configure Hardhat

```bash
cd contracts

# Create .env
cp .env.example .env

# Edit with your values
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
DEPLOYER_PRIVATE_KEY=your-deployer-wallet-private-key
ETHERSCAN_API_KEY=your-etherscan-key
```

### 2.3 Deploy

```bash
# Install dependencies
npm install

# Deploy to Sepolia
npx hardhat run scripts/deploy-sepolia.js --network sepolia
```

### 2.4 Save Contract Address
Copy the deployed address and add to your `.env`:
```env
CONTRACT_ADDRESS=0x...your-deployed-address
```

---

## 🐳 Step 3: Deploy with Docker

### 3.1 Build and start all services

```bash
# From project root
docker-compose up -d --build
```

### 3.2 Check status

```bash
# View logs
docker-compose logs -f

# Check health
docker-compose ps
```

### 3.3 Services running:

| Service | Port | URL |
|---------|------|-----|
| Backend API | 8000 | http://localhost:8000 |
| Dashboard | 3000 | http://localhost:3000 |
| PostgreSQL | 5432 | Internal |
| Redis | 6379 | Internal |

---

## 📡 Step 4: Configure Social APIs

### Twitter/X API v2

1. Go to https://developer.twitter.com
2. Create a project and app
3. Generate Bearer Token
4. Add to `.env`:
   ```env
   TWITTER_BEARER_TOKEN=your-bearer-token
   TWITTER_API_KEY=your-api-key
   TWITTER_ENABLED=true
   ```

---

## 🔐 Step 5: Generate API Keys

For production, enable API key authentication:

```bash
# Generate API key (run inside backend container)
docker-compose exec backend python -c "
from app.middleware import APIKeyManager
raw_key, key_hash = APIKeyManager.generate_key('production-app', 'admin')
print(f'API Key (save this!): {raw_key}')
"
```

Use the key in requests:
```bash
curl -H "X-API-Key: so_your_api_key" http://localhost:8000/vibe
```

---

## 🌐 Step 6: Production Deployment (Cloud)

### Option A: Railway / Render / Fly.io

1. Push to GitHub
2. Connect repo to Railway/Render
3. Set environment variables
4. Deploy

### Option B: VPS (DigitalOcean, AWS, etc.)

```bash
# SSH to server
ssh user@your-server

# Clone repo
git clone https://github.com/yourusername/tokenized-sentiment-oracle
cd tokenized-sentiment-oracle

# Copy .env with production values
nano .env

# Start with Docker
docker-compose up -d
```

### Option C: Kubernetes (Advanced)

See `k8s/` directory for Kubernetes manifests.

---

## 📊 Step 7: Monitoring

### Health Check Endpoints

- Backend: `GET /health`
- Dashboard: `GET /`

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### Metrics (Optional)

Add Prometheus/Grafana:
```yaml
# docker-compose.override.yml
services:
  prometheus:
    image: prom/prometheus
    ...
```

---

## 🔄 Updates & Maintenance

### Update code
```bash
git pull
docker-compose up -d --build
```

### Database migrations
```bash
docker-compose exec backend alembic upgrade head
```

### Backup database
```bash
docker-compose exec postgres pg_dump -U postgres sentiment_oracle > backup.sql
```

---

## 🛟 Troubleshooting

### Container won't start
```bash
docker-compose logs backend
```

### Database connection issues
```bash
docker-compose exec postgres psql -U postgres -c "SELECT 1"
```

### Blockchain not pushing
- Check `CONTRACT_ADDRESS` is set
- Check `PRIVATE_KEY` has ETH for gas
- Check RPC URL is valid

### Rate limiting issues
- Increase `RATE_LIMIT_REQUESTS` in `.env`
- Use API keys for higher limits

---

## 📁 File Structure

```
tokenized-sentiment-oracle/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # API routes
│   │   ├── config.py       # Configuration
│   │   ├── database.py     # PostgreSQL models
│   │   ├── cache.py        # Redis caching
│   │   ├── middleware.py   # Auth & rate limiting
│   │   ├── twitter_api.py  # Real Twitter API
│   │   └── ...
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.production
├── dashboard/              # Next.js frontend
│   ├── Dockerfile
│   └── ...
├── contracts/              # Solidity contracts
│   ├── scripts/
│   │   └── deploy-sepolia.js
│   └── ...
├── docker-compose.yml
└── DEPLOYMENT.md
```

---

## ✅ Checklist

- [ ] Alchemy/Infura account created
- [ ] Twitter API credentials
- [ ] NewsAPI key
- [ ] Sepolia ETH obtained
- [ ] Contract deployed to Sepolia
- [ ] `.env` configured
- [ ] Docker compose running
- [ ] Health checks passing
- [ ] API keys generated (if needed)

---

## 🆘 Support

- GitHub Issues: [Report bugs](https://github.com/yourusername/tokenized-sentiment-oracle/issues)
- Documentation: See README.md
