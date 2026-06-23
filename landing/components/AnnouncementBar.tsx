'use client'

import { useState } from 'react'
import { X, Zap } from 'lucide-react'

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true)
  if (!visible) return null

  return (
    <div className="relative z-50 bg-accent/8 border-b border-dashed border-accent/20 py-2 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2.5">
        <Zap size={11} className="text-accent flex-shrink-0" />
        <p className="font-mono text-[11px] uppercase tracking-widest text-fog-dim">
          Multi-file context analysis is now live —
        </p>
        <a
          href="#features"
          className="font-mono text-[11px] uppercase tracking-widest text-accent hover:underline underline-offset-2 flex-shrink-0"
        >
          See what&apos;s new →
        </a>
        <button
          onClick={() => setVisible(false)}
          aria-label="Dismiss"
          className="absolute right-4 text-fog-muted hover:text-fog transition-colors p-1"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  )
}
