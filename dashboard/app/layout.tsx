import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { FloatingParticles, AmbientGlow, GridOverlay } from '@/components/ParticleEffects'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Tokenized Sentiment Oracle',
  description: 'Real-time crypto sentiment analysis with blockchain integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} animated-gradient min-h-screen`}>
        {/* Background effects */}
        <GridOverlay />
        <AmbientGlow />
        <FloatingParticles count={25} />
        
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}
