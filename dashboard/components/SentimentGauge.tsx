'use client'

import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface SentimentGaugeProps {
  score: number
  confidence: number
  trend: 'UP' | 'DOWN' | 'STABLE'
}

function AnimatedNumber({ value, decimals = 2 }: { value: number, decimals?: number }) {
  const spring = useSpring(value, { stiffness: 100, damping: 30 })
  const display = useTransform(spring, (v) => v.toFixed(decimals))
  const [displayValue, setDisplayValue] = useState(value.toFixed(decimals))
  
  useEffect(() => {
    spring.set(value)
    const unsubscribe = display.on('change', (v) => setDisplayValue(v))
    return unsubscribe
  }, [value, spring, display])
  
  return <>{displayValue}</>
}

export default function SentimentGauge({ score, confidence, trend }: SentimentGaugeProps) {
  const normalizedScore = (score + 1) / 2 // Convert -1...1 to 0...1
  const rotation = normalizedScore * 180 - 90 // -90 to 90 degrees
  
  const getScoreColor = () => {
    if (score > 0.3) return 'text-neon-green'
    if (score < -0.3) return 'text-neon-red'
    return 'text-neon-orange'
  }
  
  const getLabel = () => {
    if (score > 0.4) return '🚀 Very Bullish'
    if (score > 0.2) return '📈 Bullish'
    if (score > 0.05) return '↗️ Slightly Bullish'
    if (score < -0.4) return '💀 Very Bearish'
    if (score < -0.2) return '🐻 Bearish'
    if (score < -0.05) return '↘️ Slightly Bearish'
    return '😐 Neutral'
  }
  
  const TrendIcon = trend === 'UP' ? TrendingUp : trend === 'DOWN' ? TrendingDown : Minus
  const trendColor = trend === 'UP' ? 'text-neon-green' : trend === 'DOWN' ? 'text-neon-red' : 'text-neon-orange'

  return (
    <div className="glass-card p-6 h-full">
      <h2 className="text-lg font-semibold text-gray-300 mb-6">Community Vibe Score</h2>
      
      {/* Gauge */}
      <div className="relative w-full aspect-[2/1] mb-6">
        <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible">
          {/* Background arc */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Track */}
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          
          {/* Gradient arc */}
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            filter="url(#glow)"
          />
          
          {/* Needle */}
          <motion.g
            animate={{ rotate: rotation }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
            style={{ transformOrigin: '100px 90px' }}
          >
            <line
              x1="100"
              y1="90"
              x2="100"
              y2="30"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="100" cy="90" r="8" fill="white" />
          </motion.g>
          
          {/* Labels */}
          <text x="15" y="98" fill="#888" fontSize="10">-1</text>
          <text x="95" y="20" fill="#888" fontSize="10">0</text>
          <text x="175" y="98" fill="#888" fontSize="10">+1</text>
        </svg>
      </div>
      
      {/* Score Display */}
      <div className="text-center space-y-2">
        <motion.div
          className={`text-6xl font-bold ${getScoreColor()}`}
          key={score}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
        >
          {score >= 0 ? '+' : ''}<AnimatedNumber value={score} />
        </motion.div>
        
        <div className="text-xl text-gray-300">{getLabel()}</div>
        
        {/* Trend indicator */}
        <div className={`flex items-center justify-center gap-2 ${trendColor}`}>
          <TrendIcon className="w-5 h-5" />
          <span className="text-sm font-medium">{trend}</span>
        </div>
      </div>
      
      {/* Confidence bar */}
      <div className="mt-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Confidence</span>
          <span><AnimatedNumber value={confidence} decimals={0} />%</span>
        </div>
        <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-neon-purple to-neon-cyan"
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  )
}
