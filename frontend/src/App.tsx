import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import PersonalitySelector from './components/PersonalitySelector';
import VoiceSettings from './components/VoiceSettings';
import EmotionDashboard from './components/EmotionDashboard';
import WellnessPanel from './components/WellnessPanel';
import ConversationHistory from './components/ConversationHistory';
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
  const [currentView, setCurrentView] = useState<'chat' | 'dashboard' | 'wellness' | 'history' | 'settings'>('chat');
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<string>();
  const [currentSentiment, setCurrentSentiment] = useState<number>();

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
  }, []);

  const loadConversations = () => {
    const allConversations = conversationManager.getConversations();
    setConversations(allConversations);
  };

  const savePreferences = (newPreferences: UserPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('userPreferences', JSON.stringify(newPreferences));
  };

  const handleNewMessage = (message: Message) => {
    if (message.processingResult?.emotions) {
      setCurrentEmotion(message.processingResult.emotions.primary_emotion);
    }
    if (message.processingResult?.sentiment_confidence) {
      const sentimentValue = message.processingResult.sentiment === 'positive' ? 1 : 
                            message.processingResult.sentiment === 'negative' ? -1 : 0;
      setCurrentSentiment(sentimentValue * message.processingResult.sentiment_confidence);
    }
    loadConversations();
  };

  const handleConversationSelect = (conversation: Conversation) => {
    conversationManager.setCurrentConversation(conversation.id);
    setCurrentConversation(conversation);
    setCurrentView('chat');
  };

  const handleConversationDelete = (conversationId: string) => {
    conversationManager.deleteConversation(conversationId);
    loadConversations();
    
    if (currentConversation?.id === conversationId) {
      const newConversation = conversationManager.createConversation();
      setCurrentConversation(newConversation);
    }
  };

  const handleNewConversation = () => {
    const newConversation = conversationManager.createConversation();
    setCurrentConversation(newConversation);
    loadConversations();
    setCurrentView('chat');
  };

  const selectedPersonality = AI_PERSONALITIES.find(p => p.id === preferences.aiPersonality) || AI_PERSONALITIES[0];
  const emotionalInsights = conversationManager.getEmotionalInsights(7);

  const navigationItems = [
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'wellness', label: 'Wellness', icon: '🧘' },
    { id: 'history', label: 'History', icon: '📚' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-200">
      <Header />
      
      <div className="flex h-screen pt-16">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white/10 dark:bg-black/10 backdrop-blur-lg border-r border-white/20 dark:border-gray-800/50 p-4">
          <button
            onClick={handleNewConversation}
            className="w-full mb-6 px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            + New Conversation
          </button>
          
          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as any)}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  currentView === item.id
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                    : 'hover:bg-white/20 dark:hover:bg-black/20'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
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
                <EmotionDashboard
                  insights={emotionalInsights}
                  currentEmotion={currentEmotion}
                  currentSentiment={currentSentiment}
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
                <WellnessPanel
                  currentEmotion={currentEmotion}
                  sentimentScore={currentSentiment}
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
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white/10 dark:bg-black/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 dark:border-gray-800/50">
                    <PersonalitySelector
                      personalities={AI_PERSONALITIES}
                      selectedPersonality={selectedPersonality}
                      onPersonalityChange={(personality) => 
                        savePreferences({ ...preferences, aiPersonality: personality.id })
                      }
                    />
                  </div>
                  
                  <div className="bg-white/10 dark:bg-black/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 dark:border-gray-800/50">
                    <VoiceSettings
                      settings={preferences.voiceSettings}
                      onSettingsChange={(voiceSettings) =>
                        savePreferences({ ...preferences, voiceSettings })
                      }
                    />
                  </div>
                </div>

                <div className="bg-white/10 dark:bg-black/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 dark:border-gray-800/50">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">General Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Auto-speak AI responses
                      </label>
                      <button
                        onClick={() => savePreferences({ ...preferences, autoSpeak: !preferences.autoSpeak })}
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
                        onClick={() => savePreferences({ ...preferences, showEmotionCharts: !preferences.showEmotionCharts })}
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default App;