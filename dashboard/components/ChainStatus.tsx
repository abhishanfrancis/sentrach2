'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, CheckCircle2, Loader2, ExternalLink } from 'lucide-react'

interface ChainStatusProps {
  score: number
}

export default function ChainStatus({ score }: ChainStatusProps) {
  const [isPushing, setIsPushing] = useState(false)
  const [lastTx, setLastTx] = useState<string | null>(null)
  const [onChainScore, setOnChainScore] = useState<number | null>(null)
  
  const handlePush = async () => {
    setIsPushing(true)
    
    // Simulate blockchain push
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const mockTxHash = '0x' + Array.from({ length: 64 }, () => 
      '0123456789abcdef'[Math.floor(Math.random() * 16)]
    ).join('')
    
    setLastTx(mockTxHash)
    setOnChainScore(Math.round(score * 100))
    setIsPushing(false)
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Link className="w-5 h-5 text-neon-purple" />
        <h2 className="text-lg font-semibold text-gray-300">On-Chain Oracle</h2>
      </div>
      
      {/* On-chain score */}
      <div className="bg-dark-700 rounded-xl p-4 mb-4">
        <div className="text-sm text-gray-500 mb-1">On-Chain Score</div>
        <div className="text-3xl font-bold text-neon-cyan">
          {onChainScore !== null ? onChainScore : '--'}
        </div>
      </div>
      
      {/* Last TX */}
      {lastTx && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1">Last Transaction</div>
          <div className="flex items-center gap-2">
            <code className="text-xs text-neon-green bg-neon-green/10 px-2 py-1 rounded">
              {lastTx.slice(0, 10)}...{lastTx.slice(-8)}
            </code>
            <ExternalLink className="w-3 h-3 text-gray-500 cursor-pointer hover:text-neon-purple" />
          </div>
        </div>
      )}
      
      {/* Push button */}
      <motion.button
        onClick={handlePush}
        disabled={isPushing}
        className={`
          w-full py-3 px-4 rounded-xl font-semibold
          flex items-center justify-center gap-2
          transition-all duration-300
          ${isPushing 
            ? 'bg-dark-600 text-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-neon-purple to-neon-cyan text-white hover:shadow-neon-purple'
          }
        `}
        whileHover={!isPushing ? { scale: 1.02 } : {}}
        whileTap={!isPushing ? { scale: 0.98 } : {}}
      >
        {isPushing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Pushing...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5" />
            Push to Blockchain
          </>
        )}
      </motion.button>
      
      {/* Network info */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span>Network</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-neon-green" />
          Hardhat Local
        </span>
      </div>
    </div>
  )
}
