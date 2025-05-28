import whisper
import time
import os
from typing import Dict, Any
import torch

class SpeechToTextService:
    def __init__(self, model_size: str = "base"):
        """
        Initialize the Speech-to-Text service using OpenAI Whisper
        
        Args:
            model_size: Whisper model size ("tiny", "base", "small", "medium", "large")
        """
        self.model_size = model_size
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load the Whisper model"""
        try:
            print(f"Loading Whisper model: {self.model_size}")
            self.model = whisper.load_model(self.model_size)
            print(f"Model loaded successfully!")
        except Exception as e:
            print(f"Error loading Whisper model: {e}")
            raise e
    
    async def transcribe_audio(self, audio_file_path: str) -> Dict[str, Any]:
        """
        Transcribe audio file to text
        
        Args:
            audio_file_path: Path to the audio file
            
        Returns:
            Dictionary containing transcript and metadata
        """
        if not os.path.exists(audio_file_path):
            raise FileNotFoundError(f"Audio file not found: {audio_file_path}")
        
        try:
            start_time = time.time()
            
            # Transcribe using Whisper
            result = self.model.transcribe(
                audio_file_path,
                fp16=torch.cuda.is_available(),  # Use FP16 if CUDA is available
                language=None,  # Auto-detect language
                task="transcribe"
            )
            
            processing_time = time.time() - start_time
            
            return {
                "text": result["text"].strip(),
                "language": result.get("language", "unknown"),
                "confidence": self._calculate_confidence(result),
                "processing_time": processing_time,
                "segments": result.get("segments", [])
            }
            
        except Exception as e:
            raise Exception(f"Error during transcription: {str(e)}")
    
    def _calculate_confidence(self, result: Dict[str, Any]) -> float:
        """
        Calculate average confidence from Whisper segments
        
        Args:
            result: Whisper transcription result
            
        Returns:
            Average confidence score (0.0 to 1.0)
        """
        segments = result.get("segments", [])
        if not segments:
            return 0.5  # Default confidence if no segments
        
        # Calculate average confidence from all segments
        confidences = []
        for segment in segments:
            if "avg_logprob" in segment:
                # Convert log probability to confidence (approximate)
                confidence = min(1.0, max(0.0, (segment["avg_logprob"] + 1.0)))
                confidences.append(confidence)
        
        return sum(confidences) / len(confidences) if confidences else 0.5
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model"""
        return {
            "model_size": self.model_size,
            "model_loaded": self.model is not None,
            "cuda_available": torch.cuda.is_available(),
            "supported_languages": [
                "en", "zh", "de", "es", "ru", "ko", "fr", "ja", "pt", "tr", 
                "pl", "ca", "nl", "ar", "sv", "it", "id", "hi", "fi", "vi",
                "he", "uk", "el", "ms", "cs", "ro", "da", "hu", "ta", "no"
            ]
        }
    
    def change_model(self, model_size: str):
        """Change the Whisper model size"""
        if model_size != self.model_size:
            self.model_size = model_size
            self._load_model()


# Alternative implementation using Google Cloud Speech-to-Text
# Uncomment and configure if you prefer to use Google Cloud instead of Whisper

# from google.cloud import speech
# import io

# class GoogleSpeechToTextService:
#     def __init__(self):
#         self.client = speech.SpeechClient()
    
#     async def transcribe_audio(self, audio_file_path: str) -> Dict[str, Any]:
#         try:
#             with io.open(audio_file_path, "rb") as audio_file:
#                 content = audio_file.read()
            
#             audio = speech.RecognitionAudio(content=content)
#             config = speech.RecognitionConfig(
#                 encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
#                 sample_rate_hertz=16000,
#                 language_code="en-US",
#                 enable_automatic_punctuation=True,
#             )
            
#             start_time = time.time()
#             response = self.client.recognize(config=config, audio=audio)
#             processing_time = time.time() - start_time
            
#             if response.results:
#                 transcript = response.results[0].alternatives[0].transcript
#                 confidence = response.results[0].alternatives[0].confidence
#             else:
#                 transcript = ""
#                 confidence = 0.0
            
#             return {
#                 "text": transcript,
#                 "confidence": confidence,
#                 "processing_time": processing_time
#             }
        
#         except Exception as e:
#             raise Exception(f"Google Speech-to-Text error: {str(e)}")