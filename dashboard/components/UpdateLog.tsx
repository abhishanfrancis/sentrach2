'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface UpdateEntry {
  id: number
  time: string
  vibeScore: number
  prevScore: number
  signal: string
}

interface UpdateLogProps {
  updates: UpdateEntry[]
  countdown: number
  maxUpdates?: number
}

export function UpdateLog({ updates, countdown, maxUpdates = 8 }: UpdateLogProps) {
  const recentUpdates = updates.slice(-maxUpdates).reverse()
  
  const getScoreColor = (score: number) => {
    if (score > 0.3) return 'text-green-400'
    if (score < -0.3) return 'text-red-400'
    return 'text-yellow-400'
  }
  
  const getChangeIndicator = (current: number, prev: number) => {
    const diff = current - prev
    if (Math.abs(diff) < 0.01) return { icon: '→', color: 'text-gray-400', label: 'No change' }
    if (diff > 0) return { icon: '↑', color: 'text-green-400', label: `+${(diff * 100).toFixed(1)}` }
    return { icon: '↓', color: 'text-red-400', label: `${(diff * 100).toFixed(1)}` }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h3 className="font-bold text-white">Live Update Log</h3>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">Next update in:</span>
          <span className={`font-mono font-bold ${countdown <= 5 ? 'text-yellow-400 animate-pulse' : 'text-cyan-400'}`}>
            {countdown}s
          </span>
        </div>
      </div>
      
      {/* Progress bar for next update */}
      <div className="h-1 bg-dark-600 rounded-full mb-4 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
          initial={{ width: '100%' }}
          animate={{ width: `${(countdown / 25) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {recentUpdates.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-2xl mb-2">⏳</div>
              <p>Waiting for first update...</p>
            </div>
          ) : (
            recentUpdates.map((update, index) => {
              const change = getChangeIndicator(update.vibeScore, update.prevScore)
              const isLatest = index === 0
              
              return (
                <motion.div
                  key={update.id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isLatest 
                      ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30' 
                      : 'bg-dark-600/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Update number badge */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isLatest ? 'bg-purple-500 text-white' : 'bg-dark-500 text-gray-400'
                    }`}>
                      #{update.id}
                    </div>
                    
                    {/* Time */}
                    <div className="flex flex-col">
                      <span className={`text-sm ${isLatest ? 'text-white font-semibold' : 'text-gray-300'}`}>
                        {update.time}
                      </span>
                      {isLatest && (
                        <span className="text-xs text-cyan-400">Latest</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Signal badge */}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      update.signal === 'BULLISH_SIGNAL' 
                        ? 'bg-green-500/20 text-green-400'
                        : update.signal === 'BEARISH_SIGNAL'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {update.signal === 'BULLISH_SIGNAL' ? '🐂 BULL' : 
                       update.signal === 'BEARISH_SIGNAL' ? '🐻 BEAR' : '😐 NEUTRAL'}
                    </span>
                    
                    {/* Score with change */}
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold ${getScoreColor(update.vibeScore)}`}>
                        {(update.vibeScore * 100).toFixed(0)}
                      </span>
                      <span className={`text-sm ${change.color}`}>
                        {change.icon} {change.label}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>
      
      {/* Summary stats */}
      {recentUpdates.length > 0 && (
        <div className="mt-4 pt-4 border-t border-dark-500 grid grid-cols-3 gap-4 text-center">
          <div>
            <span className="text-xs text-gray-500 block">Updates</span>
            <span className="text-lg font-bold text-white">{updates.length}</span>
          </div>
          <div>
            <span className="text-xs text-gray-500 block">Avg Score</span>
            <span className={`text-lg font-bold ${getScoreColor(
              updates.reduce((a, b) => a + b.vibeScore, 0) / updates.length
            )}`}>
              {((updates.reduce((a, b) => a + b.vibeScore, 0) / updates.length) * 100).toFixed(0)}
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-500 block">Latest</span>
            <span className="text-lg font-bold text-cyan-400">
              {recentUpdates[0]?.time.split(':').slice(0, 2).join(':')}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
