import json
import os
import time
import logging
from typing import Optional
from mangum import Mangum
from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
import boto3
from botocore.exceptions import ClientError
import tempfile
import base64

# Import your existing modules
from models.schemas import AudioProcessResponse, HealthResponse, LanguageDetectionResponse, SupportedLanguagesResponse, PreciseEmotionsResponse
from services.speech_to_text import SpeechToTextService
from services.sentiment_analysis import SentimentAnalysisService
from utils.audio_processing import AudioProcessor

# Configure logging for CloudWatch
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize CloudWatch client
cloudwatch = boto3.client('cloudwatch')

class CloudWatchMetrics:
    def __init__(self, namespace="VoiceInsight"):
        self.namespace = namespace
        self.cloudwatch = cloudwatch
    
    def put_metric(self, metric_name: str, value: float, unit: str = "Count", dimensions: Optional[dict] = None):
        """Send custom metric to CloudWatch"""
        try:
            metric_data = {
                'MetricName': metric_name,
                'Value': value,
                'Unit': unit,
                'Timestamp': time.time()
            }
            
            if dimensions:
                metric_data['Dimensions'] = [
                    {'Name': k, 'Value': str(v)} for k, v in dimensions.items()
                ]
            
            self.cloudwatch.put_metric_data(
                Namespace=self.namespace,
                MetricData=[metric_data]
            )
            logger.info(f"Sent metric {metric_name}: {value}")
        except Exception as e:
            logger.error(f"Failed to send metric {metric_name}: {e}")
    
    def put_custom_metric(self, metric_name: str, value: float, **dimensions):
        """Convenience method for custom metrics"""
        self.put_metric(metric_name, value, dimensions=dimensions)

# Initialize metrics
metrics = CloudWatchMetrics()

# Create FastAPI app
app = FastAPI(
    title="Speech-to-Text Sentiment Analysis API - Lambda",
    description="Serverless API for converting speech to text and analyzing sentiment with CloudWatch monitoring",
    version="4.0.0"
)

# CORS setup for Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://*.vercel.app",
        "https://your-domain.com",
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for service instances (Lambda container reuse)
stt_service = None
sentiment_service = None
audio_processor = None

def get_services():
    """Initialize services with lazy loading for Lambda optimization"""
    global stt_service, sentiment_service, audio_processor
    
    if stt_service is None:
        logger.info("Initializing services...")
        start_time = time.time()
        
        stt_service = SpeechToTextService()
        sentiment_service = SentimentAnalysisService()
        audio_processor = AudioProcessor()
        
        init_time = time.time() - start_time
        metrics.put_metric("ServiceInitializationTime", init_time, "Seconds")
        logger.info(f"Services initialized in {init_time:.2f} seconds")
    
    return stt_service, sentiment_service, audio_processor

@app.middleware("http")
async def add_cloudwatch_metrics(request, call_next):
    """Middleware to track API metrics"""
    start_time = time.time()
    
    # Track request
    metrics.put_metric("APIRequests", 1, dimensions={
        "Method": request.method,
        "Path": request.url.path
    })
    
    try:
        response = await call_next(request)
        
        # Track response time
        duration = time.time() - start_time
        metrics.put_metric("ResponseTime", duration, "Seconds", dimensions={
            "Method": request.method,
            "Path": request.url.path,
            "StatusCode": str(response.status_code)
        })
        
        # Track success/error rates
        if response.status_code >= 400:
            metrics.put_metric("APIErrors", 1, dimensions={
                "StatusCode": str(response.status_code),
                "Path": request.url.path
            })
        else:
            metrics.put_metric("APISuccess", 1, dimensions={
                "Path": request.url.path
            })
        
        return response
        
    except Exception as e:
        # Track exceptions
        metrics.put_metric("APIExceptions", 1, dimensions={
            "Path": request.url.path,
            "Exception": type(e).__name__
        })
        logger.error(f"API Exception: {e}")
        raise

