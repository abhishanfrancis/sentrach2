'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface Post {
  platform: string;
  text: string;
  sentiment: number;
  engagement: number;
  timestamp: string;
}

interface PlatformMetrics {
  platform: string;
  sentiment: number;
  post_count: number;
  total_engagement: number;
  trending_topics: string[];
}

interface SocialFeedProps {
  posts: Post[];
  platforms: Record<string, PlatformMetrics>;
  combinedSentiment: number;
}

export function SocialFeed({ posts, platforms, combinedSentiment }: SocialFeedProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'twitter' | 'reddit' | 'discord'>('all');

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return '𝕏';
      case 'reddit':
        return '🔴';
      case 'discord':
        return '💬';
      default:
        return '📱';
    }
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-green-400';
    if (sentiment < -0.3) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getSentimentBg = (sentiment: number) => {
    if (sentiment > 0.3) return 'bg-green-500/20 border-green-500/30';
    if (sentiment < -0.3) return 'bg-red-500/20 border-red-500/30';
    return 'bg-yellow-500/20 border-yellow-500/30';
  };

  const filteredPosts = activeTab === 'all' 
    ? posts 
    : posts.filter(p => p.platform.toLowerCase() === activeTab);

  const formatEngagement = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="bg-gray-900/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>📢</span>
          Social Sentiment
        </h2>
        <div className={`px-3 py-1 rounded-full text-sm ${getSentimentBg(combinedSentiment)}`}>
          <span className={getSentimentColor(combinedSentiment)}>
            {combinedSentiment > 0 ? '+' : ''}{(combinedSentiment * 100).toFixed(0)}
          </span>
        </div>
      </div>

      {/* Platform tabs */}
      <div className="flex gap-2 mb-4">
        {['all', 'twitter', 'reddit', 'discord'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700/50 text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'all' ? 'All' : getPlatformIcon(tab)} {tab !== 'all' && tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Platform metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {Object.values(platforms).map(platform => (
          <div 
            key={platform.platform}
            className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{getPlatformIcon(platform.platform)}</span>
              <span className="text-sm text-gray-400 capitalize">{platform.platform}</span>
            </div>
            <div className={`text-xl font-bold ${getSentimentColor(platform.sentiment)}`}>
              {platform.sentiment > 0 ? '+' : ''}{(platform.sentiment * 100).toFixed(0)}
            </div>
            <div className="text-xs text-gray-500">
              {platform.post_count} posts • {formatEngagement(platform.total_engagement)} engagement
            </div>
          </div>
        ))}
      </div>

      {/* Trending topics */}
      {Object.values(platforms)[0]?.trending_topics && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {Object.values(platforms)[0].trending_topics.slice(0, 5).map(topic => (
            <span 
              key={topic}
              className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs"
            >
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* Posts feed */}
      <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
        {filteredPosts.slice(0, 10).map((post, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-3 rounded-lg border ${getSentimentBg(post.sentiment)}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{getPlatformIcon(post.platform)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200">{post.text}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span>❤️ {formatEngagement(post.engagement)}</span>
                  <span className={getSentimentColor(post.sentiment)}>
                    Sentiment: {(post.sentiment * 100).toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
