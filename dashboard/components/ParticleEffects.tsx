'use client'

import { useEffect, useState, useMemo } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  color: string
  duration: number
  delay: number
  opacity: number
}

export function FloatingParticles({ count = 30 }: { count?: number }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const particles = useMemo(() => {
    const colors = [
      'rgba(168, 85, 247, 0.6)',  // purple
      'rgba(34, 211, 238, 0.5)',   // cyan
      'rgba(34, 197, 94, 0.4)',    // green
      'rgba(249, 115, 22, 0.4)',   // orange
    ]
    
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: Math.random() * 20 + 20,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.5 + 0.2,
    }))
  }, [count])
  
  if (!mounted) return null

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            background: particle.color,
            opacity: particle.opacity,
            filter: `blur(${particle.size > 3 ? 1 : 0}px)`,
            animation: `floatParticle${particle.id % 3} ${particle.duration}s ease-in-out infinite`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes floatParticle0 {
          0%, 100% { 
            transform: translate(0, 0) scale(1); 
            opacity: 0.2;
          }
          25% { 
            transform: translate(50px, -80px) scale(1.2); 
            opacity: 0.5;
          }
          50% { 
            transform: translate(-30px, -150px) scale(0.8); 
            opacity: 0.3;
          }
          75% { 
            transform: translate(80px, -100px) scale(1.1); 
            opacity: 0.4;
          }
        }
        @keyframes floatParticle1 {
          0%, 100% { 
            transform: translate(0, 0) scale(1); 
            opacity: 0.3;
          }
          33% { 
            transform: translate(-60px, -120px) scale(1.3); 
            opacity: 0.6;
          }
          66% { 
            transform: translate(40px, -200px) scale(0.9); 
            opacity: 0.4;
          }
        }
        @keyframes floatParticle2 {
          0%, 100% { 
            transform: translate(0, 0) scale(1); 
            opacity: 0.25;
          }
          50% { 
            transform: translate(100px, -180px) scale(1.4); 
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}

export function GridOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 opacity-30">
      <div 
        className="w-full h-full"
        style={{
          backgroundImage: `
            linear-gradient(rgba(168, 85, 247, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168, 85, 247, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  )
}

export function AmbientGlow() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Top left glow */}
      <div 
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
          animation: 'ambientPulse1 8s ease-in-out infinite',
        }}
      />
      {/* Bottom right glow */}
      <div 
        className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.12) 0%, transparent 70%)',
          animation: 'ambientPulse2 10s ease-in-out infinite',
        }}
      />
      {/* Center accent */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(ellipse, rgba(168, 85, 247, 0.05) 0%, transparent 60%)',
          animation: 'ambientPulse3 12s ease-in-out infinite',
        }}
      />
      <style jsx>{`
        @keyframes ambientPulse1 {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        @keyframes ambientPulse2 {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.15); }
        }
        @keyframes ambientPulse3 {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.2); }
        }
      `}</style>
    </div>
  )
}
