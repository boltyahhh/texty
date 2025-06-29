import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, User, Volume2, Palette, Globe, Bell, Shield, Download, RotateCcw, Trash2 } from 'lucide-react'
import { useSettingsStore, AI_PERSONALITIES } from '../store/settingsStore'
import { getAvailableVoices } from '../services/ttsService'

export default function SettingsPanel() {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [activeSection, setActiveSection] = useState<'personality' | 'voice' | 'appearance' | 'privacy'>('personality')
  
  const {
    theme,
    aiPersonality,
    voiceSettings,
    autoSpeak,
    showEmotionCharts,
    language,
    notifications,
    soundEffects,
    hapticFeedback,
    updateTheme,
    updateAIPersonality,
    updateVoiceSettings,
    updateAutoSpeak,
    updateShowEmotionCharts,
    updateLanguage,
    updateNotifications,
    updateSoundEffects,
    updateHapticFeedback,
    resetSettings
  } = useSettingsStore()

  useEffect(() => {
    const loadVoices = () => {
      const voices = getAvailableVoices()
      setAvailableVoices(voices)
    }

    loadVoices()
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  const sections = [
    { id: 'personality', label: 'AI Personality', icon: User },
    { id: 'voice', label: 'Voice & Audio', icon: Volume2 },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy & Data', icon: Shield },
  ]

  const selectedPersonality = AI_PERSONALITIES.find(p => p.id === aiPersonality) || AI_PERSONALITIES[0]

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 safe-area-top">
        <div className="flex items-center">
          <Settings className="w-6 h-6 text-primary-500 mr-2" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="desktop-only w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <nav className="p-4 space-y-2">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${
                    activeSection === section.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon size={20} className="mr-3" />
                  <span className="font-medium">{section.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Mobile Section Selector */}
        <div className="mobile-only bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex overflow-x-auto p-2">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`flex flex-col items-center px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                    activeSection === section.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs mt-1">{section.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {activeSection === 'personality' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  AI Personality
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Choose how your AI assistant responds and interacts with you.
                </p>
                
                <div className="grid gap-4">
                  {AI_PERSONALITIES.map((personality) => (
                    <button
                      key={personality.id}
                      onClick={() => updateAIPersonality(personality.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        aiPersonality === personality.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        <div className={`w-10 h-10 rounded-full ${personality.color} flex items-center justify-center text-white text-lg mr-3`}>
                          {personality.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {personality.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {personality.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Current Personality: {selectedPersonality.name}
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {selectedPersonality.description}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'voice' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Text-to-Speech Settings
                </h3>
                
                <div className="space-y-6">
                  {/* Enable TTS */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900 dark:text-white">
                        Enable Text-to-Speech
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        AI will speak responses aloud
                      </p>
                    </div>
                    <button
                      onClick={() => updateVoiceSettings({ enabled: !voiceSettings.enabled })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        voiceSettings.enabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          voiceSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Auto Speak */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900 dark:text-white">
                        Auto-speak AI responses
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Automatically speak new AI messages
                      </p>
                    </div>
                    <button
                      onClick={() => updateAutoSpeak(!autoSpeak)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        autoSpeak ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          autoSpeak ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Voice Selection */}
                  <div>
                    <label className="block font-medium text-gray-900 dark:text-white mb-2">
                      Voice
                    </label>
                    <select
                      value={voiceSettings.voice}
                      onChange={(e) => updateVoiceSettings({ voice: e.target.value })}
                      className="input-field"
                      disabled={!voiceSettings.enabled}
                    >
                      <option value="">Default Voice</option>
                      {availableVoices.map((voice) => (
                        <option key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Voice Controls */}
                  <div className="space-y-4">
                    <div>
                      <label className="block font-medium text-gray-900 dark:text-white mb-2">
                        Speech Rate: {voiceSettings.rate.toFixed(1)}x
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={voiceSettings.rate}
                        onChange={(e) => updateVoiceSettings({ rate: parseFloat(e.target.value) })}
                        className="w-full"
                        disabled={!voiceSettings.enabled}
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-gray-900 dark:text-white mb-2">
                        Pitch: {voiceSettings.pitch.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={voiceSettings.pitch}
                        onChange={(e) => updateVoiceSettings({ pitch: parseFloat(e.target.value) })}
                        className="w-full"
                        disabled={!voiceSettings.enabled}
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-gray-900 dark:text-white mb-2">
                        Volume: {Math.round(voiceSettings.volume * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={voiceSettings.volume}
                        onChange={(e) => updateVoiceSettings({ volume: parseFloat(e.target.value) })}
                        className="w-full"
                        disabled={!voiceSettings.enabled}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Audio Preferences
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900 dark:text-white">
                        Sound Effects
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Play sounds for interactions
                      </p>
                    </div>
                    <button
                      onClick={() => updateSoundEffects(!soundEffects)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        soundEffects ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          soundEffects ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900 dark:text-white">
                        Haptic Feedback
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Vibration feedback on mobile
                      </p>
                    </div>
                    <button
                      onClick={() => updateHapticFeedback(!hapticFeedback)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        hapticFeedback ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          hapticFeedback ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'appearance' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Theme
                </h3>
                
                <div className="grid grid-cols-3 gap-3">
                  {(['light', 'dark', 'system'] as const).map((themeOption) => (
                    <button
                      key={themeOption}
                      onClick={() => updateTheme(themeOption)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        theme === themeOption
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gradient-to-r from-primary-400 to-secondary-400" />
                        <span className="text-sm font-medium capitalize text-gray-900 dark:text-white">
                          {themeOption}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Display Options
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900 dark:text-white">
                        Show Emotion Charts
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Display detailed emotion visualizations
                      </p>
                    </div>
                    <button
                      onClick={() => updateShowEmotionCharts(!showEmotionCharts)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        showEmotionCharts ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showEmotionCharts ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900 dark:text-white">
                        Notifications
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Show system notifications
                      </p>
                    </div>
                    <button
                      onClick={() => updateNotifications(!notifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifications ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'privacy' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Data & Privacy
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Local Storage
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Your conversations and settings are stored locally on your device. 
                      No data is sent to external servers except for AI processing.
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                      Audio Processing
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Audio files are processed by your local backend and are not stored permanently.
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                      AI Responses
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      AI responses are generated using OpenAI's API. Conversation context may be sent for processing.
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Data Management
                </h3>
                
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      // Export all data
                      const data = {
                        conversations: JSON.parse(localStorage.getItem('voiceinsight-conversations') || '{}'),
                        settings: JSON.parse(localStorage.getItem('voiceinsight-settings') || '{}'),
                        exportDate: new Date().toISOString()
                      }
                      
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `voiceinsight-data-${new Date().toISOString().split('T')[0]}.json`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    }}
                    className="w-full flex items-center justify-center px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    <Download size={20} className="mr-2" />
                    Export All Data
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to reset all settings? This cannot be undone.')) {
                        resetSettings()
                      }
                    }}
                    className="w-full flex items-center justify-center px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                  >
                    <RotateCcw size={20} className="mr-2" />
                    Reset Settings
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to clear all data? This will delete all conversations and settings and cannot be undone.')) {
                        localStorage.clear()
                        window.location.reload()
                      }
                    }}
                    className="w-full flex items-center justify-center px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    <Trash2 size={20} className="mr-2" />
                    Clear All Data
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}