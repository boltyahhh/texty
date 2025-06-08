import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Recorder from './components/Recorder';
import UploadCard from './components/UploadCard';
import ResultDisplay from './components/ResultDisplay';
import ProcessingOverlay from './components/ProcessingOverlay';
import { processAudio } from './services/api';
import { ProcessingResult, ProcessingStatus } from './types';

function App() {
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleProcessAudio = async (audioFile: File, language?: string, autoDetect?: boolean) => {
    try {
      setProcessingStatus('uploading');
      setResult(null);
      setErrorMessage('');
      
      // Short delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProcessingStatus('processing');
      const result = await processAudio(audioFile, language, autoDetect);
      
      setResult(result);
      setProcessingStatus('success');
    } catch (error) {
      console.error('Error processing audio:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
      setProcessingStatus('error');
    }
  };
  
  const handleRecordingComplete = (audioBlob: Blob, language?: string, autoDetect?: boolean) => {
    const file = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
    handleProcessAudio(file, language, autoDetect);
  };

  const handleFileSelected = (file: File, language?: string, autoDetect?: boolean) => {
    handleProcessAudio(file, language, autoDetect);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-200">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-100 dark:to-white">
            Voice Insight
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-4">
            Convert speech to text and analyze sentiment with our advanced AI tools
          </p>
          <div className="flex justify-center items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Enhanced support for South Indian languages
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Auto language detection
            </span>
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Recorder onRecordingComplete={handleRecordingComplete} />
          <UploadCard onFileSelected={handleFileSelected} />
        </div>
        
        <AnimatePresence mode="wait">
          {processingStatus === 'success' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <ResultDisplay result={result} />
            </motion.div>
          )}
          
          {processingStatus === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300"
            >
              <h3 className="text-lg font-semibold mb-2">Error Processing Audio</h3>
              <p>{errorMessage || 'An unknown error occurred. Please try again.'}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <ProcessingOverlay 
        status={processingStatus} 
        errorMessage={errorMessage}
      />
      
      <footer className="py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} VoiceInsight. Enhanced support for Tamil, Telugu, Kannada & Malayalam.</p>
      </footer>
    </div>
  );
}

export default App;