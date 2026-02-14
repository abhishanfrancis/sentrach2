'use client'

import { motion } from 'framer-motion'
import { Activity, Zap, Clock, RefreshCw } from 'lucide-react'

interface HeaderProps {
  isConnected: boolean
  countdown?: number
  lastUpdated?: string
}

export default function Header({ isConnected, countdown = 60, lastUpdated }: HeaderProps) {
  // Format last updated time
  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never'
    try {
      const date = new Date(lastUpdated)
      return date.toLocaleTimeString()
    } catch {
      return 'Unknown'
    }
  }

  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <motion.div
          className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-purple to-neon-cyan flex items-center justify-center"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        >
          <Zap className="w-6 h-6 text-white" />
        </motion.div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan bg-clip-text text-transparent">
            Tokenized Sentiment Oracle
          </h1>
          <p className="text-sm text-gray-400">Real-time crypto sentiment analysis</p>
        </div>
      </div>
      
      {/* Status Badges */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Connection Status */}
        <div className="glass-card px-4 py-2 flex items-center gap-2">
          <motion.div
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-neon-green' : 'bg-neon-red'}`}
            animate={{ scale: isConnected ? [1, 1.2, 1] : 1 }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          <span className="text-sm text-gray-300">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
        
        {/* Countdown Timer */}
        <div className="glass-card px-4 py-2 flex items-center gap-2">
          <motion.div
            animate={{ rotate: countdown <= 5 ? 360 : 0 }}
            transition={{ duration: 1, ease: "linear" }}
          >
            <RefreshCw className={`w-4 h-4 ${countdown <= 5 ? 'text-neon-orange' : 'text-neon-cyan'}`} />
          </motion.div>
          <span className={`text-sm font-mono ${countdown <= 10 ? 'text-neon-orange' : 'text-gray-300'}`}>
            Next: {countdown}s
          </span>
        </div>
        
        {/* Last Updated */}
        <div className="glass-card px-4 py-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-400">
            {formatLastUpdated()}
          </span>
        </div>
      </div>
    </header>
  )
}
