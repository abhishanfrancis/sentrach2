"""
Minimal Web3.py script to interact with SentimentOracle on local Hardhat node.
"""
import os
from web3 import Web3

# Configuration from environment
RPC_URL = os.getenv("WEB3_PROVIDER_URL", "http://127.0.0.1:8545")
PRIVATE_KEY = os.getenv("PRIVATE_KEY", "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")  # Hardhat default
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS", "0x5FbDB2315678afecb367f032d93F642f64180aa3")

# Minimal ABI for updateSentiment
ABI = [
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
    }
]


def update_sentiment(score: int) -> str:
    """
    Push sentiment score to the blockchain.
    Returns transaction hash.
    """
    # Connect to local Hardhat node
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    
    if not w3.is_connected():
        raise ConnectionError(f"Cannot connect to {RPC_URL}")
    
    print(f"Connected to chain ID: {w3.eth.chain_id}")
    
    # Set up account
    account = w3.eth.account.from_key(PRIVATE_KEY)
    print(f"Using account: {account.address}")
    
    # Set up contract
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(CONTRACT_ADDRESS),
        abi=ABI
    )
    
    # Build transaction
    tx = contract.functions.updateSentiment(score).build_transaction({
        'from': account.address,
        'nonce': w3.eth.get_transaction_count(account.address),
        'gas': 100000,
        'gasPrice': w3.eth.gas_price
    })
    
    # Sign and send
    signed = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    
    print(f"TX sent: {tx_hash.hex()}")
    
    # Wait for confirmation
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    
    if receipt.status == 1:
        print(f"TX confirmed in block {receipt.blockNumber}")
    else:
        print("TX failed!")
    
    return tx_hash.hex()


def get_sentiment() -> int:
    """Read current sentiment from contract."""
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(CONTRACT_ADDRESS),
        abi=ABI
    )
    return contract.functions.sentimentScore().call()


if __name__ == "__main__":
    # Example: Push score of 42
    print("Current sentiment:", get_sentiment())
    
    tx_hash = update_sentiment(42)
    print(f"Updated! TX: {tx_hash}")
    
    print("New sentiment:", get_sentiment())
