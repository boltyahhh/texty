'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react'
import { ConnectionStatus as Status } from '@/hooks/useWebSocket'

interface ConnectionStatusProps {
  status: Status
}

export default function ConnectionStatus({ status }: ConnectionStatusProps) {
  const getStatusConfig = (status: Status) => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'bg-green-500',
          text: 'Connected',
          show: false // Don't show when connected
        }
      case 'connecting':
        return {
          icon: Wifi,
          color: 'bg-yellow-500',
          text: 'Connecting...',
          show: true
        }
      case 'disconnected':
        return {
          icon: WifiOff,
          color: 'bg-red-500',
          text: 'Disconnected',
          show: true
        }
      case 'error':
        return {
          icon: AlertCircle,
          color: 'bg-red-500',
          text: 'Connection Error',
          show: true
        }
      default:
        return {
          icon: WifiOff,
          color: 'bg-gray-500',
          text: 'Unknown',
          show: true
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <AnimatePresence>
      {config.show && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 safe-area-top"
        >
          <div className={`${config.color} text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center`}>
            <Icon size={16} className="mr-2" />
            {config.text}
            {status === 'connecting' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="ml-2"
              >
                <Wifi size={16} />
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}