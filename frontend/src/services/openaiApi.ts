import OpenAI from 'openai'
import { AI_PERSONALITIES } from '../store/settingsStore'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
})

export interface AIResponse {
  content: string
  reasoning?: string
}

export interface ConversationContext {
  transcript: string
  sentiment: any
  emotions: any
  conversationHistory: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  personality: string
}

export const generateAIResponse = async (context: ConversationContext): Promise<AIResponse> => {
  try {
    const { transcript, sentiment, emotions, conversationHistory, personality } = context
    
    const selectedPersonality = AI_PERSONALITIES.find(p => p.id === personality) || AI_PERSONALITIES[0]
    const systemPrompt = selectedPersonality.systemPrompt
    
    const emotionContext = emotions ? `
    Detected emotions: Primary emotion is "${emotions.primary}" with ${(emotions.confidence * 100).toFixed(1)}% confidence.
    Emotion scores: ${Object.entries(emotions.scores)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([emotion, score]) => `${emotion} (${((score as number) * 100).toFixed(1)}%)`)
      .join(', ')}
    ` : ''

    const sentimentContext = sentiment ? `
    Overall sentiment: ${sentiment.label} (${(sentiment.confidence * 100).toFixed(1)}% confidence)
    ` : ''

    const messages = [
      {
        role: 'system' as const,
        content: `${systemPrompt}

        You are responding to someone who just spoke to you. Here's the context:
        - What they said: "${transcript}"
        ${sentimentContext}
        ${emotionContext}
        
        Respond naturally and appropriately to their emotional state. Keep responses conversational and under 150 words unless they specifically ask for detailed advice. Show that you understand their emotional state through your response tone and content.
        
        Be empathetic, supportive, and engaging. Ask follow-up questions when appropriate to encourage deeper conversation.`
      },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      {
        role: 'user' as const,
        content: transcript
      }
    ]

    const completion = await openai.chat.completions.create({
      model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo',
      messages,
      max_tokens: 200,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    })

    const content = completion.choices[0]?.message?.content || "I'm here to listen. Could you tell me more about what's on your mind?"

    return {
      content: content.trim()
    }

  } catch (error) {
    console.error('Error generating AI response:', error)
    
    // Fallback responses based on sentiment
    const fallbackResponses = {
      positive: "That sounds wonderful! I'm glad to hear you're feeling good. Tell me more about what's making you happy.",
      negative: "I can hear that you're going through something difficult. I'm here to listen and support you. Would you like to talk about what's bothering you?",
      neutral: "I'm listening. What's on your mind today? Feel free to share whatever you'd like to talk about."
    }

    const sentimentLabel = context.sentiment?.label || 'neutral'
    return {
      content: fallbackResponses[sentimentLabel as keyof typeof fallbackResponses] || fallbackResponses.neutral
    }
  }
}

export const generateWellnessRecommendation = async (emotions: any): Promise<string> => {
  if (!emotions) return ''

  try {
    const completion = await openai.chat.completions.create({
      model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a wellness coach. Provide a brief, actionable wellness tip or recommendation based on the detected emotions. Keep it under 50 words and make it practical.'
        },
        {
          role: 'user',
          content: `Primary emotion: ${emotions.primary} (${(emotions.confidence * 100).toFixed(1)}% confidence). Suggest a helpful wellness tip.`
        }
      ],
      max_tokens: 80,
      temperature: 0.6
    })

    return completion.choices[0]?.message?.content || ''
  } catch (error) {
    console.error('Error generating wellness recommendation:', error)
    return ''
  }
}

export const generateConversationSuggestions = async (conversationHistory: any[]): Promise<string[]> => {
  try {
    const completion = await openai.chat.completions.create({
      model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Based on the conversation history, suggest 3 thoughtful follow-up questions or conversation topics. Keep each suggestion under 15 words. Return as a JSON array of strings.'
        },
        {
          role: 'user',
          content: `Conversation history: ${JSON.stringify(conversationHistory.slice(-5))}`
        }
      ],
      max_tokens: 150,
      temperature: 0.8
    })

    const content = completion.choices[0]?.message?.content
    if (content) {
      try {
        return JSON.parse(content)
      } catch {
        // Fallback if JSON parsing fails
        return content.split('\n').filter(line => line.trim()).slice(0, 3)
      }
    }

    return []
  } catch (error) {
    console.error('Error generating conversation suggestions:', error)
    return []
  }
}