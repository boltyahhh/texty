import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Server, AlertCircle } from 'lucide-react';
import { testApiHealth } from '../services/api';

interface ApiStatusProps {
  className?: string;
}

const ApiStatus: React.FC<ApiStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('checking');
  const [apiUrl, setApiUrl] = useState<string>('');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    setApiUrl(import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000');
    checkApiHealth();
    
    // Check every 30 seconds
    const interval = setInterval(checkApiHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkApiHealth = async () => {
    try {
      setStatus('checking');
      await testApiHealth();
      setStatus('connected');
      setLastCheck(new Date());
    } catch (error) {
      console.error('API health check failed:', error);
      setStatus('disconnected');
      setLastCheck(new Date());
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <Server className="w-4 h-4 animate-pulse text-yellow-500" />;
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'checking':
        return 'Checking...';
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Error';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'checking':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'disconnected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const isLocalhost = apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');

  return (
    <motion.div
      className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm font-medium ${getStatusColor()} ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      
      {status === 'connected' && (
        <div className="flex items-center space-x-1 text-xs opacity-75">
          <span>•</span>
          <span>{isLocalhost ? 'Local' : 'Lambda'}</span>
        </div>
      )}
      
      {lastCheck && (
        <div className="text-xs opacity-50">
          {lastCheck.toLocaleTimeString()}
        </div>
      )}
      
      <button
        onClick={checkApiHealth}
        className="ml-2 p-1 rounded hover:bg-black/10 transition-colors"
        title="Refresh status"
      >
        <Server className="w-3 h-3" />
      </button>
    </motion.div>
  );
};

export default ApiStatus;