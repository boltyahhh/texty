import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponsiveDesign } from './hooks/useResponsiveDesign';
import { useHapticFeedback } from './hooks/useHapticFeedback';
import { useGestureControls } from './hooks/useGestureControls';
import ResponsiveLayout from './components/ResponsiveLayout';
import ChatInterface from './components/ChatInterface';
import PersonalitySelector from './components/PersonalitySelector';
import VoiceSettings from './components/VoiceSettings';
import AdvancedEmotionDashboard from './components/AdvancedEmotionDashboard';
import SmartWellnessSystem from './components/SmartWellnessSystem';
import ConversationHistory from './components/ConversationHistory';
import ApiStatus from './components/ApiStatus';
import { conversationManager } from './services/conversationManager';
import { AIPersonality, VoiceSettings as VoiceSettingsType, Message, Conversation, UserPreferences } from './types';

const AI_PERSONALITIES: AIPersonality[] = [
  {
    id: 'supportive',
    name: 'Supportive Friend',
    description: 'Warm, empathetic, and encouraging',
    systemPrompt: 'You are a supportive and empathetic friend...',
    icon: '🤗',
    color: 'bg-pink-500'
  },
  {
    id: 'professional',
    name: 'Life Coach',
    description: 'Goal-oriented and insightful',
    systemPrompt: 'You are a professional life coach...',
    icon: '💼',
    color: 'bg-blue-500'
  },
  {
    id: 'casual',
    name: 'Casual Buddy',
    description: 'Relaxed, fun, and relatable',
    systemPrompt: 'You are a casual, friendly buddy...',
    icon: '😎',
    color: 'bg-green-500'
  },
  {
    id: 'therapist',
    name: 'Therapeutic Listener',
    description: 'Patient, insightful, and non-judgmental',
    systemPrompt: 'You are a compassionate therapeutic listener...',
    icon: '🧠',
    color: 'bg-purple-500'
  }
];

const DEFAULT_VOICE_SETTINGS: VoiceSettingsType = {
  enabled: true,
  voice: '',
  rate: 1.0,
  pitch: 1.0,
  volume: 0.8
};

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  aiPersonality: 'supportive',
  voiceSettings: DEFAULT_VOICE_SETTINGS,
  showEmotionCharts: true,
  autoSpeak: false,
  language: 'auto'
};

