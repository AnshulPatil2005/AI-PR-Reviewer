import { ArrowRight, GitPullRequest } from 'lucide-react'
import PRMockup from './PRMockup'

const STATS = [
  { value: '2.4k+', label: 'PRs reviewed' },
  { value: '47%', label: 'Faster review' },
  { value: '99.2%', label: 'Uptime SLA' },
]

export default function Hero() {
  return (
    <section className="relative grid-bg overflow-hidden">
      {/* Radial glow blobs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '15%',
          left: '5%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(0,230,118,0.06) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '10%',
          right: '5%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(0,230,118,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: copy */}
          <div className="space-y-7 animate-fade-up">
            {/* Beta pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-dashed border-accent/30 bg-accent/5">
              <GitPullRequest size={11} className="text-accent" />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
                Public beta — free forever for OSS
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-[2.75rem] sm:text-[3.25rem] lg:text-[3.5rem] leading-[1.08] font-bold text-fog tracking-tight">
              Ship code you can{' '}
              <span className="text-accent text-glow">stand behind</span>
            </h1>

            {/* Sub */}
            <p className="text-base sm:text-lg text-fog-dim leading-relaxed max-w-xl">
              CodeLens AI reviews every pull request in seconds — catching security vulnerabilities,
              logic bugs, and performance issues before they reach your users.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <a
                href="#"
                className="clip-notch inline-flex items-center gap-2 bg-accent text-bg font-mono text-[11px] uppercase tracking-[0.14em] font-bold px-6 py-3 hover:shadow-glow transition-shadow"
              >
                Start reviewing free
                <ArrowRight size={13} />
              </a>
              <a
                href="#demo"
                className="clip-notch inline-flex items-center gap-2 border border-dashed border-accent/30 text-fog-dim font-mono text-[11px] uppercase tracking-[0.14em] px-6 py-3 hover:border-accent/50 hover:text-fog transition-all"
              >
                Watch demo
              </a>
            </div>

            {/* Stats row */}
            <div className="flex gap-8 pt-2">
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="font-mono text-2xl font-bold text-accent text-glow">{s.value}</div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-fog-muted mt-1">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: mockup */}
          <div className="lg:block animate-float">
            <PRMockup />
          </div>
        </div>
      </div>
    </section>
  )
}
