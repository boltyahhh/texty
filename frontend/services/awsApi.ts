import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_AWS_API_GATEWAY_URL
const API_KEY = process.env.AWS_API_KEY

const awsApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
    ...(API_KEY && { 'X-API-Key': API_KEY }),
  },
  timeout: 30000, // 30 second timeout for Lambda cold starts
})

export interface AWSProcessingResult {
  transcript: string
  original_transcript?: string
  language: string
  language_name?: string
  is_south_indian_language?: boolean
  sentiment: {
    label: string
    confidence: number
    scores: Record<string, number>
  }
  emotions: {
    primary: string
    confidence: number
    scores: Record<string, number>
  }
  processing_time: number
}

export const processAudioWithAWS = async (
  audioFile: File, 
  language?: string, 
  autoDetect: boolean = true
): Promise<AWSProcessingResult> => {
  const startTime = Date.now()

  try {
    const formData = new FormData()
    formData.append('audio_file', audioFile)

    // Build query parameters
    const params = new URLSearchParams()
    if (language && language !== 'auto') {
      params.append('language', language)
    }
    params.append('auto_detect', autoDetect.toString())

    const url = `/process-audio${params.toString() ? '?' + params.toString() : ''}`
    
    const response = await awsApi.post(url, formData, {
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
        throw new Error('Request timeout - Lambda function may be experiencing cold start delays')
      }
      throw new Error(error.response?.data?.detail || 'Failed to process audio with AWS Lambda')
    }
    throw error
  }
}

export const detectLanguageWithAWS = async (audioFile: File) => {
  try {
    const formData = new FormData()
    formData.append('audio_file', audioFile)

    const response = await awsApi.post('/detect-language', formData)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to detect language')
    }
    throw error
  }
}

export const getSupportedLanguagesFromAWS = async () => {
  try {
    const response = await awsApi.get('/supported-languages')
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to get supported languages')
    }
    throw error
  }
}

export const getSupportedEmotionsFromAWS = async () => {
  try {
    const response = await awsApi.get('/supported-emotions')
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to get supported emotions')
    }
    throw error
  }
}

export const analyzeSentimentWithAWS = async (text: string, language?: string) => {
  try {
    const params = new URLSearchParams()
    if (language) {
      params.append('language', language)
    }

    const response = await awsApi.post(
      `/analyze-sentiment${params.toString() ? '?' + params.toString() : ''}`,
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

export const getModelInfoFromAWS = async () => {
  try {
    const response = await awsApi.get('/model-info')
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to get model info')
    }
    throw error
  }
}

// Health check for AWS Lambda
export const checkAWSHealth = async () => {
  try {
    const response = await awsApi.get('/health')
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error('AWS Lambda backend is not responding')
    }
    throw error
  }
}