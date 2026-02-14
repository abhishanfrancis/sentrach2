# Tokenized Sentiment Oracle - Hackathon Build Plan

## 🎯 Project Overview
A demo system that simulates crypto sentiment analysis and pushes "Community Vibe Scores" to the blockchain.

---

## 1. Folder Structure

```
tokenized-sentiment-oracle/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app entry
│   │   ├── config.py            # Environment config
│   │   ├── models.py            # Pydantic models
│   │   ├── sentiment.py         # HuggingFace sentiment engine
│   │   ├── fake_stream.py       # Simulated social posts generator
│   │   ├── vibe_score.py        # Score aggregation logic
│   │   ├── blockchain.py        # Web3 contract interaction
│   │   └── websocket.py         # WebSocket manager
│   ├── requirements.txt
│   └── .env.example
│
├── contracts/
│   ├── SentimentOracle.sol      # Simple sentiment storage contract
│   ├── hardhat.config.js
│   ├── package.json
│   └── scripts/
│       └── deploy.js
│
├── frontend/
│   ├── index.html
│   ├── style.css                # Dark neon theme
│   ├── app.js                   # Dashboard logic
│   └── vite.config.js           # (optional: for dev server)
│
├── docker-compose.yml           # (optional: for quick setup)
└── README.md
```

---

## 2. Backend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FastAPI Server                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ Fake Stream  │───▶│  Sentiment   │───▶│   Vibe Score     │  │
│  │  Generator   │    │   Analyzer   │    │   Aggregator     │  │
│  │ (fake_stream)│    │ (HuggingFace)│    │ (rolling window) │  │
│  └──────────────┘    └──────────────┘    └────────┬─────────┘  │
│                                                    │            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Layer                              │  │
│  │  • GET  /api/score         → Current vibe score          │  │
│  │  • GET  /api/posts         → Recent analyzed posts       │  │
│  │  • POST /api/push-chain    → Push score to blockchain    │  │
│  │  • WS   /ws/feed           → Live sentiment stream       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Blockchain Module (Web3.py)                  │  │
│  │  • Connect to local Hardhat / testnet                    │  │
│  │  • Call updateSentiment(score) on contract               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               SentimentOracle.sol (On-Chain)                    │
│  • int256 public currentSentiment (-100 to +100)               │
│  • uint256 public lastUpdated                                   │
│  • event SentimentUpdated(int256 score, uint256 timestamp)     │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow:
1. **Fake Stream Generator** → Produces random crypto tweets every 2-5 seconds
2. **Sentiment Analyzer** → Uses `transformers` pipeline for sentiment classification
3. **Vibe Score Aggregator** → Rolling average of last N posts, normalized to [-1, +1]
4. **WebSocket** → Pushes real-time updates to dashboard
5. **Blockchain** → On-demand or periodic push to smart contract

---

## 3. Required Dependencies

### Backend (Python 3.10+)
```txt
# requirements.txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
websockets==12.0
pydantic==2.5.3
python-dotenv==1.0.0
transformers==4.37.0
torch==2.1.2
web3==6.14.0
httpx==0.26.0
```

### Smart Contract (Node.js)
```json
{
  "devDependencies": {
    "hardhat": "^2.19.4",
    "@nomicfoundation/hardhat-toolbox": "^4.0.0"
  }
}
```

### Frontend
- Vanilla JS (no framework for speed)
- Chart.js for visualization
- Native WebSocket API

---

## 4. Step-by-Step Build Order

### Phase 1: Foundation (30 min)
- [x] Create folder structure
- [ ] Set up Python virtual environment
- [ ] Install backend dependencies
- [ ] Create basic FastAPI skeleton with health check

### Phase 2: Fake Data Stream (30 min)
- [ ] Build fake crypto post generator
- [ ] Create realistic-looking posts (bullish/bearish/neutral)
- [ ] Add timestamps and mock usernames

### Phase 3: Sentiment Engine (45 min)
- [ ] Integrate HuggingFace sentiment pipeline
- [ ] Create scoring normalization (-1 to +1)
- [ ] Build rolling vibe score aggregator

### Phase 4: API + WebSocket (45 min)
- [ ] Implement REST endpoints
- [ ] Set up WebSocket for live feed
- [ ] Add background task for continuous analysis

### Phase 5: Smart Contract (30 min)
- [ ] Write simple SentimentOracle.sol
- [ ] Deploy to local Hardhat network
- [ ] Test contract interaction

### Phase 6: Blockchain Integration (30 min)
- [ ] Connect Web3.py to local network
- [ ] Implement push-to-chain endpoint
- [ ] Add event emission handling

### Phase 7: Frontend Dashboard (60 min)
- [ ] Create dark neon-themed HTML/CSS
- [ ] Build real-time score gauge
- [ ] Add live post feed display
- [ ] Implement WebSocket connection
- [ ] Add "Push to Chain" button

### Phase 8: Polish & Demo (30 min)
- [ ] Add animations and glow effects
- [ ] Test full flow end-to-end
- [ ] Create demo script
- [ ] Record demo video (optional)

---

## Quick Start Commands

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Smart Contract
cd contracts
npm install
npx hardhat node              # Terminal 1
npx hardhat run scripts/deploy.js --network localhost  # Terminal 2

# Frontend
cd frontend
# Just open index.html or use: python -m http.server 3000
```

---

## Demo Talking Points
1. "We're streaming simulated crypto social sentiment in real-time"
2. "HuggingFace ML model analyzes each post"
3. "Community Vibe Score aggregates the last 50 posts"
4. "One click pushes the score immutably to the blockchain"
5. "Smart contract emits events for on-chain integrations"

---

Ready to build! Start with Phase 1? 🚀
