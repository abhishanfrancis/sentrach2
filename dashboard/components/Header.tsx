'use client'

import { motion } from 'framer-motion'
import { Activity, Zap, Clock, RefreshCw, Radio } from 'lucide-react'

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
          className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/25"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          whileHover={{ scale: 1.05 }}
        >
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 blur-lg opacity-50" />
          <Zap className="w-7 h-7 text-white relative z-10" />
        </motion.div>
        <div>
          <motion.h1 
            className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            Tokenized Sentiment Oracle
          </motion.h1>
          <motion.p 
            className="text-sm text-gray-400 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Radio className="w-3 h-3 text-purple-400" />
            Real-time crypto sentiment analysis
          </motion.p>
        </div>
      </div>
      
      {/* Status Badges */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Connection Status */}
        <motion.div 
          className="glass-card px-4 py-2 flex items-center gap-2 hover:border-green-500/30 transition-colors"
          whileHover={{ scale: 1.02 }}
        >
          <div className="relative">
            <motion.div
              className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}
              animate={{ scale: isConnected ? [1, 1.3, 1] : 1 }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            {isConnected && (
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-400 animate-ping opacity-75" />
            )}
          </div>
          <span className={`text-sm font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </motion.div>
        
        {/* Countdown Timer */}
        <motion.div 
          className={`glass-card px-4 py-2 flex items-center gap-2 transition-all ${
            countdown <= 5 ? 'border-orange-500/50 shadow-orange-500/20 shadow-lg' : ''
          }`}
          whileHover={{ scale: 1.02 }}
          animate={countdown <= 5 ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 0.5, repeat: countdown <= 5 ? Infinity : 0 }}
        >
          <motion.div
            animate={{ rotate: countdown <= 5 ? 360 : 0 }}
            transition={{ duration: 1, ease: "linear", repeat: countdown <= 5 ? Infinity : 0 }}
          >
            <RefreshCw className={`w-4 h-4 ${countdown <= 5 ? 'text-orange-400' : 'text-cyan-400'}`} />
          </motion.div>
          <span className={`text-sm font-mono font-medium ${
            countdown <= 5 ? 'text-orange-400' : countdown <= 10 ? 'text-yellow-400' : 'text-gray-300'
          }`}>
            {countdown}s
          </span>
        </motion.div>
        
        {/* Last Updated */}
        <motion.div 
          className="glass-card px-4 py-2 flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
        >
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-400">
            {formatLastUpdated()}
          </span>
        </motion.div>
      </div>
    </header>
  )
}
