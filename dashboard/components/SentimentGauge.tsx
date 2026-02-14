'use client'

import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react'

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
  
  const getGlowClass = () => {
    if (score > 0.3) return 'pulse-glow-green'
    if (score < -0.3) return 'pulse-glow-red'
    return 'pulse-glow'
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
    <div className={`glass-card p-6 h-full relative overflow-hidden hover-lift ${getGlowClass()}`}>
      {/* Animated background accent */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl"
          style={{
            background: score > 0 
              ? 'radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, transparent 70%)' 
              : score < 0 
                ? 'radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)',
            animation: 'ambientPulse1 4s ease-in-out infinite'
          }}
        />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-300">Community Vibe Score</h2>
          <div className="flex items-center gap-1 text-xs text-purple-400">
            <Zap className="w-3 h-3" />
            <span>LIVE</span>
            <span className="live-dot ml-1" />
          </div>
        </div>
      
      {/* Gauge with glow ring */}
      <div className="relative w-full aspect-[2/1] mb-6">
        {/* Rotating glow effect */}
        <div 
          className="absolute inset-[-20%] rounded-full opacity-20 blur-2xl"
          style={{
            background: 'conic-gradient(from 180deg, transparent, var(--neon-purple), var(--neon-cyan), transparent)',
            animation: 'spin 10s linear infinite'
          }}
        />
        
        <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible relative z-10">
          {/* Background arc */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="strongGlow">
              <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Outer glow track */}
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="16"
            strokeLinecap="round"
            opacity="0.2"
            filter="url(#strongGlow)"
          />
          
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
          
          {/* Needle with glow */}
          <motion.g
            animate={{ rotate: rotation }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
            style={{ transformOrigin: '100px 90px' }}
          >
            {/* Needle glow */}
            <line
              x1="100"
              y1="90"
              x2="100"
              y2="30"
              stroke="white"
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.3"
              filter="url(#glow)"
            />
            <line
              x1="100"
              y1="90"
              x2="100"
              y2="30"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="100" cy="90" r="10" fill="white" opacity="0.3" filter="url(#glow)" />
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
          initial={{ scale: 1.1, filter: 'blur(4px)' }}
          animate={{ scale: 1, filter: 'blur(0px)' }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          style={{
            textShadow: score > 0.3 
              ? '0 0 30px rgba(34, 197, 94, 0.5)' 
              : score < -0.3 
                ? '0 0 30px rgba(239, 68, 68, 0.5)'
                : '0 0 30px rgba(168, 85, 247, 0.5)'
          }}
        >
          {score >= 0 ? '+' : ''}<AnimatedNumber value={score} />
        </motion.div>
        
        <motion.div 
          className="text-xl text-gray-300"
          key={getLabel()}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {getLabel()}
        </motion.div>
        
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
        <div className="h-2 bg-dark-700/50 rounded-full overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20" />
          <motion.div
            className="h-full bg-gradient-to-r from-neon-purple to-neon-cyan relative z-10"
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 0.5 }}
            style={{ boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)' }}
          />
        </div>
      </div>
      </div>
    </div>
  )
}
