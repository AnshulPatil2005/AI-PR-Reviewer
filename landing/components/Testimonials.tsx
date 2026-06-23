const TESTIMONIALS = [
  {
    quote:
      'We caught a SQL injection in a migration script 20 minutes before it would have shipped. CodeLens flagged it as HIGH severity with the exact line. That alone paid for itself.',
    name: 'Priya Mehta',
    role: 'Staff Engineer',
    company: 'Vortex IO',
    avatar: 'PM',
  },
  {
    quote:
      'Our junior devs now ship PRs I would actually approve without reading every line. The structured feedback teaches patterns, not just catches mistakes.',
    name: 'Marcus Chen',
    role: 'Engineering Manager',
    company: 'NexusLabs',
    avatar: 'MC',
  },
  {
    quote:
      'We were skeptical about AI code review. Then it found a race condition in our payment service that three senior engineers missed in sync review. We\'re not skeptical anymore.',
    name: 'Sarah O\'Brien',
    role: 'Lead Backend Engineer',
    company: 'Orbital',
    avatar: 'SO',
  },
]

export default function Testimonials() {
  return (
    <section className="py-24 border-b border-dashed border-border bg-surface/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mb-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-3">
            Testimonials
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-fog">
            Engineers who ship faster
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="p-6 border border-dashed border-border hover:border-accent/25 transition-colors group flex flex-col"
            >
              {/* Quote mark */}
              <span className="font-mono text-4xl text-accent/30 leading-none mb-4 select-none">
                &ldquo;
              </span>

              <p className="text-fog-dim text-sm leading-relaxed flex-1 mb-6">{t.quote}</p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-dashed border-border">
                <div className="w-8 h-8 flex items-center justify-center bg-accent/10 border border-dashed border-accent/20">
                  <span className="font-mono text-[9px] font-bold text-accent">{t.avatar}</span>
                </div>
                <div>
                  <div className="font-mono text-[12px] font-semibold text-fog">{t.name}</div>
                  <div className="font-mono text-[10px] text-fog-muted">
                    {t.role} · {t.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
