import { VoiceSettings } from '@/store/settingsStore'

let currentUtterance: SpeechSynthesisUtterance | null = null

export const speakText = async (
  text: string, 
  settings: VoiceSettings, 
  emotion?: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!text.trim() || !settings.enabled) {
      resolve()
      return
    }

    // Stop any current speech
    stopSpeaking()

    const utterance = new SpeechSynthesisUtterance(text)
    
    // Apply settings
    if (settings.voice) {
      const voices = speechSynthesis.getVoices()
      const voice = voices.find(v => v.name === settings.voice)
      if (voice) utterance.voice = voice
    }
    
    utterance.rate = settings.rate
    utterance.pitch = settings.pitch
    utterance.volume = settings.volume

    // Adjust for emotion
    if (emotion) {
      const emotionalSettings = getEmotionalSettings(emotion)
      utterance.rate *= emotionalSettings.rateMultiplier || 1
      utterance.pitch *= emotionalSettings.pitchMultiplier || 1
    }

    // Set up event handlers
    utterance.onend = () => {
      currentUtterance = null
      resolve()
    }
    
    utterance.onerror = (event) => {
      currentUtterance = null
      reject(new Error(`Speech synthesis error: ${event.error}`))
    }

    currentUtterance = utterance
    speechSynthesis.speak(utterance)
  })
}

export const stopSpeaking = () => {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel()
  }
  currentUtterance = null
}

export const isSpeaking = (): boolean => {
  return speechSynthesis.speaking
}

export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  return speechSynthesis.getVoices()
}

export const getEmotionalSettings = (emotion: string) => {
  const emotionSettings: { [key: string]: { rateMultiplier?: number; pitchMultiplier?: number } } = {
    happy: { rateMultiplier: 1.1, pitchMultiplier: 1.2 },
    sad: { rateMultiplier: 0.8, pitchMultiplier: 0.8 },
    angry: { rateMultiplier: 1.2, pitchMultiplier: 0.9 },
    anxious: { rateMultiplier: 0.9, pitchMultiplier: 1.1 },
    fear: { rateMultiplier: 0.9, pitchMultiplier: 1.3 },
    love: { rateMultiplier: 0.9, pitchMultiplier: 1.1 },
    pride: { rateMultiplier: 1.0, pitchMultiplier: 0.9 },
    relief: { rateMultiplier: 0.9, pitchMultiplier: 1.0 },
    hope: { rateMultiplier: 1.0, pitchMultiplier: 1.1 }
  }

  return emotionSettings[emotion] || { rateMultiplier: 1.0, pitchMultiplier: 1.0 }
}

// Initialize voices when they become available
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = () => {
    console.log('Voices loaded:', getAvailableVoices().length)
  }
}