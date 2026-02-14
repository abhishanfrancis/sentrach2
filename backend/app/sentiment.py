from transformers import pipeline
from typing import Tuple, List
import logging

logger = logging.getLogger(__name__)


class SentimentAnalyzer:
    """
    HuggingFace-based sentiment analyzer.
    
    Converts sentiment to score:
        POSITIVE → +1.0 (scaled by confidence)
        NEGATIVE → -1.0 (scaled by confidence)
    """
    
    def __init__(self):
        logger.info("Loading HuggingFace sentiment model...")
        self.classifier = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english",
            device=-1  # CPU, change to 0 for GPU
        )
        logger.info("Sentiment model loaded!")
    
    def analyze(self, text: str) -> Tuple[float, str]:
        """
        Analyze sentiment of a single text.
        
        Args:
            text: Text to analyze
            
        Returns:
            (score from -1 to +1, label)
        """
        try:
            result = self.classifier(text[:512])[0]
            label = result["label"]
            confidence = result["score"]
            
            if label == "POSITIVE":
                score = confidence
            else:
                score = -confidence
            
            return round(score, 4), label
            
        except Exception as e:
            logger.error(f"Sentiment analysis error: {e}")
            return 0.0, "NEUTRAL"
    
    def analyze_batch(self, texts: List[str]) -> List[Tuple[float, str]]:
        """
        Analyze sentiment of multiple texts efficiently.
        
        Args:
            texts: List of texts to analyze
            
        Returns:
            List of (score, label) tuples
        """
        if not texts:
            return []
        
        try:
            truncated = [t[:512] for t in texts]
            results = self.classifier(truncated)
            
            scores = []
            for result in results:
                label = result["label"]
                confidence = result["score"]
                
                if label == "POSITIVE":
                    score = confidence
                else:
                    score = -confidence
                
                scores.append((round(score, 4), label))
            
            return scores
            
        except Exception as e:
            logger.error(f"Batch sentiment analysis error: {e}")
            return [(0.0, "NEUTRAL") for _ in texts]


# Singleton instance
_analyzer = None


def get_analyzer() -> SentimentAnalyzer:
    """Get or create the singleton analyzer instance."""
    global _analyzer
    if _analyzer is None:
        _analyzer = SentimentAnalyzer()
    return _analyzer
