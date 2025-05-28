from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from models.schemas import AudioProcessResponse, HealthResponse
from services.speech_to_text import SpeechToTextService
from services.sentiment_analysis import SentimentAnalysisService
from utils.audio_processing import AudioProcessor
import os
import uvicorn

# Load environment variables from .env file
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Speech-to-Text Sentiment Analysis API",
    description="API for converting speech to text and analyzing sentiment",
    version="1.0.0"
)

# CORS setup for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React (Create React App)
        "http://localhost:5173",  # Vite (React/Vue)
        "http://localhost:8080",  # Vue CLI
        "http://127.0.0.1:3000",  # Alternative localhost
        "http://127.0.0.1:5173",  # Alternative localhost
        "https://your-production-frontend.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
stt_service = SpeechToTextService()
sentiment_service = SentimentAnalysisService()
audio_processor = AudioProcessor()

# Create upload directory
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- Endpoints ---

@app.get("/", response_model=HealthResponse)
async def root():
    return HealthResponse(
        message="Speech-to-Text Sentiment Analysis API is running!",
        status="healthy",
        version="1.0.0"
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        message="API is healthy",
        status="healthy",
        version="1.0.0"
    )

@app.post("/api/upload-audio")
async def upload_audio(audio_file: UploadFile = File(...)):
    try:
        if not audio_file.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="File must be an audio file")
        file_path = os.path.join(UPLOAD_DIR, audio_file.filename)
        with open(file_path, "wb") as buffer:
            content = await audio_file.read()
            buffer.write(content)
        return {
            "message": "File uploaded successfully",
            "filename": audio_file.filename,
            "file_path": file_path,
            "file_size": len(content)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@app.post("/api/transcribe")
async def transcribe_audio(audio_file: UploadFile = File(...)):
    try:
        file_path = os.path.join(UPLOAD_DIR, f"temp_{audio_file.filename}")
        with open(file_path, "wb") as buffer:
            content = await audio_file.read()
            buffer.write(content)
        transcript = await stt_service.transcribe_audio(file_path)
        os.remove(file_path)
        return {
            "transcript": transcript["text"],
            "confidence": transcript.get("confidence", 0.0),
            "processing_time": transcript.get("processing_time", 0.0)
        }
    except Exception as e:
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error transcribing audio: {str(e)}")

@app.post("/api/analyze-sentiment")
async def analyze_sentiment(text: dict):
    try:
        if "text" not in text:
            raise HTTPException(status_code=400, detail="Text field is required")
        result = await sentiment_service.analyze_sentiment(text["text"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing sentiment: {str(e)}")

@app.post("/api/process-audio", response_model=AudioProcessResponse)
async def process_audio_complete(audio_file: UploadFile = File(...)):
    try:
        file_path = os.path.join(UPLOAD_DIR, f"temp_{audio_file.filename}")
        with open(file_path, "wb") as buffer:
            content = await audio_file.read()
            buffer.write(content)

        transcript_result = await stt_service.transcribe_audio(file_path)
        sentiment_result = await sentiment_service.analyze_sentiment(transcript_result["text"])
        os.remove(file_path)

        return AudioProcessResponse(
            transcript=transcript_result["text"],
            transcript_confidence=transcript_result.get("confidence", 0.0),
            sentiment=sentiment_result["sentiment"],
            sentiment_confidence=sentiment_result["confidence"],
            sentiment_scores=sentiment_result["scores"],
            processing_time=transcript_result.get("processing_time", 0.0) + sentiment_result.get("processing_time", 0.0)
        )
    except Exception as e:
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")

# --- Main entry point ---
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",  # Use this for local testing
        port=8000,
        reload=True
    )
