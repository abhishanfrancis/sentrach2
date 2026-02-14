'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NewsArticle {
  title: string;
  text: string;
  score: number;
  source: string;
  url: string;
  image_url: string;
  timestamp: string;
}

export default function LatestNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch('http://localhost:8000/articles');
        if (!response.ok) throw new Error('Failed to fetch articles');
        const data = await response.json();
        setArticles(data.articles || []);
        setError(null);
      } catch (err) {
        setError('Unable to load news');
        console.error('News fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
    const interval = setInterval(fetchArticles, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return { bg: 'from-emerald-500/20 to-green-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' };
    if (score < -0.3) return { bg: 'from-red-500/20 to-rose-500/20', text: 'text-red-400', border: 'border-red-500/30', glow: 'shadow-red-500/20' };
    return { bg: 'from-amber-500/20 to-yellow-500/20', text: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-amber-500/20' };
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.5) return 'Very Bullish';
    if (score > 0.2) return 'Bullish';
    if (score < -0.5) return 'Very Bearish';
    if (score < -0.2) return 'Bearish';
    return 'Neutral';
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const articleTime = new Date(timestamp);
    const diffMs = now.getTime() - articleTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="glass-card p-6 rounded-2xl border border-violet-500/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <span className="text-xl">📰</span>
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-white to-violet-200 bg-clip-text text-transparent">
            Latest Crypto News
          </h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-28 bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 rounded-2xl border border-red-500/30">
        <div className="text-center py-8">
          <span className="text-4xl mb-4 block">⚠️</span>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-violet-500/20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <span className="text-xl">📰</span>
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-violet-200 bg-clip-text text-transparent">
                Latest Crypto News
              </h2>
              <p className="text-xs text-slate-400">{articles.length} articles • Live feed</p>
            </div>
          </div>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-2 h-2 rounded-full bg-green-400 shadow-lg shadow-green-400/50"
          />
        </div>

        {/* News Grid */}
        <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
          <AnimatePresence mode="popLayout">
            {articles.slice(0, 10).map((article, index) => {
              const sentiment = getSentimentColor(article.score);
              
              return (
                <motion.a
                  key={`${article.url}-${index}`}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className={`block p-4 rounded-xl bg-gradient-to-r ${sentiment.bg} border ${sentiment.border} 
                    hover:shadow-xl ${sentiment.glow} transition-all duration-300 cursor-pointer group`}
                >
                  <div className="flex gap-4">
                    {/* Article Image */}
                    {article.image_url && (
                      <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-slate-800">
                        <img 
                          src={article.image_url} 
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      </div>
                    )}
                    
                    {/* Article Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-white group-hover:text-violet-200 transition-colors line-clamp-2">
                          {article.title || article.text}
                        </h3>
                        {/* Sentiment Badge */}
                        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${sentiment.text} bg-black/30`}>
                          {getSentimentLabel(article.score)}
                        </span>
                      </div>
                      
                      {article.title && (
                        <p className="text-sm text-slate-400 line-clamp-2 mb-2">
                          {article.text}
                        </p>
                      )}
                      
                      {/* Meta Info */}
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                          {article.source || 'Unknown Source'}
                        </span>
                        <span>•</span>
                        <span>{formatTimeAgo(article.timestamp)}</span>
                        <span>•</span>
                        <span className={sentiment.text}>
                          {(article.score * 100).toFixed(0)}% sentiment
                        </span>
                      </div>
                    </div>
                    
                    {/* External Link Icon */}
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
                </motion.a>
              );
            })}
          </AnimatePresence>
          
          {articles.length === 0 && (
            <div className="text-center py-12">
              <span className="text-4xl mb-4 block opacity-50">📰</span>
              <p className="text-slate-400">No news articles available yet</p>
              <p className="text-xs text-slate-500 mt-1">News will appear after the first data cycle</p>
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
