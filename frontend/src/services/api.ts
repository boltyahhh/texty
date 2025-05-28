import axios from 'axios';
import { ProcessingResult } from '../types';

// Set the FastAPI backend URL via Vite environment variable or default to your FastAPI server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Create an Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

/**
 * Uploads the audio file and receives transcript + sentiment analysis result
 * @param audioFile Audio file to be processed
 * @returns ProcessingResult object from backend
 */
export const processAudio = async (audioFile: File): Promise<ProcessingResult> => {
  const startTime = Date.now();

  try {
    const formData = new FormData();
    formData.append('audio_file', audioFile); // Match FastAPI param name

    const response = await api.post('/api/process-audio', formData); // Correct endpoint
    const totalProcessingTime = (Date.now() - startTime) / 1000;

    return {
      ...response.data,
      totalProcessingTime,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to process audio');
    }
    throw error;
  }
};