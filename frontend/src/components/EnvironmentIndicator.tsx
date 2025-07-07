import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, Home, AlertTriangle } from 'lucide-react';

const EnvironmentIndicator: React.FC = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  const isProduction = import.meta.env.PROD;
  const isDevelopment = import.meta.env.DEV;
  
  const isLocalhost = apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');
  const isLambda = apiUrl.includes('amazonaws.com') || apiUrl.includes('execute-api');

  const getEnvironmentInfo = () => {
    if (isProduction && isLambda) {
      return {
        label: 'Production',
        icon: <Cloud size={14} />,
        color: 'bg-green-500 text-white',
        description: 'Connected to AWS Lambda'
      };
    } else if (isDevelopment && isLocalhost) {
      return {
        label: 'Development',
        icon: <Home size={14} />,
        color: 'bg-blue-500 text-white',
        description: 'Connected to local server'
      };
    } else {
      return {
        label: 'Mixed',
        icon: <AlertTriangle size={14} />,
        color: 'bg-yellow-500 text-white',
        description: 'Environment mismatch detected'
      };
    }
  };

  const envInfo = getEnvironmentInfo();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${envInfo.color}`}
      title={envInfo.description}
    >
      {envInfo.icon}
      <span>{envInfo.label}</span>
    </motion.div>
  );
};

export default EnvironmentIndicator;