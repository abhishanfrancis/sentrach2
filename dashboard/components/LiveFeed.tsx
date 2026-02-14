'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Article {
  id: string
  title: string
  text: string
  score: number
  source: string
  url: string
  timestamp: string
}

export default function LiveFeed() {
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const fetchArticles = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/articles`)
      if (!response.ok) throw new Error('Failed to fetch')
      
      const data = await response.json()
      
      // Transform API data
      const transformedArticles: Article[] = data.articles.map((article: any, index: number) => ({
        id: `article-${index}-${article.timestamp}`,
        title: article.title || '',
        text: article.text,
        score: article.score,
        source: article.source || 'Unknown',
        url: article.url || '',
        timestamp: article.timestamp,
      }))
      
      setArticles(transformedArticles)
      setLastFetch(new Date())
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to fetch articles:', error)
      setIsLoading(false)
    }
  }, [])
  
  useEffect(() => {
    // Fetch immediately
    fetchArticles()
    
    // Refresh every 25 seconds
    const interval = setInterval(fetchArticles, 25000)
    
    return () => clearInterval(interval)
  }, [fetchArticles])
  
  const getScoreColor = (score: number) => {
    if (score > 0.3) return 'border-neon-green/50 bg-neon-green/5'
    if (score < -0.3) return 'border-neon-red/50 bg-neon-red/5'
    return 'border-neon-orange/50 bg-neon-orange/5'
  }
  
  const getScoreBadgeColor = (score: number) => {
    if (score > 0.3) return 'text-neon-green bg-neon-green/10'
    if (score < -0.3) return 'text-neon-red bg-neon-red/10'
    return 'text-neon-orange bg-neon-orange/10'
  }
  
  const getLabel = (score: number) => {
    if (score > 0.3) return 'Bullish'
    if (score < -0.3) return 'Bearish'
    return 'Neutral'
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
          <h2 className="text-lg font-semibold text-gray-300">News Sentiment Feed</h2>
          <span className="text-xs text-gray-500">({articles.length} articles)</span>
        </div>
        {lastFetch && (
          <span className="text-xs text-gray-500">
            Updated: {lastFetch.toLocaleTimeString()}
          </span>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-neon-purple animate-spin" />
          <span className="ml-2 text-gray-400">Loading articles...</span>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No articles available. Waiting for next update...
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-72 overflow-y-auto"
        >
          <AnimatePresence mode="popLayout">
            {articles.slice(0, 12).map((article, index) => (
              <motion.a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                layout
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`block p-4 rounded-xl border ${getScoreColor(article.score)} hover:scale-105 transition-transform cursor-pointer`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getScoreBadgeColor(article.score)}`}>
                    {getLabel(article.score)}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    {article.score > 0 ? '+' : ''}{article.score.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-white font-medium line-clamp-2 mb-1">
                  {article.title || article.text}
                </p>
                <p className="text-xs text-gray-500">
                  {article.source}
                </p>
              </motion.a>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
