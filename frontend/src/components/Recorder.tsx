import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useReactMediaRecorder } from 'react-media-recorder';
import { Mic, Square, AlertCircle } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';

interface RecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
}

const Recorder: React.FC<RecorderProps> = ({ onRecordingComplete }) => {
  const [recordingTime, setRecordingTime] = useState(0);
  const [timerId, setTimerId] = useState<number | null>(null);
  
  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
    error
  } = useReactMediaRecorder({
    audio: true,
    onStop: (blobUrl, blob) => {
      if (blob) {
        onRecordingComplete(blob);
      }
    }
  });

  const isRecording = status === 'recording';
  
  const handleStartRecording = () => {
    clearBlobUrl();
    startRecording();
    
    // Start timer
    setRecordingTime(0);
    const id = window.setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    setTimerId(id);
  };
  
  const handleStopRecording = () => {
    stopRecording();
    
    // Clear timer
    if (timerId) {
      window.clearInterval(timerId);
      setTimerId(null);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      className="w-full p-6 bg-white/10 dark:bg-black/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 dark:border-gray-800/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Record Audio
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-800 dark:text-red-300 flex items-center">
          <AlertCircle size={18} className="mr-2" />
          <span>
            {error === "Permission denied" 
              ? "Microphone access denied. Please allow microphone access."
              : `Error: ${error}`}
          </span>
        </div>
      )}
      
      <AudioVisualizer isRecording={isRecording} />
      
      {isRecording && (
        <div className="text-center mb-4 text-gray-700 dark:text-gray-300">
          Recording: {formatTime(recordingTime)}
        </div>
      )}
      
      <div className="flex justify-center mt-4">
        {!isRecording ? (
          <motion.button
            className="flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-full shadow-md hover:shadow-lg"
            onClick={handleStartRecording}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Mic size={20} className="mr-2" />
            Start Recording
          </motion.button>
        ) : (
          <motion.button
            className="flex items-center px-6 py-3 bg-red-500 text-white rounded-full shadow-md hover:shadow-lg"
            onClick={handleStopRecording}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Square size={20} className="mr-2" />
            Stop Recording
          </motion.button>
        )}
      </div>
      
      {mediaBlobUrl && !isRecording && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview your recording:</p>
          <audio src={mediaBlobUrl} controls className="w-full" />
        </div>
      )}
    </motion.div>
  );
};

export default Recorder;