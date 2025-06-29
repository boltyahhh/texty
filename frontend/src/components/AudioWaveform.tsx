import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface AudioWaveformProps {
  isRecording: boolean
  audioData?: number[]
}

export default function AudioWaveform({ isRecording, audioData }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      const width = canvas.width
      const height = canvas.height
      
      ctx.clearRect(0, 0, width, height)
      
      if (isRecording) {
        // Generate random waveform for recording visualization
        const bars = 20
        const barWidth = width / bars
        
        for (let i = 0; i < bars; i++) {
          const barHeight = Math.random() * height * 0.8 + height * 0.1
          const x = i * barWidth
          const y = (height - barHeight) / 2
          
          // Gradient
          const gradient = ctx.createLinearGradient(0, 0, 0, height)
          gradient.addColorStop(0, '#f3770a')
          gradient.addColorStop(1, '#0ea5e9')
          
          ctx.fillStyle = gradient
          ctx.fillRect(x + 2, y, barWidth - 4, barHeight)
        }
        
        animationRef.current = requestAnimationFrame(draw)
      } else if (audioData) {
        // Draw actual audio data
        const barWidth = width / audioData.length
        
        audioData.forEach((value, index) => {
          const barHeight = value * height
          const x = index * barWidth
          const y = (height - barHeight) / 2
          
          ctx.fillStyle = '#6b7280'
          ctx.fillRect(x, y, barWidth - 1, barHeight)
        })
      }
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isRecording, audioData])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full"
    >
      <canvas
        ref={canvasRef}
        width={300}
        height={60}
        className="w-full h-15 rounded-lg bg-gray-100 dark:bg-gray-800"
      />
    </motion.div>
  )
}