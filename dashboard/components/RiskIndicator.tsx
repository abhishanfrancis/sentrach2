'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Shield, ShieldAlert, ShieldCheck } from 'lucide-react'

interface RiskIndicatorProps {
  score: number
  confidence: number
}

export default function RiskIndicator({ score, confidence }: RiskIndicatorProps) {
  // Calculate manipulation risk based on:
  // - Extreme sentiment (both directions)
  // - Low confidence
  // - High volatility (simplified)
  
  const extremity = Math.abs(score)
  const lowConfidence = (100 - confidence) / 100
  const riskScore = (extremity * 0.6 + lowConfidence * 0.4) * 100
  
  const getRiskLevel = () => {
    if (riskScore > 70) return { level: 'HIGH', color: 'neon-red', icon: ShieldAlert }
    if (riskScore > 40) return { level: 'MEDIUM', color: 'neon-orange', icon: AlertTriangle }
    return { level: 'LOW', color: 'neon-green', icon: ShieldCheck }
  }
  
  const risk = getRiskLevel()
  const RiskIcon = risk.icon

  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold text-gray-300 mb-4">Manipulation Risk</h2>
      
      <div className="flex flex-col items-center">
        {/* Animated risk icon */}
        <motion.div
          className={`w-20 h-20 rounded-full flex items-center justify-center mb-4
            ${risk.level === 'HIGH' ? 'bg-neon-red/20 shadow-neon-red' : ''}
            ${risk.level === 'MEDIUM' ? 'bg-neon-orange/20' : ''}
            ${risk.level === 'LOW' ? 'bg-neon-green/20 shadow-neon-green' : ''}
          `}
          animate={{
            scale: risk.level === 'HIGH' ? [1, 1.1, 1] : 1,
          }}
          transition={{
            repeat: risk.level === 'HIGH' ? Infinity : 0,
            duration: 1,
          }}
        >
          <RiskIcon className={`w-10 h-10 text-${risk.color}`} />
        </motion.div>
        
        {/* Risk level */}
        <div className={`text-2xl font-bold text-${risk.color} mb-2`}>
          {risk.level}
        </div>
        
        {/* Risk score */}
        <div className="text-sm text-gray-400">
          Risk Index: {riskScore.toFixed(0)}%
        </div>
        
        {/* Risk factors */}
        <div className="w-full mt-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Sentiment Extremity</span>
            <span className="text-gray-400">{(extremity * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1 bg-dark-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-neon-purple"
              initial={{ width: 0 }}
              animate={{ width: `${extremity * 100}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs mt-2">
            <span className="text-gray-500">Confidence Gap</span>
            <span className="text-gray-400">{(lowConfidence * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1 bg-dark-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-neon-cyan"
              initial={{ width: 0 }}
              animate={{ width: `${lowConfidence * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
