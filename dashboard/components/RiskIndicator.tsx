'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Shield, ShieldAlert, ShieldCheck } from 'lucide-react'

interface RiskIndicatorProps {
  score: number
  confidence: number
}

export default function RiskIndicator({ score, confidence }: RiskIndicatorProps) {
  const extremity = Math.abs(score)
  const lowConfidence = (100 - confidence) / 100
  const riskScore = (extremity * 0.6 + lowConfidence * 0.4) * 100
  
  const getRiskLevel = () => {
    if (riskScore > 70) return { level: 'HIGH', color: 'red', bgColor: 'bg-red-500/20', textColor: 'text-red-400', icon: ShieldAlert }
    if (riskScore > 40) return { level: 'MEDIUM', color: 'orange', bgColor: 'bg-orange-500/20', textColor: 'text-orange-400', icon: AlertTriangle }
    return { level: 'LOW', color: 'green', bgColor: 'bg-green-500/20', textColor: 'text-green-400', icon: ShieldCheck }
  }
  
  const risk = getRiskLevel()
  const RiskIcon = risk.icon

  return (
    <motion.div 
      className={`glass-card p-6 relative overflow-hidden ${
        risk.level === 'HIGH' ? 'pulse-glow-red' : risk.level === 'LOW' ? 'pulse-glow-green' : ''
      }`}
      whileHover={{ scale: 1.01 }}
    >
      {/* Background accent */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 ${risk.bgColor}`} />
      
      <h2 className="text-lg font-semibold text-gray-300 mb-4 relative z-10">Manipulation Risk</h2>
      
      <div className="flex flex-col items-center relative z-10">
        {/* Animated risk icon */}
        <motion.div
          className={`relative w-20 h-20 rounded-full flex items-center justify-center mb-4 ${risk.bgColor}`}
          animate={{
            scale: risk.level === 'HIGH' ? [1, 1.08, 1] : 1,
            boxShadow: risk.level === 'HIGH' 
              ? ['0 0 0 0 rgba(239, 68, 68, 0)', '0 0 30px 10px rgba(239, 68, 68, 0.3)', '0 0 0 0 rgba(239, 68, 68, 0)']
              : undefined,
          }}
          transition={{
            repeat: risk.level === 'HIGH' ? Infinity : 0,
            duration: 1.5,
          }}
        >
          {/* Rotating border for high risk */}
          {risk.level === 'HIGH' && (
            <div 
              className="absolute inset-0 rounded-full border-2 border-red-500/50"
              style={{ animation: 'spin 3s linear infinite' }}
            />
          )}
          <RiskIcon className={`w-10 h-10 ${risk.textColor}`} />
        </motion.div>
        
        {/* Risk level */}
        <motion.div 
          className={`text-2xl font-bold ${risk.textColor} mb-2`}
          key={risk.level}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {risk.level}
        </motion.div>
        
        {/* Risk score */}
        <div className="text-sm text-gray-400">
          Risk Index: <span className={risk.textColor}>{riskScore.toFixed(0)}%</span>
        </div>
        
        {/* Risk factors */}
        <div className="w-full mt-4 space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Sentiment Extremity</span>
              <span className="text-gray-400">{(extremity * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-400"
                initial={{ width: 0 }}
                animate={{ width: `${extremity * 100}%` }}
                transition={{ duration: 0.5, delay: 0.1 }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Confidence Gap</span>
              <span className="text-gray-400">{(lowConfidence * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${lowConfidence * 100}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
