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
 * @param language Optional language code
 * @param autoDetect Whether to auto-detect language
 * @returns ProcessingResult object from backend
 */
export const processAudio = async (
  audioFile: File, 
  language?: string, 
  autoDetect: boolean = true
): Promise<ProcessingResult> => {
  const startTime = Date.now();

  try {
    const formData = new FormData();
    formData.append('audio_file', audioFile);

    // Build query parameters
    const params = new URLSearchParams();
    if (language && language !== 'auto') {
      params.append('language', language);
    }
    params.append('auto_detect', autoDetect.toString());

    const url = `/api/process-audio${params.toString() ? '?' + params.toString() : ''}`;
    const response = await api.post(url, formData);
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

/**
 * Detect the language of an audio file
 * @param audioFile Audio file to analyze
 * @returns Language detection result
 */
export const detectLanguage = async (audioFile: File) => {
  try {
    const formData = new FormData();
    formData.append('audio_file', audioFile);

    const response = await api.post('/api/detect-language', formData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to detect language');
    }
    throw error;
  }
};

/**
 * Get supported languages
 * @returns List of supported languages
 */
export const getSupportedLanguages = async () => {
  try {
    const response = await api.get('/api/supported-languages');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to get supported languages');
    }
    throw error;
  }
};

/**
 * Get model information
 * @returns Model information and capabilities
 */
export const getModelInfo = async () => {
  try {
    const response = await api.get('/api/model-info');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to get model info');
    }
    throw error;
  }
};