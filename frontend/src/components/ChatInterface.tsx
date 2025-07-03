import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Square, Volume2, VolumeX, Download, Trash2 } from 'lucide-react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { Message, ProcessingResult, AIPersonality } from '../types';
import { processAudio } from '../services/api';
import { generateAIResponse } from '../services/openai';
import { ttsService } from '../services/textToSpeech';
import { conversationManager } from '../services/conversationManager';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import AudioVisualizer from './AudioVisualizer';

interface ChatInterfaceProps {
  personality: AIPersonality;
  autoSpeak: boolean;
  voiceSettings: any;
  onNewMessage?: (message: Message) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  personality,
  autoSpeak,
  voiceSettings,
  onNewMessage
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAITyping, setIsAITyping] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [timerId, setTimerId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl
  } = useReactMediaRecorder({
    audio: true,
    onStop: (blobUrl, blob) => {
      if (blob) {
        handleAudioProcessing(blob);
      }
    }
  });

  const isRecording = status === 'recording';

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAITyping]);

  useEffect(() => {
    // Load current conversation
    const conversation = conversationManager.getCurrentConversation();
    if (conversation) {
      setMessages(conversation.messages);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartRecording = () => {
    clearBlobUrl();
    startRecording();
    
    setRecordingTime(0);
    const id = window.setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    setTimerId(id);
  };

  const handleStopRecording = () => {
    stopRecording();
    
    if (timerId) {
      window.clearInterval(timerId);
      setTimerId(null);
    }
  };

  const handleAudioProcessing = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
      const result = await processAudio(audioFile, undefined, true);
      
      // Create user message
      const userMessage = conversationManager.addMessage({
        type: 'user',
        content: result.transcript,
        audioUrl: URL.createObjectURL(audioBlob),
        processingResult: result
      });

      setMessages(prev => [...prev, userMessage]);
      onNewMessage?.(userMessage);

      // Generate AI response
      await generateAndAddAIResponse(result);
      
    } catch (error) {
      console.error('Error processing audio:', error);
      // Add error message
      const errorMessage = conversationManager.addMessage({
        type: 'ai',
        content: "I'm sorry, I had trouble processing your audio. Could you try again?"
      });
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateAndAddAIResponse = async (processingResult: ProcessingResult) => {
    setIsAITyping(true);
    
    try {
      const conversationHistory = conversationManager.getConversationHistory();
      
      const aiResponse = await generateAIResponse({
        transcript: processingResult.transcript,
        sentiment: processingResult.sentiment,
        emotions: processingResult.emotions,
        conversationHistory,
        personality: personality.id
      });

      // Add AI message with typing effect
      const aiMessage = conversationManager.addMessage({
        type: 'ai',
        content: aiResponse.content,
        isTyping: true
      });

      setMessages(prev => [...prev, aiMessage]);

      // Simulate typing delay
      await new Promise(resolve => setTimeout(resolve, 1000 + aiResponse.content.length * 20));

      // Update message to stop typing
      conversationManager.updateMessage(aiMessage.id, { isTyping: false });
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessage.id ? { ...msg, isTyping: false } : msg
      ));

      // Speak the response if auto-speak is enabled
      if (autoSpeak && voiceSettings.enabled) {
        const emotionalSettings = processingResult.emotions 
          ? ttsService.getEmotionalSettings(processingResult.emotions.primary_emotion)
          : {};
        
        await ttsService.speak(aiResponse.content, {
          ...voiceSettings,
          ...emotionalSettings
        });
      }

      onNewMessage?.(aiMessage);
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      const fallbackMessage = conversationManager.addMessage({
        type: 'ai',
        content: "I'm here to listen. What would you like to talk about?"
      });
      
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsAITyping(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleAudioFile(file);
    }
  };

  const handleAudioFile = async (file: File) => {
    setIsProcessing(true);
    
    try {
      const result = await processAudio(file, undefined, true);
      
      const userMessage = conversationManager.addMessage({
        type: 'user',
        content: result.transcript,
        audioUrl: URL.createObjectURL(file),
        processingResult: result
      });

      setMessages(prev => [...prev, userMessage]);
      onNewMessage?.(userMessage);

      await generateAndAddAIResponse(result);
      
    } catch (error) {
      console.error('Error processing audio file:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSpeakMessage = async (content: string, emotion?: string) => {
    if (ttsService.isSpeaking()) {
      ttsService.stop();
      return;
    }

    const emotionalSettings = emotion 
      ? ttsService.getEmotionalSettings(emotion)
      : {};

    try {
      await ttsService.speak(content, {
        ...voiceSettings,
        ...emotionalSettings
      });
    } catch (error) {
      console.error('Error speaking message:', error);
    }
  };

  const handleExportConversation = () => {
    const conversation = conversationManager.getCurrentConversation();
    if (!conversation) return;

    const exportData = conversationManager.exportConversation(conversation.id);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearConversation = () => {
    if (window.confirm('Are you sure you want to clear this conversation?')) {
      const conversation = conversationManager.getCurrentConversation();
      if (conversation) {
        conversationManager.deleteConversation(conversation.id);
        setMessages([]);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-white/5 dark:bg-black/5 backdrop-blur-lg rounded-lg border border-white/10 dark:border-gray-800/50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 dark:border-gray-800/50">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl ${personality.color}`}>
            {personality.icon}
          </div>
          <div className="ml-3">
            <h3 className="font-medium text-gray-800 dark:text-white">{personality.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{personality.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportConversation}
            className="p-2 rounded-lg bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
            title="Export conversation"
          >
            <Download size={18} />
          </button>
          <button
            onClick={handleClearConversation}
            className="p-2 rounded-lg bg-white/10 dark:bg-black/10 hover:bg-red-500/20 transition-colors text-red-500"
            title="Clear conversation"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onSpeak={handleSpeakMessage}
              isSpeaking={ttsService.isSpeaking()}
            />
          ))}
        </AnimatePresence>
        
        {isAITyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 dark:border-gray-800/50">
        {isRecording && (
          <div className="mb-4">
            <AudioVisualizer isRecording={true} />
            <div className="text-center text-gray-600 dark:text-gray-400 mt-2">
              Recording: {formatTime(recordingTime)}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing || isRecording}
            className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            title="Upload audio file"
          >
            <Send size={20} />
          </button>

          <div className="flex-1 flex justify-center">
            {!isRecording ? (
              <motion.button
                onClick={handleStartRecording}
                disabled={isProcessing}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-full shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Mic size={20} className="mr-2" />
                {isProcessing ? 'Processing...' : 'Start Recording'}
              </motion.button>
            ) : (
              <motion.button
                onClick={handleStopRecording}
                className="flex items-center px-6 py-3 bg-red-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Square size={20} className="mr-2" />
                Stop Recording
              </motion.button>
            )}
          </div>

          <button
            onClick={() => ttsService.isSpeaking() ? ttsService.stop() : null}
            disabled={!ttsService.isSpeaking()}
            className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            title={ttsService.isSpeaking() ? "Stop speaking" : "Not speaking"}
          >
            {ttsService.isSpeaking() ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;