import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

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
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-purple/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-cyan/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}
