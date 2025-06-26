import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface VoiceSettings {
  enabled: boolean
  voice: string
  rate: number
  pitch: number
  volume: number
}

export interface AIPersonality {
  id: string
  name: string
  description: string
  systemPrompt: string
  icon: string
  color: string
}

interface SettingsState {
  theme: 'light' | 'dark' | 'system'
  aiPersonality: string
  voiceSettings: VoiceSettings
  autoSpeak: boolean
  showEmotionCharts: boolean
  language: string
  notifications: boolean
  soundEffects: boolean
  hapticFeedback: boolean
  isLoading: boolean
}

interface SettingsActions {
  loadSettings: () => Promise<void>
  updateTheme: (theme: 'light' | 'dark' | 'system') => void
  updateAIPersonality: (personality: string) => void
  updateVoiceSettings: (settings: Partial<VoiceSettings>) => void
  updateAutoSpeak: (enabled: boolean) => void
  updateShowEmotionCharts: (show: boolean) => void
  updateLanguage: (language: string) => void
  updateNotifications: (enabled: boolean) => void
  updateSoundEffects: (enabled: boolean) => void
  updateHapticFeedback: (enabled: boolean) => void
  resetSettings: () => void
}

type SettingsStore = SettingsState & SettingsActions

const defaultVoiceSettings: VoiceSettings = {
  enabled: true,
  voice: '',
  rate: 1.0,
  pitch: 1.0,
  volume: 0.8,
}

const defaultSettings: SettingsState = {
  theme: 'system',
  aiPersonality: 'supportive',
  voiceSettings: defaultVoiceSettings,
  autoSpeak: false,
  showEmotionCharts: true,
  language: 'auto',
  notifications: true,
  soundEffects: true,
  hapticFeedback: true,
  isLoading: false,
}

export const AI_PERSONALITIES: AIPersonality[] = [
  {
    id: 'supportive',
    name: 'Supportive Friend',
    description: 'Warm, empathetic, and encouraging',
    systemPrompt: 'You are a supportive and empathetic friend. You listen carefully, validate emotions, and offer gentle encouragement. You\'re warm, understanding, and always look for the positive while acknowledging difficulties. Use a caring, conversational tone.',
    icon: '🤗',
    color: 'bg-pink-500'
  },
  {
    id: 'professional',
    name: 'Life Coach',
    description: 'Goal-oriented and insightful',
    systemPrompt: 'You are a professional life coach. You\'re insightful, goal-oriented, and help people find practical solutions. You ask thoughtful questions, provide structured advice, and help users develop actionable plans. Maintain a professional yet approachable tone.',
    icon: '💼',
    color: 'bg-blue-500'
  },
  {
    id: 'casual',
    name: 'Casual Buddy',
    description: 'Relaxed, fun, and relatable',
    systemPrompt: 'You are a casual, friendly buddy. You\'re relaxed, use everyday language, and keep things light and fun. You\'re supportive but not overly serious, and you know when to inject humor appropriately. Be conversational and relatable.',
    icon: '😎',
    color: 'bg-green-500'
  },
  {
    id: 'therapist',
    name: 'Therapeutic Listener',
    description: 'Patient, insightful, and non-judgmental',
    systemPrompt: 'You are a compassionate therapeutic listener. You practice active listening, ask open-ended questions, and help people explore their feelings without judgment. You\'re patient, insightful, and skilled at helping people understand their emotions. Use therapeutic communication techniques.',
    icon: '🧠',
    color: 'bg-purple-500'
  }
]

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...defaultSettings,

      loadSettings: async () => {
        set({ isLoading: true })
        try {
          // Load available voices for TTS
          const voices = speechSynthesis.getVoices()
          if (voices.length > 0 && !get().voiceSettings.voice) {
            const defaultVoice = voices.find(voice => voice.default) || voices[0]
            set(state => ({
              voiceSettings: {
                ...state.voiceSettings,
                voice: defaultVoice.name
              }
            }))
          }

          // Apply theme
          const { theme } = get()
          applyTheme(theme)
        } catch (error) {
          console.error('Failed to load settings:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      updateTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },

      updateAIPersonality: (personality) => {
        set({ aiPersonality: personality })
      },

      updateVoiceSettings: (settings) => {
        set(state => ({
          voiceSettings: { ...state.voiceSettings, ...settings }
        }))
      },

      updateAutoSpeak: (enabled) => {
        set({ autoSpeak: enabled })
      },

      updateShowEmotionCharts: (show) => {
        set({ showEmotionCharts: show })
      },

      updateLanguage: (language) => {
        set({ language })
      },

      updateNotifications: (enabled) => {
        set({ notifications: enabled })
        if (enabled) {
          requestNotificationPermission()
        }
      },

      updateSoundEffects: (enabled) => {
        set({ soundEffects: enabled })
      },

      updateHapticFeedback: (enabled) => {
        set({ hapticFeedback: enabled })
      },

      resetSettings: () => {
        set(defaultSettings)
        applyTheme('system')
      },
    }),
    {
      name: 'voiceinsight-settings',
      version: 1,
    }
  )
)

function applyTheme(theme: 'light' | 'dark' | 'system') {
  const root = window.document.documentElement
  
  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    root.classList.remove('light', 'dark')
    root.classList.add(systemTheme)
  } else {
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }
}

async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission()
  }
}