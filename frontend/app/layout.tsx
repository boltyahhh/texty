import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VoiceInsight AI - Conversational Emotion Analysis',
  description: 'Advanced conversational AI with real-time emotion analysis and intelligent responses',
  keywords: ['AI', 'conversation', 'emotion analysis', 'speech-to-text', 'sentiment analysis'],
  authors: [{ name: 'VoiceInsight Team' }],
  creator: 'VoiceInsight',
  publisher: 'VoiceInsight',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VoiceInsight AI',
  },
  openGraph: {
    type: 'website',
    siteName: 'VoiceInsight AI',
    title: 'VoiceInsight AI - Conversational Emotion Analysis',
    description: 'Advanced conversational AI with real-time emotion analysis and intelligent responses',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VoiceInsight AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VoiceInsight AI - Conversational Emotion Analysis',
    description: 'Advanced conversational AI with real-time emotion analysis and intelligent responses',
    images: ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3770a' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.className} h-full bg-gray-50 dark:bg-gray-900`}>
        <div className="min-h-full">
          {children}
        </div>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        <Analytics />
      </body>
    </html>
  )
}