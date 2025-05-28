from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import time
from typing import Dict, Any
import torch

class SentimentAnalysisService:
    def __init__(self, method: str = "transformers"):
        """
        Initialize sentiment analysis service
        
        Args:
            method: "transformers", "textblob", or "vader"
        """
        self.method = method
        self.analyzer = None
        self._load_analyzer()
    
    def _load_analyzer(self):
        """Load the sentiment analysis model/analyzer"""
        try:
            if self.method == "transformers":
                print("Loading transformer model for sentiment analysis...")
                # Using a lightweight, fast model
                model_name = "cardiffnlp/twitter-roberta-base-sentiment-latest"
                self.analyzer = pipeline(
                    "sentiment-analysis",
                    model=model_name,
                    tokenizer=model_name,
                    device=0 if torch.cuda.is_available() else -1
                )
                print("Transformer model loaded successfully!")
                
            elif self.method == "vader":
                print("Loading VADER sentiment analyzer...")
                self.analyzer = SentimentIntensityAnalyzer()
                print("VADER analyzer loaded successfully!")
                
            elif self.method == "textblob":
                print("Using TextBlob for sentiment analysis...")
                # TextBlob doesn't need explicit loading
                self.analyzer = "textblob"
                print("TextBlob ready!")
                
        except Exception as e:
            print(f"Error loading sentiment analyzer: {e}")
            # Fallback to VADER if transformers fail
            if self.method == "transformers":
                print("Falling back to VADER...")
                self.method = "vader"
                self.analyzer = SentimentIntensityAnalyzer()
    
    async def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment of the given text
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary containing sentiment analysis results
        """
        if not text or not text.strip():
            return {
                "sentiment": "neutral",
                "confidence": 0.0,
                "scores": {
                    "positive": 0.0,
                    "negative": 0.0,
                    "neutral": 1.0
                },
                "processing_time": 0.0
            }
        
        start_time = time.time()
        
        try:
            if self.method == "transformers":
                result = self._analyze_with_transformers(text)
            elif self.method == "vader":
                result = self._analyze_with_vader(text)
            elif self.method == "textblob":
                result = self._analyze_with_textblob(text)
            else:
                raise ValueError(f"Unknown sentiment analysis method: {self.method}")
            
            result["processing_time"] = time.time() - start_time
            return result
            
        except Exception as e:
            # Fallback to simple analysis
            print(f"Error in sentiment analysis: {e}")
            return {
                "sentiment": "neutral",
                "confidence": 0.0,
                "scores": {
                    "positive": 0.0,
                    "negative": 0.0,
                    "neutral": 1.0
                },
                "processing_time": time.time() - start_time,
                "error": str(e)
            }
    
    def _analyze_with_transformers(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment using transformers pipeline"""
        result = self.analyzer(text)[0]
        
        # Map labels to standard format
        label_map = {
            "LABEL_0": "negative",  # RoBERTa
            "LABEL_1": "neutral",
            "LABEL_2": "positive",
            "NEGATIVE": "negative",  # Other models
            "NEUTRAL": "neutral",
            "POSITIVE": "positive"
        }
        
        sentiment = label_map.get(result["label"], result["label"].lower())
        confidence = result["score"]
        
        # Create scores dictionary
        scores = {"positive": 0.0, "negative": 0.0, "neutral": 0.0}
        scores[sentiment] = confidence
        
        # Distribute remaining confidence
        remaining = 1.0 - confidence
        other_sentiments = [s for s in scores.keys() if s != sentiment]
        for other in other_sentiments:
            scores[other] = remaining / len(other_sentiments)
        
        return {
            "sentiment": sentiment,
            "confidence": confidence,
            "scores": scores
        }
    
    def _analyze_with_vader(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment using VADER"""
        scores = self.analyzer.polarity_scores(text)
        
        # Determine primary sentiment
        if scores['compound'] >= 0.05:
            sentiment = "positive"
            confidence = scores['pos']
        elif scores['compound'] <= -0.05:
            sentiment = "negative"
            confidence = scores['neg']
        else:
            sentiment = "neutral"
            confidence = scores['neu']
        
        return {
            "sentiment": sentiment,
            "confidence": confidence,
            "scores": {
                "positive": scores['pos'],
                "negative": scores['neg'],
                "neutral": scores['neu']
            }
        }
    
    def _analyze_with_textblob(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment using TextBlob"""
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        
        # Convert polarity to sentiment and confidence
        if polarity > 0.1:
            sentiment = "positive"
            confidence = min(1.0, polarity)
        elif polarity < -0.1:
            sentiment = "negative"
            confidence = min(1.0, abs(polarity))
        else:
            sentiment = "neutral"
            confidence = 1.0 - abs(polarity)
        
        # Create normalized scores
        pos_score = max(0.0, polarity)
        neg_score = max(0.0, -polarity)
        neu_score = 1.0 - abs(polarity)
        
        # Normalize scores to sum to 1
        total = pos_score + neg_score + neu_score
        if total > 0:
            pos_score /= total
            neg_score /= total
            neu_score /= total
        
        return {
            "sentiment": sentiment,
            "confidence": confidence,
            "scores": {
                "positive": pos_score,
                "negative": neg_score,
                "neutral": neu_score
            }
        }
    
    def get_analyzer_info(self) -> Dict[str, Any]:
        """Get information about the current analyzer"""
        return {
            "method": self.method,
            "analyzer_loaded": self.analyzer is not None,
            "supports_confidence": True,
            "supports_scores": True
        }
    
    def change_method(self, method: str):
        """Change the sentiment analysis method"""
        if method != self.method:
            self.method = method
            self._load_analyzer()