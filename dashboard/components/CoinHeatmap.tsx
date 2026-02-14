'use client';

import { motion } from 'framer-motion';

interface Coin {
  symbol: string;
  name: string;
  vibe_score: number;
  sentiment_change_24h: number;
  signal: string;
}

interface CoinHeatmapProps {
  coins: Coin[];
}

export function CoinHeatmap({ coins }: CoinHeatmapProps) {
  const getColor = (score: number) => {
    if (score > 0.6) return 'from-green-400 to-green-600';
    if (score > 0.3) return 'from-green-300 to-green-500';
    if (score > 0) return 'from-emerald-200 to-emerald-400';
    if (score > -0.3) return 'from-yellow-200 to-yellow-400';
    if (score > -0.6) return 'from-orange-300 to-orange-500';
    return 'from-red-400 to-red-600';
  };

  const getTextColor = (score: number) => {
    return Math.abs(score) > 0.3 ? 'text-white' : 'text-gray-800';
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'BULLISH_SIGNAL':
        return '🟢';
      case 'BEARISH_SIGNAL':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className="bg-gray-900/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700/50">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span>🔥</span>
        Sentiment Heatmap
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {coins.map((coin, index) => (
          <motion.div
            key={coin.symbol}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-gradient-to-br ${getColor(coin.vibe_score)} rounded-xl p-4 relative overflow-hidden`}
          >
            <div className={`relative z-10 ${getTextColor(coin.vibe_score)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg">{coin.symbol}</span>
                <span className="text-lg">{getSignalIcon(coin.signal)}</span>
              </div>
              
              <div className="text-2xl font-bold mb-1">
                {(coin.vibe_score * 100).toFixed(0)}
              </div>
              
              <div className="text-xs opacity-80">
                {coin.name}
              </div>
              
              <div className={`text-sm mt-2 ${coin.sentiment_change_24h >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                {coin.sentiment_change_24h >= 0 ? '↑' : '↓'} 
                {Math.abs(coin.sentiment_change_24h).toFixed(1)}%
              </div>
            </div>
            
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
