'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
import { UpdateLog } from '@/components/UpdateLog'
import { LoadingScreen, RefreshIndicator } from '@/components/LoadingStates'
import LatestNews from '@/components/LatestNews'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const UPDATE_INTERVAL = 25 // seconds

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
  
  // New feature states
  const [coins, setCoins] = useState<Coin[]>([])
  const [marketSummary, setMarketSummary] = useState<MarketSummary | null>(null)
  const [socialData, setSocialData] = useState<any>(null)
  const [socialPosts, setSocialPosts] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any>(null)
  const [indicators, setIndicators] = useState<any>(null)
  const [latestAlert, setLatestAlert] = useState<Alert | null>(null)
  const [updateHistory, setUpdateHistory] = useState<Array<{
    id: number
    time: string
    vibeScore: number
    prevScore: number
    signal: string
  }>>([])
  const updateCounterRef = useRef(0)
  const prevVibeScoreRef = useRef(0)

  // Fetch all data from API
  const fetchAllData = useCallback(async () => {
    try {
      // Fetch all endpoints in parallel
      const [vibeRes, coinsRes, marketRes, socialRes, socialPostsRes, predictRes, alertsRes] = await Promise.all([
        fetch(`${API_BASE}/vibe`),
        fetch(`${API_BASE}/coins`).catch(() => null),
        fetch(`${API_BASE}/market`).catch(() => null),
        fetch(`${API_BASE}/social`).catch(() => null),
        fetch(`${API_BASE}/social/posts?limit=20`).catch(() => null),
        fetch(`${API_BASE}/predict`).catch(() => null),
        fetch(`${API_BASE}/alerts?limit=1`).catch(() => null),
      ])

      // Parse responses
      if (vibeRes.ok) {
        const vibeData: VibeData = await vibeRes.json()
        setData({
          vibeScore: vibeData.vibe_score,
          confidence: Math.abs(vibeData.average_sentiment) * 100,
          volumeIndex: vibeData.volume / 10,
          trend: vibeData.trend,
          signal: vibeData.signal || 'NEUTRAL',
          postCount: vibeData.volume,
          lastUpdated: vibeData.last_updated_timestamp,
        })
        
        setChartData(prev => {
          const newPoint = {
            time: new Date().toLocaleTimeString(),
            score: vibeData.vibe_score,
          }
          return [...prev.slice(-19), newPoint]
        })
        
        setCountdown(vibeData.next_update_in || UPDATE_INTERVAL)
        setIsConnected(true)
        
        // Track update history
        updateCounterRef.current += 1
        const newUpdate = {
          id: updateCounterRef.current,
          time: new Date().toLocaleTimeString(),
          vibeScore: vibeData.vibe_score,
          prevScore: prevVibeScoreRef.current,
          signal: vibeData.signal || 'NEUTRAL'
        }
        setUpdateHistory(history => [...history, newUpdate].slice(-20))
        prevVibeScoreRef.current = vibeData.vibe_score
      }

      if (coinsRes?.ok) {
        const coinsData = await coinsRes.json()
        setCoins(coinsData.coins || [])
      }

      if (marketRes?.ok) {
        const marketData = await marketRes.json()
        setMarketSummary(marketData)
      }

      if (socialRes?.ok) {
        const social = await socialRes.json()
        setSocialData(social)
      }

      if (socialPostsRes?.ok) {
        const postsData = await socialPostsRes.json()
        setSocialPosts(postsData.posts || [])
      }

      if (predictRes?.ok) {
        const pred = await predictRes.json()
        setPredictions(pred.predictions)
        setIndicators(pred.indicators)
      }

      if (alertsRes?.ok) {
        const alertData = await alertsRes.json()
        if (alertData.alerts?.length > 0) {
          setLatestAlert(alertData.alerts[0])
        }
      }

      setIsLoading(false)
      
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setIsConnected(false)
    }
  }, [])

  // Initial fetch and setup intervals
  useEffect(() => {
    // Fetch immediately on mount
    fetchAllData()
    
    // Poll every 60 seconds
    const fetchInterval = setInterval(fetchAllData, UPDATE_INTERVAL * 1000)
    
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
  }, [fetchAllData])

  // Tab navigation
  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'coins', label: '🪙 Coins' },
    { id: 'social', label: '📢 Social' },
    { id: 'predict', label: '🔮 Predict' },
  ]

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with countdown */}
        <Header 
          isConnected={isConnected} 
          countdown={countdown}
          lastUpdated={data.lastUpdated}
        />

        {/* Alert Banner */}
        {latestAlert && <AlertBanner latestAlert={latestAlert} />}

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 border border-white/5 hover:border-purple-500/30'
              }`}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>
        
        {/* Loading overlay */}
        <AnimatePresence>
          {isLoading && <LoadingScreen />}
        </AnimatePresence>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
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
          
          {/* Bottom Row - Update Log & Live Feed */}
          <motion.div 
            className="col-span-12 lg:col-span-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <UpdateLog 
              updates={updateHistory}
              countdown={countdown}
            />
          </motion.div>
          
          <motion.div 
            className="col-span-12 lg:col-span-7"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <LiveFeed />
          </motion.div>
          
          {/* Full width News Section */}
          <motion.div 
            className="col-span-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <LatestNews />
          </motion.div>
          </div>
        )}

        {/* Coins Tab */}
        {activeTab === 'coins' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Fear & Greed Index */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {marketSummary && (
                  <FearGreedIndex 
                    value={marketSummary.fear_greed_index} 
                    mood={marketSummary.market_mood}
                  />
                )}
              </motion.div>
              
              {/* Wallet Connect */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-2"
              >
                <WalletConnect />
              </motion.div>
            </div>
            
            {/* Coin Heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <CoinHeatmap coins={coins} />
            </motion.div>
          </div>
        )}

        {/* Social Tab */}
        {activeTab === 'social' && socialData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <SocialFeed 
                posts={socialPosts}
                platforms={socialData.platform_breakdown || {}}
                combinedSentiment={socialData.combined_sentiment || 0}
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              {marketSummary && (
                <FearGreedIndex 
                  value={marketSummary.fear_greed_index} 
                  mood={marketSummary.market_mood}
                />
              )}
              <LiveFeed />
            </motion.div>
          </div>
        )}

        {/* Predict Tab */}
        {activeTab === 'predict' && predictions && indicators && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2"
            >
              <PredictionCard 
                predictions={predictions}
                indicators={indicators}
                currentScore={data.vibeScore}
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <SentimentGauge 
                score={data.vibeScore} 
                confidence={data.confidence}
                trend={data.trend}
              />
              <TrendChart data={chartData} />
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
