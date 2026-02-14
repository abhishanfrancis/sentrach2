'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts'
import { motion } from 'framer-motion'

interface TrendChartProps {
  data: Array<{ time: string; score: number }>
}

export default function TrendChart({ data }: TrendChartProps) {
  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold text-gray-300 mb-4">Sentiment Timeline</h2>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
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
                backgroundColor: '#1a1a25',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '8px',
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.2)',
              }}
              labelStyle={{ color: '#888' }}
              itemStyle={{ color: '#a855f7' }}
              formatter={(value: number) => [value.toFixed(3), 'Score']}
            />
            
            <ReferenceLine y={0} stroke="#444" strokeDasharray="3 3" />
            
            <Area
              type="monotone"
              dataKey="score"
              stroke="transparent"
              fill="url(#colorScore)"
            />
            
            <Line
              type="monotone"
              dataKey="score"
              stroke="#a855f7"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 6,
                fill: '#a855f7',
                stroke: '#fff',
                strokeWidth: 2,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex justify-between text-xs text-gray-500 mt-4">
        <span>← Bearish</span>
        <span>Neutral</span>
        <span>Bullish →</span>
      </div>
    </div>
  )
}
