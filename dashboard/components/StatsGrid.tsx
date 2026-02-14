'use client'

import { motion } from 'framer-motion'
import { BarChart3, Users, Gauge, Clock, TrendingUp } from 'lucide-react'

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
      color: 'purple',
      gradient: 'from-purple-500/20 to-purple-600/10',
      iconColor: 'text-purple-400',
    },
    {
      label: 'Volume',
      value: `${volumeIndex.toFixed(1)}x`,
      icon: BarChart3,
      color: 'cyan',
      gradient: 'from-cyan-500/20 to-cyan-600/10',
      iconColor: 'text-cyan-400',
    },
    {
      label: 'Posts',
      value: postCount.toString(),
      icon: Users,
      color: 'green',
      gradient: 'from-green-500/20 to-green-600/10',
      iconColor: 'text-green-400',
    },
    {
      label: 'Update',
      value: '25s',
      icon: Clock,
      color: 'orange',
      gradient: 'from-orange-500/20 to-orange-600/10',
      iconColor: 'text-orange-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          className="glass-card p-4 relative overflow-hidden group cursor-default"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        >
          {/* Hover glow effect */}
          <div 
            className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
          />
          
          {/* Animated corner accent */}
          <div 
            className={`absolute top-0 right-0 w-16 h-16 bg-${stat.color}-500/10 rounded-full blur-2xl transform translate-x-4 -translate-y-4 group-hover:scale-150 transition-transform duration-500`}
          />
          
          <div className="flex items-center gap-3 relative z-10">
            <motion.div 
              className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} border border-white/5`}
              whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
            >
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </motion.div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
              <motion.div
                className="text-xl font-bold text-white"
                key={stat.value}
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
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
