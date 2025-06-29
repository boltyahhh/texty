import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MessageCircle, Brain, Sparkles } from 'lucide-react'
import ChatInterface from './components/ChatInterface'
import EmotionDashboard from './components/EmotionDashboard'
import SettingsPanel from './components/SettingsPanel'
import ConversationHistory from './components/ConversationHistory'
import { useConversationStore } from './store/conversationStore'
import { useSettingsStore } from './store/settingsStore'

type View = 'chat' | 'emotions' | 'history' | 'settings'

export default function App() {
  const [currentView, setCurrentView] = useState<View>('chat')
  const [isLoading, setIsLoading] = useState(true)
  const { initializeStore } = useConversationStore()
  const { loadSettings } = useSettingsStore()

  useEffect(() => {
    const initialize = async () => {
      try {
        await Promise.all([
          initializeStore(),
          loadSettings()
        ])
      } catch (error) {
        console.error('Failed to initialize app:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [initializeStore, loadSettings])

  const navigationItems = [
    { id: 'chat', label: 'Chat', icon: MessageCircle, color: 'text-primary-500' },
    { id: 'emotions', label: 'Emotions', icon: Brain, color: 'text-purple-500' },
    { id: 'history', label: 'History', icon: Sparkles, color: 'text-blue-500' },
    { id: 'settings', label: 'Settings', icon: Mic, color: 'text-gray-500' },
  ]

  if (isLoading) {
    return (
      <div className="mobile-full-height flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center"
          >
            <Brain className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            VoiceInsight AI
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Initializing your emotional AI companion...
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="mobile-full-height flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Mobile Navigation - Top */}
        <nav className="mobile-only bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 safe-area-top">
          <div className="flex justify-around py-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as View)}
                  className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all touch-manipulation ${
                    currentView === item.id
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon 
                    size={20} 
                    className={currentView === item.id ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'} 
                  />
                  <span className={`text-xs mt-1 ${
                    currentView === item.id 
                      ? 'text-primary-500 font-medium' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* Desktop Sidebar */}
        <aside className="desktop-only w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center mr-3">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  VoiceInsight
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Emotional AI
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id as View)}
                    className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${
                      currentView === item.id
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={20} className="mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {currentView === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1"
              >
                <ChatInterface />
              </motion.div>
            )}

            {currentView === 'emotions' && (
              <motion.div
                key="emotions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1"
              >
                <EmotionDashboard />
              </motion.div>
            )}

            {currentView === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1"
              >
                <ConversationHistory />
              </motion.div>
            )}

            {currentView === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1"
              >
                <SettingsPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-only bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-bottom">
        <div className="flex justify-around py-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as View)}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all touch-manipulation ${
                  currentView === item.id
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon 
                  size={20} 
                  className={currentView === item.id ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'} 
                />
                <span className={`text-xs mt-1 ${
                  currentView === item.id 
                    ? 'text-primary-500 font-medium' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}