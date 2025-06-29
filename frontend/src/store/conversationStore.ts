import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  audioUrl?: string
  emotions?: {
    primary: string
    confidence: number
    scores: Record<string, number>
  }
  sentiment?: {
    label: string
    confidence: number
    scores: Record<string, number>
  }
  isTyping?: boolean
  reactions?: string[]
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  emotionalSummary?: {
    dominantEmotion: string
    averageSentiment: number
    emotionDistribution: Record<string, number>
  }
}

interface ConversationState {
  conversations: Conversation[]
  currentConversationId: string | null
  isLoading: boolean
  error: string | null
}

interface ConversationActions {
  initializeStore: () => Promise<void>
  createConversation: (title?: string) => string
  setCurrentConversation: (id: string) => void
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Message
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  deleteConversation: (id: string) => void
  exportConversation: (id: string) => string
  getCurrentConversation: () => Conversation | null
  getEmotionalInsights: (days?: number) => Array<{
    date: string
    dominantEmotion: string
    sentimentScore: number
    conversationCount: number
    emotionBreakdown: Record<string, number>
  }>
  addReaction: (messageId: string, reaction: string) => void
  removeReaction: (messageId: string, reaction: string) => void
}

type ConversationStore = ConversationState & ConversationActions

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,
      isLoading: false,
      error: null,

      initializeStore: async () => {
        set({ isLoading: true, error: null })
        try {
          // Initialize with a default conversation if none exists
          const { conversations } = get()
          if (conversations.length === 0) {
            const conversationId = get().createConversation('Welcome Chat')
            set({ currentConversationId: conversationId })
          }
        } catch (error) {
          set({ error: 'Failed to initialize conversations' })
        } finally {
          set({ isLoading: false })
        }
      },

      createConversation: (title) => {
        const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const conversation: Conversation = {
          id,
          title: title || `Chat ${new Date().toLocaleDateString()}`,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        set(state => ({
          conversations: [conversation, ...state.conversations],
          currentConversationId: id,
        }))

        return id
      },

      setCurrentConversation: (id) => {
        set({ currentConversationId: id })
      },

      addMessage: (messageData) => {
        const message: Message = {
          ...messageData,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        }

        set(state => {
          const conversations = state.conversations.map(conv => {
            if (conv.id === state.currentConversationId) {
              const updatedConv = {
                ...conv,
                messages: [...conv.messages, message],
                updatedAt: new Date(),
              }

              // Update title based on first user message
              if (conv.messages.length === 0 && message.type === 'user') {
                updatedConv.title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
              }

              // Update emotional summary
              updatedConv.emotionalSummary = calculateEmotionalSummary(updatedConv.messages)

              return updatedConv
            }
            return conv
          })

          return { conversations }
        })

        return message
      },

      updateMessage: (messageId, updates) => {
        set(state => ({
          conversations: state.conversations.map(conv => ({
            ...conv,
            messages: conv.messages.map(msg =>
              msg.id === messageId ? { ...msg, ...updates } : msg
            ),
            updatedAt: new Date(),
          }))
        }))
      },

      deleteConversation: (id) => {
        set(state => {
          const conversations = state.conversations.filter(conv => conv.id !== id)
          const currentConversationId = state.currentConversationId === id 
            ? (conversations[0]?.id || null) 
            : state.currentConversationId

          return { conversations, currentConversationId }
        })
      },

      exportConversation: (id) => {
        const conversation = get().conversations.find(conv => conv.id === id)
        if (!conversation) return ''

        const exportData = {
          title: conversation.title,
          createdAt: conversation.createdAt,
          messages: conversation.messages.map(msg => ({
            type: msg.type,
            content: msg.content,
            timestamp: msg.timestamp,
            emotions: msg.emotions,
            sentiment: msg.sentiment,
          })),
          emotionalSummary: conversation.emotionalSummary,
        }

        return JSON.stringify(exportData, null, 2)
      },

      getCurrentConversation: () => {
        const { conversations, currentConversationId } = get()
        return conversations.find(conv => conv.id === currentConversationId) || null
      },

      getEmotionalInsights: (days = 7) => {
        const { conversations } = get()
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - days)

        const insights: Record<string, any> = {}

        conversations
          .filter(conv => conv.updatedAt >= cutoffDate)
          .forEach(conversation => {
            const dateKey = conversation.updatedAt.toDateString()
            
            if (!insights[dateKey]) {
              insights[dateKey] = {
                date: dateKey,
                dominantEmotion: '',
                sentimentScore: 0,
                conversationCount: 0,
                emotionBreakdown: {}
              }
            }

            insights[dateKey].conversationCount++
            
            if (conversation.emotionalSummary) {
              const summary = conversation.emotionalSummary
              insights[dateKey].sentimentScore += summary.averageSentiment
              
              Object.entries(summary.emotionDistribution).forEach(([emotion, count]) => {
                insights[dateKey].emotionBreakdown[emotion] = 
                  (insights[dateKey].emotionBreakdown[emotion] || 0) + count
              })
            }
          })

        // Calculate averages and dominant emotions
        Object.values(insights).forEach((insight: any) => {
          if (insight.conversationCount > 0) {
            insight.sentimentScore /= insight.conversationCount
            
            const dominantEmotion = Object.entries(insight.emotionBreakdown)
              .sort(([,a], [,b]) => (b as number) - (a as number))[0]
            
            if (dominantEmotion) {
              insight.dominantEmotion = dominantEmotion[0]
            }
          }
        })

        return Object.values(insights).sort((a: any, b: any) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )
      },

      addReaction: (messageId, reaction) => {
        set(state => ({
          conversations: state.conversations.map(conv => ({
            ...conv,
            messages: conv.messages.map(msg =>
              msg.id === messageId 
                ? { ...msg, reactions: [...(msg.reactions || []), reaction] }
                : msg
            ),
          }))
        }))
      },

      removeReaction: (messageId, reaction) => {
        set(state => ({
          conversations: state.conversations.map(conv => ({
            ...conv,
            messages: conv.messages.map(msg =>
              msg.id === messageId 
                ? { ...msg, reactions: (msg.reactions || []).filter(r => r !== reaction) }
                : msg
            ),
          }))
        }))
      },
    }),
    {
      name: 'voiceinsight-conversations',
      version: 1,
    }
  )
)

function calculateEmotionalSummary(messages: Message[]) {
  const emotionCounts: Record<string, number> = {}
  let totalSentiment = 0
  let sentimentCount = 0

  messages.forEach(message => {
    if (message.emotions?.primary) {
      const emotion = message.emotions.primary
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1
    }
    
    if (message.sentiment?.confidence) {
      const sentimentValue = message.sentiment.label === 'positive' ? 1 : 
                            message.sentiment.label === 'negative' ? -1 : 0
      totalSentiment += sentimentValue * message.sentiment.confidence
      sentimentCount++
    }
  })

  if (Object.keys(emotionCounts).length === 0) return undefined

  const dominantEmotion = Object.entries(emotionCounts)
    .sort(([,a], [,b]) => b - a)[0][0]

  return {
    dominantEmotion,
    averageSentiment: sentimentCount > 0 ? totalSentiment / sentimentCount : 0,
    emotionDistribution: emotionCounts
  }
}