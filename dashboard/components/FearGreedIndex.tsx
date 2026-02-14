'use client';

import { motion } from 'framer-motion';

interface FearGreedIndexProps {
  value: number; // 0-100
  mood: string;
}

export function FearGreedIndex({ value, mood }: FearGreedIndexProps) {
  // Clamp value between 0-100
  const clampedValue = Math.max(0, Math.min(100, value));
  
  // Determine color based on value
  const getColor = () => {
    if (clampedValue >= 75) return '#22c55e'; // Extreme Greed - Green
    if (clampedValue >= 55) return '#84cc16'; // Greed - Light Green
    if (clampedValue >= 45) return '#eab308'; // Neutral - Yellow
    if (clampedValue >= 25) return '#f97316'; // Fear - Orange
    return '#ef4444'; // Extreme Fear - Red
  };

  const getLabel = () => {
    if (clampedValue >= 75) return 'Extreme Greed';
    if (clampedValue >= 55) return 'Greed';
    if (clampedValue >= 45) return 'Neutral';
    if (clampedValue >= 25) return 'Fear';
    return 'Extreme Fear';
  };

  const getEmoji = () => {
    if (clampedValue >= 75) return '🤑';
    if (clampedValue >= 55) return '😊';
    if (clampedValue >= 45) return '😐';
    if (clampedValue >= 25) return '😰';
    return '😱';
  };

  // Calculate needle rotation (-90 to 90 degrees)
  const rotation = (clampedValue / 100) * 180 - 90;

  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
      {/* Background glow based on sentiment */}
      <div 
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30"
        style={{ backgroundColor: getColor() }}
      />
      
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 relative z-10">
        <span className="text-2xl">📊</span>
        Fear & Greed Index
      </h2>

      <div className="relative flex flex-col items-center">
        {/* Semi-circle gauge */}
        <div className="relative w-56 h-28 overflow-hidden">
          {/* Background gradient arc using SVG for better rendering */}
          <svg viewBox="0 0 200 100" className="w-full h-full">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="25%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="75%" stopColor="#84cc16" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            {/* Outer arc */}
            <path
              d="M 10 100 A 90 90 0 0 1 190 100"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* Inner arc background */}
            <path
              d="M 30 100 A 70 70 0 0 1 170 100"
              fill="none"
              stroke="rgba(0,0,0,0.3)"
              strokeWidth="8"
            />
          </svg>
          
          {/* Needle */}
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 origin-bottom"
            initial={{ rotate: -90 }}
            animate={{ rotate: rotation }}
            transition={{ type: 'spring', stiffness: 60, damping: 15 }}
          >
            <div 
              className="w-1.5 h-24 rounded-full shadow-lg"
              style={{ 
                backgroundColor: getColor(),
                boxShadow: `0 0 10px ${getColor()}`
              }}
            />
            <div 
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full shadow-lg"
              style={{ 
                backgroundColor: getColor(),
                boxShadow: `0 0 15px ${getColor()}`
              }}
            />
          </motion.div>
          
          {/* Center cap */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-600" />
        </div>

        {/* Value display */}
        <motion.div 
          className="text-center mt-6"
          key={clampedValue}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 100 }}
        >
          <motion.div 
            className="text-5xl mb-2"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {getEmoji()}
          </motion.div>
          <div 
            className="text-5xl font-bold"
            style={{ 
              color: getColor(),
              textShadow: `0 0 20px ${getColor()}40`
            }}
          >
            {clampedValue}
          </div>
          <div 
            className="text-lg font-semibold mt-1"
            style={{ color: getColor() }}
          >
            {getLabel()}
          </div>
          <div className="text-slate-400 text-sm mt-2 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: getColor() }} />
            Market Mood: <span className="font-medium text-white">{mood}</span>
          </div>
        </motion.div>

        {/* Scale labels */}
        <div className="flex justify-between w-full mt-6 text-xs">
          <span className="text-red-400 font-medium">😱 Extreme Fear</span>
          <span className="text-yellow-400 font-medium">😐 Neutral</span>
          <span className="text-green-400 font-medium">Extreme Greed 🤑</span>
        </div>
      </div>
    </div>
  );
}