@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint"""
    metrics.put_metric("HealthCheck", 1)
    return HealthResponse(
        message="Speech-to-Text Sentiment Analysis API (Lambda) is running!",
        status="healthy",
        version="4.0.0"
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Detailed health check with service status"""
    try:
        stt, sentiment, audio = get_services()
        
        health_status = {
            "stt_service": stt is not None,
            "sentiment_service": sentiment is not None,
            "audio_processor": audio is not None
        }
        
        metrics.put_metric("HealthCheckDetailed", 1, dimensions=health_status)
        
        return HealthResponse(
            message="All services healthy",
            status="healthy",
            version="4.0.0"
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        metrics.put_metric("HealthCheckFailed", 1)
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.post("/api/process-audio", response_model=AudioProcessResponse)
async def process_audio_complete(
    audio_file: UploadFile = File(...),
    language: Optional[str] = Query(None),
    auto_detect: bool = Query(True)
):
    """Process audio with enhanced CloudWatch monitoring"""
    start_time = time.time()
    
    try:
        # Get services
        stt_service, sentiment_service, audio_processor = get_services()
        
        # Track file upload metrics
        file_size = 0
        content = await audio_file.read()
        file_size = len(content)
        
        metrics.put_metric("AudioFileSize", file_size, "Bytes")
        metrics.put_metric("AudioProcessingStarted", 1, dimensions={
            "Language": language or "auto",
            "FileType": audio_file.content_type or "unknown"
        })
        
        # Create temporary file for processing
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Transcribe audio
            transcription_start = time.time()
            transcript_result = await stt_service.transcribe_audio(
                temp_file_path,
                language_code=language,
                auto_detect=auto_detect
            )
            transcription_time = time.time() - transcription_start
            
            metrics.put_metric("TranscriptionTime", transcription_time, "Seconds")
            metrics.put_metric("TranscriptionSuccess", 1, dimensions={
                "Language": transcript_result.get("language", "unknown"),
                "IsSouthIndian": str(transcript_result.get("is_south_indian_language", False))
            })
            
            # Analyze sentiment
            sentiment_start = time.time()
            detected_language = transcript_result.get("language", language)
            sentiment_result = await sentiment_service.analyze_sentiment(
                transcript_result["text"],
                language=detected_language
            )
            sentiment_time = time.time() - sentiment_start
            
            metrics.put_metric("SentimentAnalysisTime", sentiment_time, "Seconds")
            
            # Track emotion detection
            if sentiment_result.get("emotions"):
                primary_emotion = sentiment_result["emotions"]["primary_emotion"]
                emotion_confidence = sentiment_result["emotions"]["confidence"]
                
                metrics.put_metric("EmotionDetected", 1, dimensions={
                    "Emotion": primary_emotion,
                    "Category": sentiment_result["emotions"]["category"],
                    "Intensity": sentiment_result["emotions"]["intensity"]
                })
                metrics.put_metric("EmotionConfidence", emotion_confidence, "Percent")
            
            # Track sentiment
            metrics.put_metric("SentimentDetected", 1, dimensions={
                "Sentiment": sentiment_result["sentiment"],
                "Language": detected_language
            })
            
            total_processing_time = time.time() - start_time
            metrics.put_metric("TotalProcessingTime", total_processing_time, "Seconds")
            
            # Prepare response
            emotions = sentiment_result.get("emotions", {})
            
            response = AudioProcessResponse(
                transcript=transcript_result["text"],
                original_transcript=transcript_result.get("original_text", transcript_result["text"]),
                transcript_confidence=transcript_result.get("confidence", 0.0),
                language=detected_language,
                language_name=transcript_result.get("language_name", "Unknown"),
                is_south_indian_language=transcript_result.get("is_south_indian_language", False),
                sentiment=sentiment_result["sentiment"],
                sentiment_confidence=sentiment_result["confidence"],
                sentiment_scores=sentiment_result["scores"],
                processing_time=total_processing_time,
                detected_language_info=transcript_result.get("detected_language_info"),
                sentiment_method=sentiment_result.get("method", "unknown"),
                emotions=emotions
            )
            
            metrics.put_metric("AudioProcessingSuccess", 1)
            logger.info(f"Successfully processed audio in {total_processing_time:.2f}s")
            
            return response
            
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_file_path)
            except:
                pass
                
    except Exception as e:
        error_time = time.time() - start_time
        metrics.put_metric("AudioProcessingError", 1, dimensions={
            "ErrorType": type(e).__name__
        })
        metrics.put_metric("ErrorProcessingTime", error_time, "Seconds")
        
        logger.error(f"Error processing audio: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")

