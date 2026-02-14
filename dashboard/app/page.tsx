'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/Header'
import SentimentGauge from '@/components/SentimentGauge'
import LiveFeed from '@/components/LiveFeed'
import TrendChart from '@/components/TrendChart'
import RiskIndicator from '@/components/RiskIndicator'
import ChainStatus from '@/components/ChainStatus'
import StatsGrid from '@/components/StatsGrid'
import { CoinHeatmap } from '@/components/CoinHeatmap'
import { FearGreedIndex } from '@/components/FearGreedIndex'
import { SocialFeed } from '@/components/SocialFeed'
import { PredictionCard } from '@/components/PredictionCard'
import { WalletConnect } from '@/components/WalletConnect'
import { AlertBanner } from '@/components/AlertNotification'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const UPDATE_INTERVAL = 60 // seconds

interface VibeData {
  vibe_score: number
  average_sentiment: number
  volume: number
  trend: 'UP' | 'DOWN' | 'STABLE'
  signal: string
  last_updated_timestamp: string
  next_update_in: number
  update_interval: number
}

interface Coin {
  symbol: string
  name: string
  vibe_score: number
  sentiment_change_24h: number
  signal: string
}

interface MarketSummary {
  fear_greed_index: number
  market_mood: string
  bullish_coins: number
  bearish_coins: number
}

interface Alert {
  signal: string
  vibe_score: number
  timestamp: string
  tx_hash?: string
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'coins' | 'social' | 'predict'>('overview')
  const [data, setData] = useState({
    vibeScore: 0,
    confidence: 0,
    volumeIndex: 1,
    trend: 'STABLE' as 'UP' | 'DOWN' | 'STABLE',
    signal: 'NEUTRAL',
    postCount: 0,
    lastUpdated: '',
  })
  
  const [chartData, setChartData] = useState<Array<{time: string, score: number}>>([])
  const [isConnected, setIsConnected] = useState(false)
  const [countdown, setCountdown] = useState(UPDATE_INTERVAL)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch vibe data from API
  const fetchVibeData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/vibe`)
      if (!response.ok) throw new Error('Failed to fetch')
      
      const vibeData: VibeData = await response.json()
      
      // Update state with new data
      setData({
        vibeScore: vibeData.vibe_score,
        confidence: Math.abs(vibeData.average_sentiment) * 100,
        volumeIndex: vibeData.volume / 10,
        trend: vibeData.trend,
        postCount: vibeData.volume,
        lastUpdated: vibeData.last_updated_timestamp,
      })
      
      // Add to chart data
      setChartData(prev => {
        const newPoint = {
          time: new Date().toLocaleTimeString(),
          score: vibeData.vibe_score,
        }
        return [...prev.slice(-19), newPoint]
      })
      
      // Reset countdown based on server's next_update_in
      setCountdown(vibeData.next_update_in || UPDATE_INTERVAL)
      setIsConnected(true)
      setIsLoading(false)
      
    } catch (error) {
      console.error('Failed to fetch vibe data:', error)
      setIsConnected(false)
    }
  }, [])

  // Initial fetch and setup intervals
  useEffect(() => {
    // Fetch immediately on mount
    fetchVibeData()
    
    // Poll every 60 seconds
    const fetchInterval = setInterval(fetchVibeData, UPDATE_INTERVAL * 1000)
    
    // Countdown timer (updates every second)
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return UPDATE_INTERVAL
        }
        return prev - 1
      })
    }, 1000)
    
    return () => {
      clearInterval(fetchInterval)
      clearInterval(countdownInterval)
    }
  }, [fetchVibeData])

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with countdown */}
        <Header 
          isConnected={isConnected} 
          countdown={countdown}
          lastUpdated={data.lastUpdated}
        />
        
        {/* Loading overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-dark-900/80 flex items-center justify-center z-50"
            >
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-neon-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading sentiment data...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Sentiment Gauge */}
          <motion.div 
            className="col-span-12 lg:col-span-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <SentimentGauge 
              score={data.vibeScore} 
              confidence={data.confidence}
              trend={data.trend}
            />
          </motion.div>
          
          {/* Middle Column - Chart & Stats */}
          <motion.div 
            className="col-span-12 lg:col-span-5 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <TrendChart data={chartData} />
            <StatsGrid 
              confidence={data.confidence}
              volumeIndex={data.volumeIndex}
              postCount={data.postCount}
            />
          </motion.div>
          
          {/* Right Column - Status Cards */}
          <motion.div 
            className="col-span-12 lg:col-span-3 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <RiskIndicator score={data.vibeScore} confidence={data.confidence} />
            <ChainStatus score={data.vibeScore} />
          </motion.div>
          
          {/* Bottom - Live Feed */}
          <motion.div 
            className="col-span-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <LiveFeed />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