function App() {
  const { deviceInfo, config, isCompact, isMobile, isTablet } = useResponsiveDesign();
  const { triggerHaptic } = useHapticFeedback();
  
  const [currentView, setCurrentView] = useState<'chat' | 'dashboard' | 'wellness' | 'history' | 'settings'>('chat');
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<string>();
  const [currentSentiment, setCurrentSentiment] = useState<number>();
  const [emotionHistory, setEmotionHistory] = useState<Array<{ emotion: string; timestamp: Date; intensity: number }>>([]);

  // Gesture controls for navigation
  const { gestureProps } = useGestureControls({
    onSwipeLeft: () => {
      if (isMobile) {
        const views = ['chat', 'dashboard', 'wellness', 'history', 'settings'];
        const currentIndex = views.indexOf(currentView);
        const nextIndex = (currentIndex + 1) % views.length;
        setCurrentView(views[nextIndex] as any);
        triggerHaptic('light');
      }
    },
    onSwipeRight: () => {
      if (isMobile) {
        const views = ['chat', 'dashboard', 'wellness', 'history', 'settings'];
        const currentIndex = views.indexOf(currentView);
        const prevIndex = currentIndex === 0 ? views.length - 1 : currentIndex - 1;
        setCurrentView(views[prevIndex] as any);
        triggerHaptic('light');
      }
    }
  });

  useEffect(() => {
    // Load preferences from localStorage
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    }

    // Load emotion history
    const savedEmotionHistory = localStorage.getItem('emotionHistory');
    if (savedEmotionHistory) {
      try {
        const parsed = JSON.parse(savedEmotionHistory).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setEmotionHistory(parsed);
      } catch (error) {
        console.error('Error loading emotion history:', error);
      }
    }

    // Load conversations
    loadConversations();

    // Create initial conversation if none exists
    const existing = conversationManager.getCurrentConversation();
    if (!existing) {
      const newConversation = conversationManager.createConversation();
      setCurrentConversation(newConversation);
    } else {
      setCurrentConversation(existing);
    }

    // Apply emotion-based theming
    if (currentEmotion) {
      document.documentElement.className = `emotion-${currentEmotion}`;
    }
  }, [currentEmotion]);

  const loadConversations = () => {
    const allConversations = conversationManager.getConversations();
    setConversations(allConversations);
  };

  const savePreferences = (newPreferences: UserPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('userPreferences', JSON.stringify(newPreferences));
  };

  const saveEmotionHistory = (history: Array<{ emotion: string; timestamp: Date; intensity: number }>) => {
    setEmotionHistory(history);
    localStorage.setItem('emotionHistory', JSON.stringify(history));
  };

  const handleNewMessage = (message: Message) => {
    if (message.processingResult?.emotions) {
      const emotion = message.processingResult.emotions.primary_emotion;
      setCurrentEmotion(emotion);
      
      // Add to emotion history
      const newEntry = {
        emotion,
        timestamp: new Date(),
        intensity: message.processingResult.emotions.confidence
      };
      
      const updatedHistory = [...emotionHistory, newEntry].slice(-100); // Keep last 100 entries
      saveEmotionHistory(updatedHistory);
    }
    
    if (message.processingResult?.sentiment_confidence) {
      const sentimentValue = message.processingResult.sentiment === 'positive' ? 1 : 
                            message.processingResult.sentiment === 'negative' ? -1 : 0;
      setCurrentSentiment(sentimentValue * message.processingResult.sentiment_confidence);
    }
    
    loadConversations();
    triggerHaptic('light');
  };

  const handleConversationSelect = (conversation: Conversation) => {
    conversationManager.setCurrentConversation(conversation.id);
    setCurrentConversation(conversation);
    setCurrentView('chat');
    triggerHaptic('medium');
  };

  const handleConversationDelete = (conversationId: string) => {
    conversationManager.deleteConversation(conversationId);
    loadConversations();
    
    if (currentConversation?.id === conversationId) {
      const newConversation = conversationManager.createConversation();
      setCurrentConversation(newConversation);
    }
    triggerHaptic('heavy');
  };

  const handleNewConversation = () => {
    const newConversation = conversationManager.createConversation();
    setCurrentConversation(newConversation);
    loadConversations();
    setCurrentView('chat');
    triggerHaptic('medium');
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view as any);
    triggerHaptic('light');
  };

  const selectedPersonality = AI_PERSONALITIES.find(p => p.id === preferences.aiPersonality) || AI_PERSONALITIES[0];
  const emotionalInsights = conversationManager.getEmotionalInsights(7);

  return (
    <div 
      className={`min-h-screen transition-colors duration-500 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 ${
        currentEmotion ? `emotion-${currentEmotion}` : ''
      }`}
      {...gestureProps}
    >
      <ResponsiveLayout
        currentView={currentView}
        onViewChange={handleViewChange}
        onNewConversation={handleNewConversation}
      >
        {/* API Status Indicator */}
        <div className="fixed top-4 right-4 z-50">
          <ApiStatus />
        </div>

        <AnimatePresence mode="wait">
          {currentView === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <ChatInterface
                personality={selectedPersonality}
                autoSpeak={preferences.autoSpeak}
                voiceSettings={preferences.voiceSettings}
                onNewMessage={handleNewMessage}
              />
            </motion.div>
          )}

          {currentView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <AdvancedEmotionDashboard
                insights={emotionalInsights}
                currentEmotion={currentEmotion}
                currentSentiment={currentSentiment}
                emotionHistory={emotionHistory}
              />
            </motion.div>
          )}

          {currentView === 'wellness' && (
            <motion.div
              key="wellness"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SmartWellnessSystem
                currentEmotion={currentEmotion}
                sentimentScore={currentSentiment}
                emotionHistory={emotionHistory}
              />
            </motion.div>
          )}

          {currentView === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ConversationHistory
                conversations={conversations}
                currentConversationId={currentConversation?.id}
                onConversationSelect={handleConversationSelect}
                onConversationDelete={handleConversationDelete}
              />
            </motion.div>
          )}

          {currentView === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h2>
              
              <div className={`grid gap-8 ${
                config.emotionDisplayStyle === 'dashboard' 
                  ? 'grid-cols-1 lg:grid-cols-2' 
                  : 'grid-cols-1'
              }`}>
                <div className="glass-effect rounded-lg p-6">
                  <PersonalitySelector
                    personalities={AI_PERSONALITIES}
                    selectedPersonality={selectedPersonality}
                    onPersonalityChange={(personality) => 
                      savePreferences({ ...preferences, aiPersonality: personality.id })
                    }
                  />
                </div>
                
                <div className="glass-effect rounded-lg p-6">
                  <VoiceSettings
                    settings={preferences.voiceSettings}
                    onSettingsChange={(voiceSettings) =>
                      savePreferences({ ...preferences, voiceSettings })
                    }
                  />
                </div>
              </div>

              <div className="glass-effect rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">General Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Auto-speak AI responses
                    </label>
                    <button
                      onClick={() => {
                        savePreferences({ ...preferences, autoSpeak: !preferences.autoSpeak });
                        triggerHaptic('light');
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        preferences.autoSpeak ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          preferences.autoSpeak ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Show emotion charts
                    </label>
                    <button
                      onClick={() => {
                        savePreferences({ ...preferences, showEmotionCharts: !preferences.showEmotionCharts });
                        triggerHaptic('light');
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        preferences.showEmotionCharts ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          preferences.showEmotionCharts ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* API Configuration */}
              <div className="glass-effect rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">API Configuration</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Current API URL:</span>
                    <div className="mt-1 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg font-mono text-sm">
                      {import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {(import.meta.env.VITE_API_URL || '').includes('localhost') || 
                     (import.meta.env.VITE_API_URL || '').includes('127.0.0.1') ? 
                     '🏠 Using local development server' : 
                     '☁️ Using AWS Lambda production server'}
                  </div>
                </div>
              </div>

              {/* Device Information */}
              <div className="glass-effect rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Device Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Device Type:</span>
                    <span className="ml-2 font-medium text-gray-800 dark:text-white capitalize">
                      {deviceInfo.type}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Screen Size:</span>
                    <span className="ml-2 font-medium text-gray-800 dark:text-white">
                      {deviceInfo.viewportWidth}×{deviceInfo.viewportHeight}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Touch Capable:</span>
                    <span className="ml-2 font-medium text-gray-800 dark:text-white">
                      {deviceInfo.touchCapable ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Foldable:</span>
                    <span className="ml-2 font-medium text-gray-800 dark:text-white">
                      {deviceInfo.isFoldable ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </ResponsiveLayout>
    </div>
  );
}

export default App;