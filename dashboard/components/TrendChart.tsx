'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts'
import { motion } from 'framer-motion'
import { TrendingUp, BarChart2 } from 'lucide-react'

interface TrendChartProps {
  data: Array<{ time: string; score: number }>
}

export default function TrendChart({ data }: TrendChartProps) {
  // Calculate trend
  const latestScore = data.length > 0 ? data[data.length - 1].score : 0
  const prevScore = data.length > 1 ? data[data.length - 2].score : 0
  const trendDirection = latestScore > prevScore ? 'up' : latestScore < prevScore ? 'down' : 'stable'
  
  return (
    <motion.div 
      className="glass-card p-6 relative overflow-hidden group"
      whileHover={{ borderColor: 'rgba(168, 85, 247, 0.3)' }}
    >
      {/* Data stream effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" 
          style={{ animation: 'dataFlow 3s linear infinite' }} 
        />
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-gray-300">Sentiment Timeline</h2>
        </div>
        <div className={`flex items-center gap-1 text-sm px-2 py-1 rounded-lg ${
          trendDirection === 'up' ? 'bg-green-500/10 text-green-400' :
          trendDirection === 'down' ? 'bg-red-500/10 text-red-400' :
          'bg-gray-500/10 text-gray-400'
        }`}>
          <TrendingUp className={`w-3 h-3 ${trendDirection === 'down' ? 'rotate-180' : ''}`} />
          <span className="text-xs font-medium">{latestScore >= 0 ? '+' : ''}{latestScore.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                <stop offset="50%" stopColor="#22d3ee" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
              <filter id="chartGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <XAxis 
              dataKey="time" 
              stroke="#444"
              tick={{ fontSize: 10, fill: '#666' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              domain={[-1, 1]} 
              stroke="#444"
              tick={{ fontSize: 10, fill: '#666' }}
              tickLine={false}
              axisLine={false}
              ticks={[-1, -0.5, 0, 0.5, 1]}
            />
            
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 15, 25, 0.95)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                borderRadius: '12px',
                boxShadow: '0 0 30px rgba(168, 85, 247, 0.3)',
                backdropFilter: 'blur(10px)',
              }}
              labelStyle={{ color: '#888', fontSize: 11 }}
              itemStyle={{ color: '#a855f7', fontWeight: 600 }}
              formatter={(value: number) => [value.toFixed(3), 'Vibe Score']}
            />
            
            <ReferenceLine y={0} stroke="#333" strokeDasharray="4 4" strokeOpacity={0.5} />
            <ReferenceLine y={0.5} stroke="#22c55e" strokeDasharray="2 4" strokeOpacity={0.2} />
            <ReferenceLine y={-0.5} stroke="#ef4444" strokeDasharray="2 4" strokeOpacity={0.2} />
            
            <Area
              type="monotone"
              dataKey="score"
              stroke="transparent"
              fill="url(#colorScore)"
              isAnimationActive={true}
              animationDuration={500}
            />
            
            <Line
              type="monotone"
              dataKey="score"
              stroke="url(#lineGradient)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 6,
                fill: '#a855f7',
                stroke: '#fff',
                strokeWidth: 2,
                filter: 'url(#chartGlow)',
              }}
              isAnimationActive={true}
              animationDuration={500}
              style={{ filter: 'drop-shadow(0 0 6px rgba(168, 85, 247, 0.5))' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex justify-between text-xs mt-4">
        <span className="text-red-400/70 flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          Bearish
        </span>
        <span className="text-gray-500">Neutral Zone</span>
        <span className="text-green-400/70 flex items-center gap-1">
          Bullish
          <div className="w-2 h-2 rounded-full bg-green-400" />
        </span>
      </div>
    </motion.div>
  )
}
