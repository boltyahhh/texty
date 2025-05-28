import React from 'react';
import { motion } from 'framer-motion';
import { Clock, MessageSquare, BarChart3 } from 'lucide-react';
import { ProcessingResult } from '../types';

interface ResultDisplayProps {
  result: ProcessingResult | null;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  if (!result) return null;

  // Destructure from flat structure
  const { transcript, sentiment, sentiment_scores, totalProcessingTime } = result;
  
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-500';
      case 'negative':
        return 'bg-red-500';
      case 'neutral':
      default:
        return 'bg-blue-500';
    }
  };
  
  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😟';
      case 'neutral':
      default:
        return '😐';
    }
  };
  
  const formatConfidence = (value: number) => {
    return (value * 100).toFixed(1) + '%';
  };

  // Split transcription into words for animation
  const words = transcript.split(' ');

  // Get confidence scores with fallbacks
  const positiveScore = sentiment_scores?.positive || sentiment_scores?.POSITIVE || 0;
  const neutralScore = sentiment_scores?.neutral || sentiment_scores?.NEUTRAL || 0;
  const negativeScore = sentiment_scores?.negative || sentiment_scores?.NEGATIVE || 0;

  return (
    <motion.div 
      className="w-full p-6 bg-white/10 dark:bg-black/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 dark:border-gray-800/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Analysis Results
      </h2>
      
      <div className="space-y-6">
        {/* Transcription */}
        <div>
          <div className="flex items-center mb-2">
            <MessageSquare size={18} className="mr-2 text-yellow-500" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">
              Transcription
            </h3>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex flex-wrap gap-1">
              {words.map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="text-gray-800 dark:text-gray-200"
                >
                  {word}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
        
        {/* Sentiment Analysis */}
        <div>
          <div className="flex items-center mb-3">
            <BarChart3 size={18} className="mr-2 text-yellow-500" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">
              Sentiment Analysis
            </h3>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0">
            <motion.div 
              className="flex-1 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <motion.div 
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl ${getSentimentColor(sentiment)}`}
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                {getSentimentEmoji(sentiment)}
              </motion.div>
              <div className="ml-4">
                <motion.p 
                  className="text-lg font-medium capitalize text-gray-800 dark:text-gray-200"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  {sentiment}
                </motion.p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Overall sentiment
                </p>
              </div>
            </motion.div>
            
            <div className="flex-1">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Positive</span>
                    <motion.span 
                      className="font-medium text-gray-800 dark:text-gray-200"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      {formatConfidence(positiveScore)}
                    </motion.span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <motion.div 
                      className="bg-green-500 h-full rounded-full relative"
                      initial={{ width: 0 }}
                      animate={{ width: `${positiveScore * 100}%` }}
                      transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 opacity-50"></div>
                    </motion.div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Neutral</span>
                    <motion.span 
                      className="font-medium text-gray-800 dark:text-gray-200"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.9 }}
                    >
                      {formatConfidence(neutralScore)}
                    </motion.span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <motion.div 
                      className="bg-blue-500 h-full rounded-full relative"
                      initial={{ width: 0 }}
                      animate={{ width: `${neutralScore * 100}%` }}
                      transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-50"></div>
                    </motion.div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Negative</span>
                    <motion.span 
                      className="font-medium text-gray-800 dark:text-gray-200"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                    >
                      {formatConfidence(negativeScore)}
                    </motion.span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <motion.div 
                      className="bg-red-500 h-full rounded-full relative"
                      initial={{ width: 0 }}
                      animate={{ width: `${negativeScore * 100}%` }}
                      transition={{ delay: 0.7, duration: 1, ease: "easeOut" }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-600 opacity-50"></div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Processing Time */}
        <motion.div 
          className="flex items-center text-gray-600 dark:text-gray-400 mt-4 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <Clock size={16} className="mr-1" />
          <span>
            Total processing time: <span className="font-medium">{totalProcessingTime?.toFixed(2) || '0.00'}s</span>
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ResultDisplay;