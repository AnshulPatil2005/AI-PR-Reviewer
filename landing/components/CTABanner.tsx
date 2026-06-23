import { ArrowRight, Terminal } from 'lucide-react'

export default function CTABanner() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(0,230,118,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-12 h-12 border border-dashed border-accent/30 mb-8">
          <Terminal size={20} className="text-accent" />
        </div>

        <h2 className="text-3xl sm:text-[2.75rem] font-bold text-fog leading-tight mb-5">
          Ready to review with confidence?
        </h2>
        <p className="text-fog-dim text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto">
          Set up in under 2 minutes. No credit card required. Start with 10 free PR analyses every month.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="#"
            className="clip-notch inline-flex items-center gap-2 bg-accent text-bg font-mono text-[11px] uppercase tracking-[0.14em] font-bold px-7 py-3.5 hover:shadow-glow transition-shadow w-full sm:w-auto justify-center"
          >
            Connect GitHub free
            <ArrowRight size={13} />
          </a>
          <a
            href="#how-it-works"
            className="clip-notch inline-flex items-center gap-2 border border-dashed border-accent/30 text-fog-dim font-mono text-[11px] uppercase tracking-[0.14em] px-7 py-3.5 hover:border-accent/50 hover:text-fog transition-all w-full sm:w-auto justify-center"
          >
            Read docs
          </a>
        </div>

        {/* Trust note */}
        <p className="font-mono text-[10px] uppercase tracking-widest text-fog-muted mt-8">
          SOC 2 Type II · Your code is never used for training · Ephemeral processing
        </p>
      </div>
    </section>
  )
}
