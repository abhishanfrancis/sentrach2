'use client';

import { motion } from 'framer-motion';

interface Prediction {
  predicted_score: number;
  confidence: number;
  direction: string;
  time_horizon: string;
  momentum: number;
  volatility: number;
}

interface Indicators {
  short_ema: number;
  long_ema: number;
  momentum: number;
  volatility: number;
  rsi: number;
  signal: string;
  trend: string;
  support: number;
  resistance: number;
}

interface PredictionCardProps {
  predictions: {
    '1h': Prediction;
    '6h': Prediction;
    '24h': Prediction;
  };
  indicators: Indicators;
  currentScore: number;
}

export function PredictionCard({ predictions, indicators, currentScore }: PredictionCardProps) {
  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'UP':
        return '📈';
      case 'DOWN':
        return '📉';
      default:
        return '➡️';
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'UP':
        return 'text-green-400';
      case 'DOWN':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'STRONG_BUY':
        return 'bg-green-500 text-white';
      case 'BUY':
        return 'bg-green-400/30 text-green-400';
      case 'STRONG_SELL':
        return 'bg-red-500 text-white';
      case 'SELL':
        return 'bg-red-400/30 text-red-400';
      default:
        return 'bg-gray-500/30 text-gray-400';
    }
  };

  const getRSIColor = (rsi: number) => {
    if (rsi >= 70) return 'text-red-400'; // Overbought
    if (rsi <= 30) return 'text-green-400'; // Oversold
    return 'text-yellow-400';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'bg-green-500';
    if (confidence >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-gray-900/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>🔮</span>
          Sentiment Prediction
        </h2>
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getSignalColor(indicators.signal)}`}>
          {indicators.signal.replace('_', ' ')}
        </span>
      </div>

      {/* Current Score */}
      <div className="text-center mb-6">
        <div className="text-sm text-gray-400 mb-1">Current Sentiment</div>
        <div className="text-4xl font-bold text-white">
          {(currentScore * 100).toFixed(0)}
        </div>
      </div>

      {/* Prediction Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(['1h', '6h', '24h'] as const).map(horizon => {
          const pred = predictions[horizon];
          return (
            <motion.div
              key={horizon}
              className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30"
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-sm text-gray-400 mb-2">{horizon} Forecast</div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getDirectionIcon(pred.direction)}</span>
                <span className={`text-2xl font-bold ${getDirectionColor(pred.direction)}`}>
                  {pred.predicted_score > 0 ? '+' : ''}{(pred.predicted_score * 100).toFixed(0)}
                </span>
              </div>
              
              {/* Confidence bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Confidence</span>
                  <span>{pred.confidence.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${getConfidenceColor(pred.confidence)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pred.confidence}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
              
              <div className={`text-sm ${getDirectionColor(pred.direction)}`}>
                {pred.direction}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Technical Indicators */}
      <div className="border-t border-gray-700/50 pt-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">Technical Indicators</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* RSI */}
          <div className="bg-gray-800/30 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">RSI</div>
            <div className={`text-lg font-bold ${getRSIColor(indicators.rsi)}`}>
              {indicators.rsi.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">
              {indicators.rsi >= 70 ? 'Overbought' : indicators.rsi <= 30 ? 'Oversold' : 'Neutral'}
            </div>
          </div>

          {/* Momentum */}
          <div className="bg-gray-800/30 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Momentum</div>
            <div className={`text-lg font-bold ${indicators.momentum >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {indicators.momentum >= 0 ? '+' : ''}{(indicators.momentum * 100).toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">{indicators.trend}</div>
          </div>

          {/* Volatility */}
          <div className="bg-gray-800/30 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Volatility</div>
            <div className="text-lg font-bold text-yellow-400">
              {(indicators.volatility * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">
              {indicators.volatility > 0.3 ? 'High' : indicators.volatility > 0.15 ? 'Medium' : 'Low'}
            </div>
          </div>

          {/* EMA Crossover */}
          <div className="bg-gray-800/30 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">EMA Signal</div>
            <div className={`text-lg font-bold ${indicators.short_ema > indicators.long_ema ? 'text-green-400' : 'text-red-400'}`}>
              {indicators.short_ema > indicators.long_ema ? '↑ Bullish' : '↓ Bearish'}
            </div>
            <div className="text-xs text-gray-500">
              {(indicators.short_ema * 100).toFixed(1)} / {(indicators.long_ema * 100).toFixed(1)}
            </div>
          </div>
        </div>

        {/* Support/Resistance */}
        <div className="mt-3 flex justify-between text-sm">
          <span className="text-green-400">
            Support: {(indicators.support * 100).toFixed(0)}
          </span>
          <span className="text-red-400">
            Resistance: {(indicators.resistance * 100).toFixed(0)}
          </span>
        </div>
      </div>
    </div>
  );
}
