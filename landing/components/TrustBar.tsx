const COMPANIES = ['Acme Corp', 'NexusLabs', 'Vortex IO', 'Quantum Dev', 'Orbital', 'Synapse Co']

export default function TrustBar() {
  return (
    <section className="border-y border-dashed border-border py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-fog-muted text-center mb-6">
          Trusted by engineers at
        </p>
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-4">
          {COMPANIES.map((name) => (
            <span
              key={name}
              className="font-mono text-xs text-fog-muted/60 uppercase tracking-widest hover:text-fog-muted transition-colors cursor-default"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
