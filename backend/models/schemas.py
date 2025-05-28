from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class HealthResponse(BaseModel):
    message: str
    status: str
    version: str

class TranscriptRequest(BaseModel):
    audio_file_path: str

class TranscriptResponse(BaseModel):
    transcript: str
    confidence: float
    processing_time: float

class SentimentRequest(BaseModel):
    text: str

class SentimentScores(BaseModel):
    positive: float
    negative: float
    neutral: float

class SentimentResponse(BaseModel):
    sentiment: str  # "positive", "negative", "neutral"
    confidence: float
    scores: SentimentScores
    processing_time: Optional[float] = 0.0

class AudioUploadResponse(BaseModel):
    message: str
    filename: str
    file_path: str
    file_size: int

class AudioProcessResponse(BaseModel):
    transcript: str
    transcript_confidence: float
    sentiment: str
    sentiment_confidence: float
    sentiment_scores: SentimentScores
    processing_time: float

class ErrorResponse(BaseModel):
    error: str
    detail: str
    timestamp: datetime

class AudioFileInfo(BaseModel):
    filename: str
    duration: Optional[float] = None
    sample_rate: Optional[int] = None
    channels: Optional[int] = None
    format: Optional[str] = None