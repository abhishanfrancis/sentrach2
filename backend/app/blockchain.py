from web3 import Web3
from datetime import datetime
import logging
import asyncio
from typing import Optional
from app.config import config
from app.models import BlockchainTx

logger = logging.getLogger(__name__)

# Contract ABI (includes signal events)
CONTRACT_ABI = [
    {
        "inputs": [{"internalType": "int256", "name": "_score", "type": "int256"}],
        "name": "updateSentiment",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "sentimentScore",
        "outputs": [{"internalType": "int256", "name": "", "type": "int256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "lastUpdated",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "currentSignal",
        "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getSignalString",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": False, "internalType": "int256", "name": "score", "type": "int256"},
            {"indexed": False, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "name": "SentimentUpdated",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": False, "internalType": "int256", "name": "score", "type": "int256"},
            {"indexed": False, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "name": "BullishSignal",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": False, "internalType": "int256", "name": "score", "type": "int256"},
            {"indexed": False, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "name": "BearishSignal",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": False, "internalType": "int256", "name": "score", "type": "int256"},
            {"indexed": False, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "name": "NeutralSignal",
        "type": "event"
    }
]

class BlockchainClient:
    def __init__(self):
        self.w3 = None
        self.contract = None
        self.account = None
        self._connected = False
        self._last_tx: Optional[BlockchainTx] = None
        self._tx_count = 0
        self._failed_count = 0
    
    def connect(self) -> bool:
        """Connect to the blockchain."""
        try:
            self.w3 = Web3(Web3.HTTPProvider(config.WEB3_PROVIDER_URL))
            
            if not self.w3.is_connected():
                logger.warning("Could not connect to blockchain")
                return False
            
            # Set up account from private key
            if config.PRIVATE_KEY:
                self.account = self.w3.eth.account.from_key(config.PRIVATE_KEY)
                logger.info(f"Connected with account: {self.account.address}")
            
            # Set up contract
            if config.CONTRACT_ADDRESS:
                self.contract = self.w3.eth.contract(
                    address=Web3.to_checksum_address(config.CONTRACT_ADDRESS),
                    abi=CONTRACT_ABI
                )
                logger.info(f"Contract loaded at: {config.CONTRACT_ADDRESS}")
            
            self._connected = True
            return True
            
        except Exception as e:
            logger.error(f"Blockchain connection error: {e}")
            return False
    
    def is_connected(self) -> bool:
        return self._connected and self.w3 and self.w3.is_connected()
    
    def push_sentiment(self, score: int) -> BlockchainTx:
        """Push sentiment score to the blockchain."""
        if not self.is_connected():
            if not self.connect():
                raise Exception("Not connected to blockchain")
        
        if not self.contract or not self.account:
            raise Exception("Contract or account not configured")
        
        try:
            # Build transaction
            nonce = self.w3.eth.get_transaction_count(self.account.address)
            
            tx = self.contract.functions.updateSentiment(score).build_transaction({
                'from': self.account.address,
                'nonce': nonce,
                'gas': 100000,
                'gasPrice': self.w3.eth.gas_price
            })
            
            # Sign and send
            signed_tx = self.w3.eth.account.sign_transaction(tx, config.PRIVATE_KEY)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            
            # Wait for receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)
            
            return BlockchainTx(
                tx_hash=tx_hash.hex(),
                score_pushed=score,
                timestamp=datetime.utcnow(),
                status="confirmed" if receipt.status == 1 else "failed"
            )
            
        except Exception as e:
            logger.error(f"Push to chain failed: {e}")
            self._failed_count += 1
            raise
    
    async def async_push_sentiment(self, vibe_score: float) -> Optional[str]:
        """
        Asynchronously push sentiment score to blockchain.
        Converts float vibe_score (-1 to +1) to int (-100 to +100).
        
        Args:
            vibe_score: Float between -1 and +1
            
        Returns:
            Transaction hash if successful, None if failed
        """
        # Convert to int scale (-100 to +100)
        score_int = int(round(vibe_score * 100))
        score_int = max(-100, min(100, score_int))  # Clamp
        
        try:
            # Run blocking web3 call in executor
            loop = asyncio.get_event_loop()
            tx = await loop.run_in_executor(
                None,
                lambda: self.push_sentiment(score_int)
            )
            
            self._last_tx = tx
            self._tx_count += 1
            logger.info(f"⛓️ Pushed to chain: score={score_int}, tx={tx.tx_hash}")
            
            return tx.tx_hash
            
        except Exception as e:
            logger.error(f"Async push failed: {e}")
            return None
    
    def get_status(self) -> dict:
        """Get blockchain connection and transaction status."""
        connected = self.is_connected()
        
        result = {
            "connected": connected,
            "provider_url": config.WEB3_PROVIDER_URL,
            "contract_address": config.CONTRACT_ADDRESS or "Not configured",
            "account_address": self.account.address if self.account else "Not configured",
            "transactions_pushed": self._tx_count,
            "failed_transactions": self._failed_count,
            "last_transaction": None
        }
        
        if self._last_tx:
            result["last_transaction"] = {
                "tx_hash": self._last_tx.tx_hash,
                "score_pushed": self._last_tx.score_pushed,
                "timestamp": self._last_tx.timestamp.isoformat(),
                "status": self._last_tx.status
            }
        
        # Get on-chain data if connected
        if connected:
            try:
                chain_data = self.get_current_sentiment()
                result["on_chain_score"] = chain_data.get("score")
                result["on_chain_last_updated"] = chain_data.get("last_updated")
            except:
                pass
        
        return result
    
    def get_current_sentiment(self) -> dict:
        """Get current sentiment from contract."""
        if not self.is_connected():
            if not self.connect():
                return {"error": "Not connected"}
        
        try:
            score = self.contract.functions.sentimentScore().call()
            last_updated = self.contract.functions.lastUpdated().call()
            return {
                "score": score,
                "last_updated": last_updated
            }
        except Exception as e:
            return {"error": str(e)}

# Global instance
blockchain = BlockchainClient()
