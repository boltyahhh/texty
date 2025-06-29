'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Send, Square, Upload, Volume2, VolumeX, RefreshCw } from 'lucide-react'
import { useReactMediaRecorder } from 'react-media-recorder'
import { useConversationStore } from '@/store/conversationStore'
import { useSettingsStore } from '@/store/settingsStore'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import AudioWaveform from './AudioWaveform'
import { processAudioWithBackend } from '@/services/backendApi'
import { generateAIResponse } from '@/services/openaiApi'
import { speakText, stopSpeaking, isSpeaking } from '@/services/ttsService'
import toast from 'react-hot-toast'

export default function ChatInterface() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isAITyping, setIsAITyping] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('connected')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout>()

  const { getCurrentConversation, addMessage, updateMessage } = useConversationStore()
  const { aiPersonality, voiceSettings, autoSpeak } = useSettingsStore()

  const {
    status: recordingStatus,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl
  } = useReactMediaRecorder({
    audio: true,
    onStop: handleRecordingComplete
  })

  const isRecording = recordingStatus === 'recording'
  const currentConversation = getCurrentConversation()

  useEffect(() => {
    scrollToBottom()
  }, [currentConversation?.messages, isAITyping])

  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0)
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }, [isRecording])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleStartRecording = async () => {
    try {
      clearBlobUrl()
      await startRecording()
      toast.success('Recording started')
    } catch (error) {
      toast.error('Failed to start recording')
      console.error('Recording error:', error)
    }
  }

  const handleStopRecording = () => {
    stopRecording()
    toast.success('Recording stopped')
  }

  async function handleRecordingComplete(blobUrl: string, blob: Blob) {
    if (!blob) return

    setIsProcessing(true)
    
    try {
      const audioFile = new File([blob], 'recording.webm', { type: 'audio/webm' })
      
      const result = await processAudioWithBackend(audioFile)
      
      const userMessage = addMessage({
        type: 'user',
        content: result.transcript,
        audioUrl: blobUrl,
        emotions: {
          primary: result.emotions.primary_emotion,
          confidence: result.emotions.confidence,
          scores: result.emotions.emotion_scores
        },
        sentiment: {
          label: result.sentiment.sentiment,
          confidence: result.sentiment.confidence,
          scores: result.sentiment.scores
        }
      })

      await generateAndAddAIResponse(result, userMessage.id)
      setConnectionStatus('connected')
      
    } catch (error) {
      console.error('Error processing audio:', error)
      setConnectionStatus('error')
      toast.error('Failed to process audio')
      
      addMessage({
        type: 'ai',
        content: "I'm sorry, I had trouble processing your audio. Could you try again?"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file')
      return
    }

    setIsProcessing(true)
    
    try {
      const result = await processAudioWithBackend(file)
      
      const userMessage = addMessage({
        type: 'user',
        content: result.transcript,
        audioUrl: URL.createObjectURL(file),
        emotions: {
          primary: result.emotions.primary_emotion,
          confidence: result.emotions.confidence,
          scores: result.emotions.emotion_scores
        },
        sentiment: {
          label: result.sentiment.sentiment,
          confidence: result.sentiment.confidence,
          scores: result.sentiment.scores
        }
      })

      await generateAndAddAIResponse(result, userMessage.id)
      setConnectionStatus('connected')
      
    } catch (error) {
      console.error('Error processing file:', error)
      setConnectionStatus('error')
      toast.error('Failed to process audio file')
    } finally {
      setIsProcessing(false)
    }
  }

  const generateAndAddAIResponse = async (processingResult: any, userMessageId: string) => {
    setIsAITyping(true)
    
    try {
      const conversationHistory = currentConversation?.messages.map(msg => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      })) || []

      const aiResponse = await generateAIResponse({
        transcript: processingResult.transcript,
        emotions: {
          primary: processingResult.emotions.primary_emotion,
          confidence: processingResult.emotions.confidence,
          scores: processingResult.emotions.emotion_scores
        },
        sentiment: {
          label: processingResult.sentiment.sentiment,
          confidence: processingResult.sentiment.confidence,
          scores: processingResult.sentiment.scores
        },
        conversationHistory,
        personality: aiPersonality
      })

      const aiMessage = addMessage({
        type: 'ai',
        content: aiResponse.content,
        isTyping: true
      })

      await new Promise(resolve => setTimeout(resolve, 1000 + aiResponse.content.length * 20))

      updateMessage(aiMessage.id, { isTyping: false })

      if (autoSpeak && voiceSettings.enabled) {
        await speakText(aiResponse.content, voiceSettings, processingResult.emotions.primary_emotion)
      }
      
    } catch (error) {
      console.error('Error generating AI response:', error)
      
      const fallbackMessage = addMessage({
        type: 'ai',
        content: "I'm here to listen. What would you like to talk about?"
      })
      
      updateMessage(fallbackMessage.id, { isTyping: false })
    } finally {
      setIsAITyping(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    const audioFile = files.find(file => file.type.startsWith('audio/'))
    
    if (audioFile) {
      handleFileUpload(audioFile)
    } else {
      toast.error('Please drop an audio file')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSpeakMessage = async (content: string, emotion?: string) => {
    if (isSpeaking()) {
      stopSpeaking()
      return
    }

    try {
      await speakText(content, voiceSettings, emotion)
    } catch (error) {
      console.error('Error speaking message:', error)
      toast.error('Failed to speak message')
    }
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500'
      case 'error': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 safe-area-top">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center mr-3">
            <span className="text-white text-lg">🤖</span>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              AI Assistant
            </h2>
            <p className={`text-sm ${getConnectionStatusColor()}`}>
              {connectionStatus === 'connected' ? 'Online' : 
               connectionStatus === 'error' ? 'Connection Error' : 'Offline'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => isSpeaking() ? stopSpeaking() : null}
            disabled={!isSpeaking()}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 disabled:opacity-50 touch-manipulation"
          >
            {isSpeaking() ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 touch-manipulation"
            title="Refresh connection"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <AnimatePresence>
          {dragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-primary-500/20 backdrop-blur-sm z-40 flex items-center justify-center"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
                <Upload size={48} className="mx-auto mb-4 text-primary-500" />
                <p className="text-lg font-medium text-gray-900 dark:text-white text-center">
                  Drop your audio file here
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {currentConversation?.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onSpeak={handleSpeakMessage}
              isSpeaking={isSpeaking()}
            />
          ))}
        </AnimatePresence>
        
        {isAITyping && <TypingIndicator />}
        
        {currentConversation?.messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
              <Mic className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Start a conversation
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Record your voice or upload an audio file to begin
            </p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Recording Visualization */}
      {isRecording && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <AudioWaveform isRecording={true} />
          <div className="text-center text-gray-600 dark:text-gray-400 mt-2">
            Recording: {formatTime(recordingTime)}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 safe-area-bottom">
        <div className="flex items-center space-x-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(file)
            }}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing || isRecording}
            className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors touch-manipulation"
          >
            <Upload size={20} />
          </button>

          <div className="flex-1 flex justify-center">
            {!isRecording ? (
              <motion.button
                onClick={handleStartRecording}
                disabled={isProcessing}
                className="btn-primary flex items-center px-8 py-4 text-lg touch-manipulation"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Mic size={24} className="mr-2" />
                {isProcessing ? 'Processing...' : 'Record'}
              </motion.button>
            ) : (
              <motion.button
                onClick={handleStopRecording}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-4 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 flex items-center text-lg touch-manipulation"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Square size={24} className="mr-2" />
                Stop
              </motion.button>
            )}
          </div>

          <button
            onClick={() => {/* Voice commands handler */}}
            disabled={isProcessing || isRecording}
            className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors touch-manipulation"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}