import React from 'react';
import { motion } from 'framer-motion';
import { Headphones, Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <motion.header 
      className="w-full py-4 px-6 md:px-8 backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800 shadow-sm fixed top-0 z-10"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <motion.div 
          className="flex items-center"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 w-10 h-10 rounded-lg flex items-center justify-center mr-3 shadow-md">
            <Headphones size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            VoiceInsight
          </h1>
        </motion.div>
        
        <motion.button
          className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          onClick={toggleTheme}
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </motion.button>
      </div>
    </motion.header>
  );
};

export default Header;