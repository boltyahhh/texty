import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const backendApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  timeout: 30000,
})

export interface ProcessingResult {
  transcript: string
  original_transcript?: string
  language: string
  language_name?: string
  is_south_indian_language?: boolean
  sentiment: {
    sentiment: string
    confidence: number
    scores: Record<string, number>
  }
  emotions: {
    primary_emotion: string
    confidence: number
    emotion_scores: Record<string, number>
    category: string
    intensity: string
    top_emotions?: Array<{
      emotion: string
      score: number
      category: string
      intensity: string
    }>
  }
  processing_time: number
}

export const processAudioWithBackend = async (
  audioFile: File, 
  language?: string, 
  autoDetect: boolean = true
): Promise<ProcessingResult> => {
  const startTime = Date.now()

  try {
    const formData = new FormData()
    formData.append('audio_file', audioFile)

    const params = new URLSearchParams()
    if (language && language !== 'auto') {
      params.append('language', language)
    }
    params.append('auto_detect', autoDetect.toString())

    const url = `/api/process-audio${params.toString() ? '?' + params.toString() : ''}`
    
    const response = await backendApi.post(url, formData, {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          console.log(`Upload progress: ${percentCompleted}%`)
        }
      }
    })

    const totalProcessingTime = (Date.now() - startTime) / 1000

    return {
      ...response.data,
      processing_time: totalProcessingTime,
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout - Backend may be processing')
      }
      throw new Error(error.response?.data?.detail || 'Failed to process audio')
    }
    throw error
  }
}

export const detectLanguageWithBackend = async (audioFile: File) => {
  try {
    const formData = new FormData()
    formData.append('audio_file', audioFile)

    const response = await backendApi.post('/api/detect-language', formData)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to detect language')
    }
    throw error
  }
}

export const getSupportedLanguages = async () => {
  try {
    const response = await backendApi.get('/api/supported-languages')
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to get supported languages')
    }
    throw error
  }
}

export const getSupportedEmotions = async () => {
  try {
    const response = await backendApi.get('/api/supported-emotions')
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to get supported emotions')
    }
    throw error
  }
}

export const analyzeSentimentWithBackend = async (text: string, language?: string) => {
  try {
    const params = new URLSearchParams()
    if (language) {
      params.append('language', language)
    }

    const response = await backendApi.post(
      `/api/analyze-sentiment${params.toString() ? '?' + params.toString() : ''}`,
      { text }
    )
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to analyze sentiment')
    }
    throw error
  }
}

export const getModelInfo = async () => {
  try {
    const response = await backendApi.get('/api/model-info')
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to get model info')
    }
    throw error
  }
}

export const checkBackendHealth = async () => {
  try {
    const response = await backendApi.get('/health')
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error('Backend is not responding')
    }
    throw error
  }
}