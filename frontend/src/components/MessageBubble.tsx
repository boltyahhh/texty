import { motion } from 'framer-motion'
import { Volume2, VolumeX, User, Bot, Heart, ThumbsUp, Smile, Frown } from 'lucide-react'
import { Message } from '../store/conversationStore'
import { useConversationStore } from '../store/conversationStore'
import EmotionDisplay from './EmotionDisplay'

interface MessageBubbleProps {
  message: Message
  onSpeak: (content: string, emotion?: string) => void
  isSpeaking: boolean
}

const REACTION_EMOJIS = ['👍', '❤️', '😊', '😢', '😮', '😡']

export default function MessageBubble({ message, onSpeak, isSpeaking }: MessageBubbleProps) {
  const { addReaction, removeReaction } = useConversationStore()
  const isUser = message.type === 'user'

  const handleReaction = (emoji: string) => {
    if (message.reactions?.includes(emoji)) {
      removeReaction(message.id, emoji)
    } else {
      addReaction(message.id, emoji)
    }
  }

  const getEmotionIcon = (emotion: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'happy': <Smile className="w-4 h-4" />,
      'love': <Heart className="w-4 h-4" />,
      'sad': <Frown className="w-4 h-4" />,
      'angry': <Frown className="w-4 h-4" />,
      'fear': <Frown className="w-4 h-4" />,
    }
    return iconMap[emotion] || <Heart className="w-4 h-4" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-primary-500 text-white' 
              : 'bg-secondary-500 text-white'
          }`}>
            {isUser ? <User size={16} /> : <Bot size={16} />}
          </div>
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div
            className={`relative group ${
              isUser
                ? 'chat-bubble-user'
                : 'chat-bubble-ai'
            }`}
          >
            {/* Typing indicator */}
            {message.isTyping ? (
              <div className="flex items-center space-x-1 py-2">
                <div className="typing-dots">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
                <span className="text-sm text-gray-500 ml-2">typing...</span>
              </div>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            )}

            {/* Audio playback for user messages */}
            {message.audioUrl && (
              <div className="mt-3 pt-3 border-t border-white/20 dark:border-gray-600/20">
                <audio controls className="w-full h-8 rounded">
                  <source src={message.audioUrl} type="audio/webm" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            {/* Speak button for AI messages */}
            {!isUser && !message.isTyping && (
              <button
                onClick={() => onSpeak(message.content, message.emotions?.primary)}
                className="absolute -right-2 -bottom-2 w-8 h-8 bg-secondary-500 hover:bg-secondary-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors opacity-0 group-hover:opacity-100 touch-manipulation"
                title={isSpeaking ? "Stop speaking" : "Speak message"}
              >
                {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            )}
          </div>

          {/* Timestamp */}
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

          {/* Emotion analysis for user messages */}
          {isUser && message.emotions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="mt-3 w-full max-w-sm"
            >
              <EmotionDisplay emotions={message.emotions} compact />
            </motion.div>
          )}

          {/* Sentiment indicator */}
          {message.sentiment && (
            <div className="mt-2 flex items-center text-xs">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                message.sentiment.label === 'positive' ? 'bg-green-500' :
                message.sentiment.label === 'negative' ? 'bg-red-500' : 'bg-blue-500'
              }`} />
              <span className="text-gray-500 dark:text-gray-400 capitalize">
                {message.sentiment.label} ({Math.round(message.sentiment.confidence * 100)}%)
              </span>
            </div>
          )}

          {/* Reactions */}
          <div className="mt-2 flex flex-wrap gap-1">
            {/* Existing reactions */}
            {message.reactions?.map((reaction, index) => (
              <button
                key={index}
                onClick={() => handleReaction(reaction)}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors touch-manipulation"
              >
                {reaction}
              </button>
            ))}
            
            {/* Add reaction button */}
            <div className="relative group">
              <button className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors touch-manipulation">
                +
              </button>
              
              {/* Reaction picker */}
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 space-x-1 z-10">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors touch-manipulation"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}