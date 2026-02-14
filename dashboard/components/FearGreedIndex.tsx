'use client';

import { motion } from 'framer-motion';

interface FearGreedIndexProps {
  value: number; // 0-100
  mood: string;
}

export function FearGreedIndex({ value, mood }: FearGreedIndexProps) {
  // Determine color based on value
  const getColor = () => {
    if (value >= 75) return '#22c55e'; // Extreme Greed - Green
    if (value >= 55) return '#84cc16'; // Greed - Light Green
    if (value >= 45) return '#eab308'; // Neutral - Yellow
    if (value >= 25) return '#f97316'; // Fear - Orange
    return '#ef4444'; // Extreme Fear - Red
  };

  const getLabel = () => {
    if (value >= 75) return 'Extreme Greed';
    if (value >= 55) return 'Greed';
    if (value >= 45) return 'Neutral';
    if (value >= 25) return 'Fear';
    return 'Extreme Fear';
  };

  const getEmoji = () => {
    if (value >= 75) return '🤑';
    if (value >= 55) return '😊';
    if (value >= 45) return '😐';
    if (value >= 25) return '😰';
    return '😱';
  };

  // Calculate needle rotation (-90 to 90 degrees)
  const rotation = (value / 100) * 180 - 90;

  return (
    <div className="bg-gray-900/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700/50">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span>📊</span>
        Fear & Greed Index
      </h2>

      <div className="relative flex flex-col items-center">
        {/* Semi-circle gauge */}
        <div className="relative w-48 h-24 overflow-hidden">
          {/* Background gradient arc */}
          <div 
            className="absolute bottom-0 left-0 w-48 h-48 rounded-full"
            style={{
              background: 'conic-gradient(from 180deg, #ef4444 0deg, #f97316 45deg, #eab308 90deg, #84cc16 135deg, #22c55e 180deg, transparent 180deg)'
            }}
          />
          
          {/* Inner circle (mask) */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-36 bg-gray-900 rounded-full" />
          
          {/* Needle */}
          <motion.div
            className="absolute bottom-0 left-1/2 origin-bottom"
            initial={{ rotate: -90 }}
            animate={{ rotate: rotation }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            style={{ transformOrigin: 'bottom center' }}
          >
            <div 
              className="w-1 h-20 rounded-full"
              style={{ backgroundColor: getColor() }}
            />
            <div 
              className="w-3 h-3 rounded-full -ml-1 -mt-1"
              style={{ backgroundColor: getColor() }}
            />
          </motion.div>
        </div>

        {/* Value display */}
        <motion.div 
          className="text-center mt-4"
          key={value}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
        >
          <div className="text-5xl mb-2">{getEmoji()}</div>
          <div 
            className="text-4xl font-bold"
            style={{ color: getColor() }}
          >
            {value}
          </div>
          <div 
            className="text-lg font-semibold mt-1"
            style={{ color: getColor() }}
          >
            {getLabel()}
          </div>
          <div className="text-gray-400 text-sm mt-2">
            Market Mood: {mood}
          </div>
        </motion.div>

        {/* Scale labels */}
        <div className="flex justify-between w-full mt-4 text-xs text-gray-500">
          <span>Extreme Fear</span>
          <span>Neutral</span>
          <span>Extreme Greed</span>
        </div>
      </div>
    </div>
  );
}