@app.post("/api/metrics")
async def receive_frontend_metrics(metrics_data: dict):
    """Receive custom metrics from frontend"""
    try:
        for metric_name, metric_value in metrics_data.items():
            if isinstance(metric_value, dict):
                # Handle complex metrics with dimensions
                value = metric_value.get("value", 1)
                dimensions = metric_value.get("dimensions", {})
                metrics.put_metric(f"Frontend_{metric_name}", value, dimensions=dimensions)
            else:
                # Simple metric
                metrics.put_metric(f"Frontend_{metric_name}", metric_value)
        
        return {"status": "success", "message": "Metrics received"}
    except Exception as e:
        logger.error(f"Error processing frontend metrics: {e}")
        raise HTTPException(status_code=400, detail="Invalid metrics data")

@app.get("/api/supported-languages")
async def get_supported_languages():
    """Get supported languages with metrics tracking"""
    try:
        stt_service, sentiment_service, _ = get_services()
        
        stt_info = stt_service.get_model_info()
        sentiment_info = sentiment_service.get_analyzer_info()
        
        metrics.put_metric("SupportedLanguagesRequested", 1)
        
        return {
            "speech_to_text": {
                "all_languages": stt_info["supported_languages"],
                "south_indian_languages": stt_info["south_indian_languages"],
                "enhanced_support": list(stt_info["south_indian_languages"].keys())
            },
            "sentiment_analysis": {
                "supported_languages": sentiment_service.get_supported_languages(),
                "south_indian_languages": sentiment_info["supported_south_indian_languages"],
                "multilingual_support": sentiment_info["multilingual_support"]
            }
        }
    except Exception as e:
        logger.error(f"Error getting supported languages: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/supported-emotions")
async def get_supported_emotions():
    """Get supported emotions with metrics tracking"""
    try:
        _, sentiment_service, _ = get_services()
        
        emotion_info = sentiment_service.get_analyzer_info()["emotion_analysis"]
        
        metrics.put_metric("SupportedEmotionsRequested", 1)
        
        return PreciseEmotionsResponse(
            supported_emotions=emotion_info["supported_emotions"],
            emotion_categories=emotion_info["emotion_categories"],
            intensity_levels=emotion_info["intensity_levels"],
            models_loaded=emotion_info["models_loaded"]
        )
    except Exception as e:
        logger.error(f"Error getting supported emotions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Lambda handler
handler = Mangum(app, lifespan="off")

def lambda_handler(event, context):
    """AWS Lambda entry point with enhanced logging"""
    try:
        # Log Lambda context information
        logger.info(f"Lambda invocation - Request ID: {context.aws_request_id}")
        logger.info(f"Memory limit: {context.memory_limit_in_mb}MB")
        logger.info(f"Time remaining: {context.get_remaining_time_in_millis()}ms")
        
        # Track Lambda invocations
        metrics.put_metric("LambdaInvocations", 1, dimensions={
            "FunctionName": context.function_name,
            "FunctionVersion": context.function_version
        })
        
        # Handle the request
        response = handler(event, context)
        
        # Track successful Lambda executions
        metrics.put_metric("LambdaSuccess", 1)
        
        return response
        
    except Exception as e:
        # Track Lambda errors
        metrics.put_metric("LambdaErrors", 1, dimensions={
            "ErrorType": type(e).__name__
        })
        logger.error(f"Lambda execution error: {e}")
        raise