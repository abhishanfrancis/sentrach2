// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SentimentOracle
 * @notice Sentiment storage with signal detection for hackathon demo
 */
contract SentimentOracle {
    // Sentiment score (-100 to +100)
    int256 public sentimentScore;
    
    // Last update timestamp
    uint256 public lastUpdated;
    
    // Signal thresholds
    int256 public constant BULLISH_THRESHOLD = 60;
    int256 public constant BEARISH_THRESHOLD = -60;
    
    // Current signal state (0=NEUTRAL, 1=BULLISH, 2=BEARISH)
    uint8 public currentSignal;
    
    // Event emitted on update
    event SentimentUpdated(int256 score, uint256 timestamp);
    
    // Signal events
    event BullishSignal(int256 score, uint256 timestamp);
    event BearishSignal(int256 score, uint256 timestamp);
    event NeutralSignal(int256 score, uint256 timestamp);
    
    /**
     * @dev Update sentiment score and emit appropriate signal
     * @param _score New score (-100 to +100)
     */
    function updateSentiment(int256 _score) external {
        sentimentScore = _score;
        lastUpdated = block.timestamp;
        
        emit SentimentUpdated(_score, block.timestamp);
        
        // Detect and emit signal
        if (_score > BULLISH_THRESHOLD) {
            currentSignal = 1;
            emit BullishSignal(_score, block.timestamp);
        } else if (_score < BEARISH_THRESHOLD) {
            currentSignal = 2;
            emit BearishSignal(_score, block.timestamp);
        } else {
            currentSignal = 0;
            emit NeutralSignal(_score, block.timestamp);
        }
    }
    
    /**
     * @dev Get current signal as string
     */
    function getSignalString() external view returns (string memory) {
        if (currentSignal == 1) return "BULLISH_SIGNAL";
        if (currentSignal == 2) return "BEARISH_SIGNAL";
        return "NEUTRAL";
    }
}
