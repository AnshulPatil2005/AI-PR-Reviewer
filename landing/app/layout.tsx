import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CodeLens AI — AI-Powered Code Review',
  description:
    'Catch security vulnerabilities, logic errors, and performance issues in every pull request — before they reach production.',
  keywords: ['code review', 'AI', 'pull request', 'static analysis', 'security'],
  openGraph: {
    title: 'CodeLens AI — AI-Powered Code Review',
    description: 'Ship with confidence. AI reviews every PR in seconds.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');
          :root { --font-mono: 'JetBrains Mono', monospace; }
        `}</style>
      </head>
      <body className="bg-bg text-fog antialiased">{children}</body>
    </html>
  )
}
