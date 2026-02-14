import random
import uuid
from datetime import datetime
from app.models import SocialPost

# Crypto-related post templates
BULLISH_POSTS = [
    "🚀 $BTC breaking out! This is just the beginning!",
    "Diamond hands paying off! HODLing since 2020 💎🙌",
    "ETH looking incredibly strong, $10k incoming",
    "Just bought more $SOL on this dip, LFG!",
    "The charts are screaming bullish, load up!",
    "Institutional money is flooding in 📈",
    "We're so early, this cycle will be legendary",
    "ATH by end of month, calling it now ✨",
    "Best entry point in months, don't miss out",
    "Smart money accumulating heavy rn 🐋",
    "This project is going to 100x, NFA",
    "Green candles all day, vibes are immaculate",
]

BEARISH_POSTS = [
    "This looks like a dead cat bounce, be careful 📉",
    "Selling everything, this market is cooked",
    "Rug pull incoming, I can feel it 🚩",
    "We're going to zero, cope harder bulls",
    "Bear market is here, time to short",
    "Lost 50% of my portfolio this week 💀",
    "This is 2018 all over again...",
    "Exit liquidity for whales, retail gets rekt",
    "Charts looking terrible, expecting more dump",
    "Leverage longs getting liquidated hard",
    "Nobody is buying, volume is dead",
    "Scam project, devs are anonymous 🚨",
]

NEUTRAL_POSTS = [
    "Interesting price action today, watching closely",
    "DYOR before investing in anything",
    "Market seems undecided, waiting for direction",
    "Anyone else just holding and chilling?",
    "What's everyone's price target?",
    "Need more coffee to analyze these charts ☕",
    "Consolidation phase, could go either way",
    "What do you think about this setup?",
    "Reading the whitepaper again...",
    "Taking profits slowly, managing risk",
]

USERNAMES = [
    "CryptoWhale_42", "DiamondHands_Dev", "SatoshiFan99", "DeFi_Degen",
    "NFT_Hunter", "Web3Builder", "MoonBoy_", "RektTrader",
    "BlockchainBro", "TokenTycoon", "HODLer4Life", "AltcoinAlice",
    "ChartMaster_X", "CryptoPunk_", "LamboWhen", "StakingKing",
]

def generate_fake_post() -> SocialPost:
    """Generate a random crypto-related social post."""
    # Weighted selection: 40% bullish, 30% bearish, 30% neutral
    roll = random.random()
    if roll < 0.4:
        content = random.choice(BULLISH_POSTS)
    elif roll < 0.7:
        content = random.choice(BEARISH_POSTS)
    else:
        content = random.choice(NEUTRAL_POSTS)
    
    return SocialPost(
        id=str(uuid.uuid4())[:8],
        username=random.choice(USERNAMES),
        content=content,
        timestamp=datetime.utcnow()
    )
