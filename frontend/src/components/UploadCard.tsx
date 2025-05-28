import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileUp, AlertCircle } from 'lucide-react';

interface UploadCardProps {
  onFileSelected: (file: File) => void;
}

const UploadCard: React.FC<UploadCardProps> = ({ onFileSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const acceptedFileTypes = [
    'audio/wav',
    'audio/mpeg',
    'audio/mp3',
    'audio/ogg',
    'audio/opus',
    'audio/webm',
  ];
  
  const handleFileChange = (file: File | null) => {
    setError(null);
    
    if (!file) {
      setError('No file selected');
      return;
    }
    
    if (!acceptedFileTypes.includes(file.type)) {
      setError('File type not supported. Please upload an audio file (WAV, MP3, OGG, OPUS, etc.)');
      return;
    }
    
    setFileName(file.name);
    onFileSelected(file);
  };
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };
  
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <motion.div 
      className="w-full p-6 bg-white/10 dark:bg-black/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 dark:border-gray-800/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Upload Audio File
      </h2>
      
      <motion.div
        className={`border-2 border-dashed p-8 rounded-lg text-center cursor-pointer transition-colors ${
          dragActive 
            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="audio/*"
          onChange={(e) => {
            if (e.target.files) {
              handleFileChange(e.target.files[0]);
            }
          }}
        />
        
        <div className="flex flex-col items-center justify-center">
          <Upload size={48} className="text-gray-400 dark:text-gray-500 mb-3" />
          <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">
            Drag and drop your audio file here
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
            or click to browse
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs">
            Supports WAV, MP3, OGG, OPUS
          </p>
        </div>
      </motion.div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-800 dark:text-red-300 flex items-center">
          <AlertCircle size={18} className="mr-2" />
          <span>{error}</span>
        </div>
      )}
      
      {fileName && !error && (
        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md text-green-800 dark:text-green-300 flex items-center">
          <FileUp size={18} className="mr-2" />
          <span>Selected: {fileName}</span>
        </div>
      )}
    </motion.div>
  );
};

export default UploadCard;