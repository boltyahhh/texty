export interface TranscriptionResult {
  text: string;
  processingTime?: number;
}

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: {
    positive: number;
    negative: number;
    neutral: number;
  };
  processingTime?: number;
}

// Updated to match backend response structure
export interface ProcessingResult {
  transcript: string;                    // matches backend
  transcript_confidence: number;         // matches backend
  sentiment: string;                     // matches backend
  sentiment_confidence: number;          // matches backend
  sentiment_scores: {                    // matches backend
    [key: string]: number;
  };
  processing_time: number;               // matches backend
  totalProcessingTime?: number;          // added by frontend
}

export type ProcessingStatus = 'idle' | 'recording' | 'uploading' | 'processing' | 'success' | 'error';