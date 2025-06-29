import { motion } from 'framer-motion'
import { Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface EmotionData {
  primary: string
  confidence: number
  scores: Record<string, number>
}

interface EmotionDisplayProps {
  emotions: EmotionData
  compact?: boolean
}

export default function EmotionDisplay({ emotions, compact = false }: EmotionDisplayProps) {
  const getEmotionEmoji = (emotion: string) => {
    const emojiMap: { [key: string]: string } = {
      'anxious': '😰',
      'angry': '😠',
      'sad': '😢',
      'happy': '😊',
      'hate': '😡',
      'satisfaction': '😌',
      'gratitude': '🙏',
      'reproach': '😤',
      'distress': '😫',
      'pride': '😤',
      'fear': '😨',
      'mildness': '😐',
      'pity': '😔',
      'boredom': '😴',
      'shame': '😳',
      'disappointment': '😞',
      'hope': '🤞',
      'resentment': '😒',
      'love': '❤️',
      'gloating': '😏',
      'anger': '😡',
      'relief': '😅',
      'admiration': '😍'
    }
    return emojiMap[emotion] || '😐'
  }

  const getEmotionColor = (emotion: string) => {
    const positiveEmotions = ['happy', 'love', 'gratitude', 'satisfaction', 'pride', 'hope', 'relief', 'admiration']
    const negativeEmotions = ['angry', 'sad', 'fear', 'hate', 'distress', 'shame', 'disappointment', 'resentment', 'anxious']
    
    if (positiveEmotions.includes(emotion)) return 'text-green-500'
    if (negativeEmotions.includes(emotion)) return 'text-red-500'
    return 'text-blue-500'
  }

  const getSentimentIcon = (emotion: string) => {
    const positiveEmotions = ['happy', 'love', 'gratitude', 'satisfaction', 'pride', 'hope', 'relief', 'admiration']
    const negativeEmotions = ['angry', 'sad', 'fear', 'hate', 'distress', 'shame', 'disappointment', 'resentment', 'anxious']
    
    if (positiveEmotions.includes(emotion)) return <TrendingUp size={16} />
    if (negativeEmotions.includes(emotion)) return <TrendingDown size={16} />
    return <Minus size={16} />
  }

  const formatConfidence = (value: number) => {
    return (value * 100).toFixed(0) + '%'
  }

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  if (compact) {
    return (
      <motion.div 
        className="emotion-card"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <motion.div 
              className="text-2xl mr-3"
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {getEmotionEmoji(emotions.primary)}
            </motion.div>
            <div>
              <motion.p 
                className={`font-medium capitalize ${getEmotionColor(emotions.primary)}`}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {capitalizeFirst(emotions.primary)}
              </motion.p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Primary emotion
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-semibold ${getEmotionColor(emotions.primary)}`}>
              {formatConfidence(emotions.confidence)}
            </p>
            <div className={`flex items-center justify-end ${getEmotionColor(emotions.primary)}`}>
              {getSentimentIcon(emotions.primary)}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Full emotion display
  const topEmotions = Object.entries(emotions.scores)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)

  return (
    <div className="space-y-4">
      {/* Primary Emotion */}
      <div>
        <div className="flex items-center mb-3">
          <Heart size={18} className="mr-2 text-pink-500" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">
            Emotion Analysis
          </h3>
        </div>
        
        <motion.div 
          className="emotion-card"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <motion.div 
                className="text-3xl mr-4"
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                {getEmotionEmoji(emotions.primary)}
              </motion.div>
              <div>
                <motion.p 
                  className={`text-xl font-medium capitalize ${getEmotionColor(emotions.primary)}`}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {capitalizeFirst(emotions.primary)}
                </motion.p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Primary emotion
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-xl font-semibold ${getEmotionColor(emotions.primary)}`}>
                {formatConfidence(emotions.confidence)}
              </p>
              <div className={`flex items-center justify-end ${getEmotionColor(emotions.primary)}`}>
                {getSentimentIcon(emotions.primary)}
                <span className="text-sm ml-1">Confidence</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top Emotions */}
      {topEmotions.length > 1 && (
        <div>
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-200 mb-3">
            Detected Emotions
          </h4>
          <div className="space-y-2">
            {topEmotions.map(([emotion, score], index) => (
              <motion.div
                key={emotion}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
              >
                <div className="flex items-center">
                  <span className="text-lg mr-3">{getEmotionEmoji(emotion)}</span>
                  <div>
                    <p className={`font-medium capitalize ${getEmotionColor(emotion)}`}>
                      {capitalizeFirst(emotion)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                    <motion.div 
                      className={`h-2 rounded-full ${
                        getEmotionColor(emotion).includes('green') ? 'bg-green-500' :
                        getEmotionColor(emotion).includes('red') ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${score * 100}%` }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.8 }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300 min-w-[3rem]">
                    {formatConfidence(score)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}