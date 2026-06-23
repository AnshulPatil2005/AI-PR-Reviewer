'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Demo', href: '#demo' },
  { label: 'Integrations', href: '#integrations' },
  { label: 'Pricing', href: '#pricing' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-40 border-b border-dashed border-border bg-bg/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <a href="/" className="flex items-center gap-1.5 group">
            <span className="font-mono font-bold text-[17px] text-accent group-hover:text-glow transition-all">
              CodeLens
            </span>
            <span className="font-mono font-light text-[17px] text-fog-dim">AI</span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-fog-muted hover:text-fog transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="#"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-fog-muted hover:text-fog transition-colors"
            >
              Sign in
            </a>
            <a
              href="#"
              className="clip-notch-sm bg-accent text-bg font-mono text-[10px] uppercase tracking-[0.14em] font-semibold px-4 py-2 hover:shadow-glow-sm transition-shadow"
            >
              Get started
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-fog-dim hover:text-fog transition-colors p-1"
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-dashed border-border bg-surface">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block font-mono text-[11px] uppercase tracking-[0.14em] text-fog-muted hover:text-fog py-2 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <a href="#" className="font-mono text-[11px] uppercase tracking-[0.14em] text-fog-muted py-2">
                Sign in
              </a>
              <a
                href="#"
                className="clip-notch-sm bg-accent text-bg font-mono text-[11px] uppercase tracking-[0.14em] font-semibold px-4 py-2.5 text-center"
              >
                Get started
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
