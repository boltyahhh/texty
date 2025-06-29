import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Download, Trash2, MessageCircle, Calendar, Filter } from 'lucide-react'
import { useConversationStore } from '../store/conversationStore'
import { format } from 'date-fns'

export default function ConversationHistory() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'length' | 'emotion'>('date')
  
  const { 
    conversations, 
    setCurrentConversation, 
    deleteConversation, 
    exportConversation,
    getCurrentConversation 
  } = useConversationStore()

  const currentConversation = getCurrentConversation()

  const filteredConversations = conversations
    .filter(conv => {
      const matchesSearch = conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.messages.some(msg => msg.content.toLowerCase().includes(searchTerm.toLowerCase()))
      
      if (!matchesSearch) return false
      
      if (filterBy === 'all') return true
      
      const avgSentiment = conv.emotionalSummary?.averageSentiment || 0
      if (filterBy === 'positive') return avgSentiment > 0.1
      if (filterBy === 'negative') return avgSentiment < -0.1
      if (filterBy === 'neutral') return Math.abs(avgSentiment) <= 0.1
      
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case 'length':
          return b.messages.length - a.messages.length
        case 'emotion':
          return (b.emotionalSummary?.averageSentiment || 0) - (a.emotionalSummary?.averageSentiment || 0)
        default:
          return 0
      }
    })

  const handleExport = (conversationId: string) => {
    const data = exportConversation(conversationId)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `conversation-${conversationId}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getEmotionEmoji = (emotion: string) => {
    const emojiMap: { [key: string]: string } = {
      'anxious': '😰', 'angry': '😠', 'sad': '😢', 'happy': '😊',
      'hate': '😡', 'satisfaction': '😌', 'gratitude': '🙏', 'reproach': '😤',
      'distress': '😫', 'pride': '😤', 'fear': '😨', 'mildness': '😐',
      'pity': '😔', 'boredom': '😴', 'shame': '😳', 'disappointment': '😞',
      'hope': '🤞', 'resentment': '😒', 'love': '❤️', 'gloating': '😏',
      'anger': '😡', 'relief': '😅', 'admiration': '😍'
    }
    return emojiMap[emotion] || '😐'
  }

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.1) return 'text-green-500'
    if (sentiment < -0.1) return 'text-red-500'
    return 'text-blue-500'
  }

  const getSentimentBg = (sentiment: number) => {
    if (sentiment > 0.1) return 'bg-green-50 dark:bg-green-900/20'
    if (sentiment < -0.1) return 'bg-red-50 dark:bg-red-900/20'
    return 'bg-blue-50 dark:bg-blue-900/20'
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 safe-area-top">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <MessageCircle className="w-6 h-6 text-primary-500 mr-2" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Conversation History
            </h1>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {conversations.length} conversations
          </span>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex space-x-2 overflow-x-auto">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
            >
              <option value="all">All Moods</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
            >
              <option value="date">Sort by Date</option>
              <option value="length">Sort by Length</option>
              <option value="emotion">Sort by Emotion</option>
            </select>
          </div>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {filteredConversations.map((conversation) => (
            <motion.div
              key={conversation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`card cursor-pointer transition-all hover:shadow-lg ${
                currentConversation?.id === conversation.id 
                  ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                  : ''
              }`}
              onClick={() => setCurrentConversation(conversation.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Title and Date */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {conversation.title}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {format(new Date(conversation.updatedAt), 'MMM d, HH:mm')}
                    </span>
                  </div>

                  {/* Preview */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                    {conversation.messages[0]?.content || 'No messages yet'}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <MessageCircle size={14} className="mr-1" />
                        {conversation.messages.length} messages
                      </span>
                      
                      {conversation.emotionalSummary && (
                        <>
                          <span className="flex items-center">
                            <span className="mr-1">
                              {getEmotionEmoji(conversation.emotionalSummary.dominantEmotion)}
                            </span>
                            {conversation.emotionalSummary.dominantEmotion}
                          </span>
                          
                          <span className={`flex items-center ${getSentimentColor(conversation.emotionalSummary.averageSentiment)}`}>
                            <span className="mr-1">📊</span>
                            {conversation.emotionalSummary.averageSentiment > 0 ? '+' : ''}
                            {conversation.emotionalSummary.averageSentiment.toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExport(conversation.id)
                        }}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Export conversation"
                      >
                        <Download size={16} />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('Are you sure you want to delete this conversation?')) {
                            deleteConversation(conversation.id)
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete conversation"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emotional Summary Bar */}
              {conversation.emotionalSummary && (
                <div className={`mt-3 p-2 rounded-lg ${getSentimentBg(conversation.emotionalSummary.averageSentiment)}`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">Emotional Journey</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {Object.keys(conversation.emotionalSummary.emotionDistribution).length} emotions detected
                    </span>
                  </div>
                  
                  {/* Emotion Distribution */}
                  <div className="flex mt-2 space-x-1">
                    {Object.entries(conversation.emotionalSummary.emotionDistribution)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([emotion, count]) => (
                        <div
                          key={emotion}
                          className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden"
                          title={`${emotion}: ${count}`}
                        >
                          <div
                            className="h-full bg-gradient-to-r from-primary-400 to-secondary-400"
                            style={{ 
                              width: `${(count / Math.max(...Object.values(conversation.emotionalSummary.emotionDistribution))) * 100}%` 
                            }}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredConversations.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No conversations found' : 'No conversations yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm 
                ? 'Try adjusting your search or filters' 
                : 'Start a conversation to see your history here'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}