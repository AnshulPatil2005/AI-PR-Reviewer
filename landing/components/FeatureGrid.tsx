import { Shield, Bug, Zap, Brain, Code2, BarChart2 } from 'lucide-react'

const FEATURES = [
  {
    icon: Shield,
    title: 'Security scanning',
    desc: 'Detects injection vectors, exposed secrets, insecure dependencies, and auth bypass patterns across every changed file.',
    tag: 'Security',
  },
  {
    icon: Bug,
    title: 'Logic & edge case analysis',
    desc: 'Catches null dereferences, off-by-ones, missing error branches, and async race conditions before QA does.',
    tag: 'Correctness',
  },
  {
    icon: Zap,
    title: 'Performance profiling',
    desc: 'Flags N+1 queries, unnecessary re-renders, unbounded loops, and memory-leak patterns in hot paths.',
    tag: 'Performance',
  },
  {
    icon: Brain,
    title: 'Codebase context',
    desc: 'Analyzes changes in the context of the surrounding file, not just the diff — reducing false positives by 60%.',
    tag: 'Intelligence',
  },
  {
    icon: Code2,
    title: 'Multi-language support',
    desc: 'Python, TypeScript, Go, Rust, Java, Ruby, C++, and more. Language-specific heuristics for each.',
    tag: 'Coverage',
  },
  {
    icon: BarChart2,
    title: 'Risk trend analytics',
    desc: 'Track code quality over time. Spot which files consistently introduce risk and which contributors need support.',
    tag: 'Analytics',
  },
]

export default function FeatureGrid() {
  return (
    <section id="features" className="py-24 border-b border-dashed border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-xl mb-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-3">
            Features
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-fog">
            Everything your team needs to review confidently
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="p-6 border border-dashed border-border hover:border-accent/25 hover:bg-surface/50 transition-all group cursor-default"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 flex items-center justify-center border border-dashed border-border group-hover:border-accent/40 transition-colors">
                    <Icon size={16} className="text-accent" />
                  </div>
                  <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-fog-muted border border-dashed border-border px-1.5 py-0.5">
                    {f.tag}
                  </span>
                </div>
                <h3 className="font-semibold text-fog text-[15px] mb-2">{f.title}</h3>
                <p className="text-fog-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
