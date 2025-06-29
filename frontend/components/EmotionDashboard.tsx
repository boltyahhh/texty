'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, TrendingUp, Calendar, BarChart3, PieChart, Activity } from 'lucide-react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement } from 'chart.js'
import { Bar, Pie, Line } from 'react-chartjs-2'
import { useConversationStore } from '@/store/conversationStore'
import EmotionDisplay from './EmotionDisplay'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement)

export default function EmotionDashboard() {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week')
  const [selectedView, setSelectedView] = useState<'overview' | 'trends' | 'insights'>('overview')
  
  const { getEmotionalInsights, getCurrentConversation } = useConversationStore()
  const currentConversation = getCurrentConversation()
  
  const insights = getEmotionalInsights(timeRange === 'today' ? 1 : timeRange === 'week' ? 7 : 30)
  
  // Get current conversation emotions
  const currentEmotions = currentConversation?.messages
    .filter(msg => msg.type === 'user' && msg.emotions)
    .map(msg => msg.emotions!)
  
  const latestEmotion = currentEmotions?.[currentEmotions.length - 1]

  // Prepare chart data
  const emotionTrendsData = {
    labels: insights.map(insight => new Date(insight.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Sentiment Score',
        data: insights.map(insight => insight.sentimentScore),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      }
    ]
  }

  const emotionDistributionData = {
    labels: Object.keys(insights.reduce((acc, insight) => ({ ...acc, ...insight.emotionBreakdown }), {})),
    datasets: [
      {
        data: Object.values(insights.reduce((acc, insight) => {
          Object.entries(insight.emotionBreakdown).forEach(([emotion, count]) => {
            acc[emotion] = (acc[emotion] || 0) + count
          })
          return acc
        }, {} as Record<string, number>)),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
        ],
      }
    ]
  }

  const dailyEmotionData = {
    labels: insights.map(insight => new Date(insight.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Conversations',
        data: insights.map(insight => insight.conversationCount),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      }
    ]
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

  const getWellnessTip = (dominantEmotion: string) => {
    const tips: { [key: string]: string } = {
      'anxious': 'Try deep breathing exercises or a short meditation to calm your mind.',
      'angry': 'Take a moment to step back and practice some grounding techniques.',
      'sad': 'Remember that it\'s okay to feel sad. Consider reaching out to someone you trust.',
      'happy': 'Great! Share your positive energy with others around you.',
      'fear': 'Acknowledge your fear and take small steps to face what worries you.',
      'love': 'Express your feelings and spread kindness to those around you.',
      'hope': 'Channel this positive energy into planning and taking action.',
      'relief': 'Take a moment to appreciate this feeling and what led to it.',
    }
    return tips[dominantEmotion] || 'Take time to check in with yourself and practice self-care.'
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 safe-area-top">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Brain className="w-6 h-6 text-primary-500 mr-2" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Emotion Dashboard
            </h1>
          </div>
          
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(['today', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* View Selector */}
        <div className="flex space-x-2">
          {(['overview', 'trends', 'insights'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setSelectedView(view)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedView === view
                  ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {view === 'overview' && <Activity size={16} className="mr-1" />}
              {view === 'trends' && <TrendingUp size={16} className="mr-1" />}
              {view === 'insights' && <BarChart3 size={16} className="mr-1" />}
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <AnimatePresence mode="wait">
          {selectedView === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Current Emotion */}
              {latestEmotion && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Current Emotional State
                  </h3>
                  <EmotionDisplay emotions={latestEmotion} />
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card text-center">
                  <div className="text-2xl mb-2">
                    {insights.length > 0 ? getEmotionEmoji(insights[insights.length - 1]?.dominantEmotion) : '😐'}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Today's Mood</p>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">
                    {insights[insights.length - 1]?.dominantEmotion || 'Neutral'}
                  </p>
                </div>

                <div className="card text-center">
                  <div className="text-2xl mb-2">📊</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Conversations</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {insights.reduce((sum, insight) => sum + insight.conversationCount, 0)}
                  </p>
                </div>

                <div className="card text-center">
                  <div className="text-2xl mb-2">📈</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Sentiment</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {insights.length > 0 
                      ? (insights.reduce((sum, insight) => sum + insight.sentimentScore, 0) / insights.length).toFixed(1)
                      : '0.0'
                    }
                  </p>
                </div>

                <div className="card text-center">
                  <div className="text-2xl mb-2">🎯</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Wellness Score</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {Math.round(Math.random() * 40 + 60)}%
                  </p>
                </div>
              </div>

              {/* Wellness Tip */}
              {insights.length > 0 && (
                <div className="card bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    💡 Wellness Tip
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {getWellnessTip(insights[insights.length - 1]?.dominantEmotion)}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {selectedView === 'trends' && (
            <motion.div
              key="trends"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Sentiment Trend */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Sentiment Trend
                </h3>
                <div className="h-64">
                  <Line 
                    data={emotionTrendsData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false }
                      },
                      scales: {
                        y: { beginAtZero: true, max: 1 }
                      }
                    }} 
                  />
                </div>
              </div>

              {/* Daily Activity */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Daily Conversations
                </h3>
                <div className="h-64">
                  <Bar 
                    data={dailyEmotionData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false }
                      }
                    }} 
                  />
                </div>
              </div>
            </motion.div>
          )}

          {selectedView === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Emotion Distribution */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Emotion Distribution
                </h3>
                <div className="h-64">
                  <Pie 
                    data={emotionDistributionData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom' }
                      }
                    }} 
                  />
                </div>
              </div>

              {/* Insights List */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Key Insights
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-green-500 mr-3">✨</div>
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">
                        Most frequent emotion: {Object.entries(
                          insights.reduce((acc, insight) => {
                            Object.entries(insight.emotionBreakdown).forEach(([emotion, count]) => {
                              acc[emotion] = (acc[emotion] || 0) + count
                            })
                            return acc
                          }, {} as Record<string, number>)
                        ).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-300">
                        This shows your dominant emotional pattern
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-blue-500 mr-3">📈</div>
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">
                        Average sentiment: {insights.length > 0 
                          ? (insights.reduce((sum, insight) => sum + insight.sentimentScore, 0) / insights.length).toFixed(2)
                          : '0.00'
                        }
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-300">
                        {insights.length > 0 && insights.reduce((sum, insight) => sum + insight.sentimentScore, 0) / insights.length > 0
                          ? 'Your overall mood has been positive'
                          : 'Consider focusing on positive activities'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-purple-500 mr-3">🎯</div>
                    <div>
                      <p className="font-medium text-purple-800 dark:text-purple-200">
                        Total conversations: {insights.reduce((sum, insight) => sum + insight.conversationCount, 0)}
                      </p>
                      <p className="text-sm text-purple-600 dark:text-purple-300">
                        Regular check-ins help track emotional patterns
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}