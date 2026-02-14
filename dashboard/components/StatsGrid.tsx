'use client'

import { motion } from 'framer-motion'
import { BarChart3, Users, Gauge, Clock } from 'lucide-react'

interface StatsGridProps {
  confidence: number
  volumeIndex: number
  postCount: number
}

export default function StatsGrid({ confidence, volumeIndex, postCount }: StatsGridProps) {
  const stats = [
    {
      label: 'Confidence',
      value: `${confidence.toFixed(0)}%`,
      icon: Gauge,
      color: 'neon-purple',
    },
    {
      label: 'Volume',
      value: `${volumeIndex.toFixed(1)}x`,
      icon: BarChart3,
      color: 'neon-cyan',
    },
    {
      label: 'Posts',
      value: postCount.toString(),
      icon: Users,
      color: 'neon-green',
    },
    {
      label: 'Latency',
      value: '2s',
      icon: Clock,
      color: 'neon-orange',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          className="glass-card p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${stat.color}/10`}>
              <stat.icon className={`w-5 h-5 text-${stat.color}`} />
            </div>
            <div>
              <div className="text-xs text-gray-500">{stat.label}</div>
              <motion.div
                className="text-xl font-bold text-white"
                key={stat.value}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
              >
                {stat.value}
              </motion.div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
