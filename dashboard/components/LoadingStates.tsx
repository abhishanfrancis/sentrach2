'use client'

import { motion } from 'framer-motion'

// Loading skeleton components for premium loading states

export function SkeletonPulse({ className = '' }: { className?: string }) {
  return (
    <div className={`skeleton ${className}`} />
  )
}

export function GaugeSkeleton() {
  return (
    <div className="glass-card p-6 h-full animate-pulse">
      <div className="skeleton h-6 w-40 mb-6" />
      <div className="relative w-full aspect-[2/1] mb-6">
        <div className="skeleton w-full h-full rounded-full" />
      </div>
      <div className="text-center space-y-3">
        <div className="skeleton h-16 w-32 mx-auto" />
        <div className="skeleton h-6 w-24 mx-auto" />
        <div className="skeleton h-8 w-28 mx-auto rounded-full" />
      </div>
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="glass-card p-6 h-full animate-pulse">
      <div className="skeleton h-6 w-32 mb-4" />
      <div className="h-[250px] flex items-end gap-1 px-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div 
            key={i} 
            className="skeleton flex-1" 
            style={{ height: `${Math.random() * 60 + 20}%` }}
          />
        ))}
      </div>
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-card p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="skeleton w-10 h-10 rounded-lg" />
            <div className="flex-1">
              <div className="skeleton h-4 w-16 mb-2" />
              <div className="skeleton h-6 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function FeedSkeleton() {
  return (
    <div className="glass-card p-4 h-full animate-pulse">
      <div className="skeleton h-6 w-24 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-3 rounded-lg bg-white/5">
            <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardSkeleton({ height = 'h-40' }: { height?: string }) {
  return (
    <div className={`glass-card p-4 animate-pulse ${height}`}>
      <div className="skeleton h-5 w-32 mb-4" />
      <div className="skeleton h-4 w-full mb-2" />
      <div className="skeleton h-4 w-3/4" />
    </div>
  )
}

// Premium loading spinner
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }
  
  return (
    <div className={`${sizeClasses[size]} relative`}>
      <div className="absolute inset-0 rounded-full border-2 border-purple-500/20" />
      <div 
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500"
        style={{ animation: 'spin 1s linear infinite' }}
      />
      <div 
        className="absolute inset-1 rounded-full border-2 border-transparent border-t-cyan-400"
        style={{ animation: 'spin 1.5s linear infinite reverse' }}
      />
    </div>
  )
}

// Full page loading screen
export function LoadingScreen() {
  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          {/* Outer ring */}
          <div 
            className="absolute inset-0 rounded-full border-2 border-purple-500/30"
            style={{ animation: 'pulse 2s ease-in-out infinite' }}
          />
          {/* Spinning ring */}
          <div 
            className="absolute inset-0 rounded-full border-2 border-t-purple-500 border-r-transparent border-b-cyan-400 border-l-transparent"
            style={{ animation: 'spin 1.5s linear infinite' }}
          />
          {/* Inner glow */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 animate-pulse" />
        </div>
        <motion.p 
          className="text-gray-400 text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading Sentiment Data...
        </motion.p>
      </div>
    </motion.div>
  )
}

// Data refresh indicator
export function RefreshIndicator({ isRefreshing }: { isRefreshing: boolean }) {
  if (!isRefreshing) return null
  
  return (
    <motion.div 
      className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 backdrop-blur-sm"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <LoadingSpinner size="sm" />
      <span className="text-sm text-purple-200">Updating...</span>
    </motion.div>
  )
}
