import { Github, GitPullRequest, Cpu, CheckCircle } from 'lucide-react'

const STEPS = [
  {
    icon: Github,
    step: '01',
    title: 'Connect your repo',
    desc: 'Authorize CodeLens AI on GitHub, GitLab, or Bitbucket in one click. No webhook configuration needed.',
  },
  {
    icon: GitPullRequest,
    step: '02',
    title: 'Open a pull request',
    desc: 'Work exactly as you do today. CodeLens AI automatically picks up every PR the moment it\'s created.',
  },
  {
    icon: Cpu,
    step: '03',
    title: 'AI reviews in seconds',
    desc: 'Our pipeline parses diffs, runs heuristic checks, then sends critical files to an LLM review chain — not the whole codebase.',
  },
  {
    icon: CheckCircle,
    step: '04',
    title: 'Merge with confidence',
    desc: 'Review structured feedback with severity levels, file-level context, and actionable suggestions directly in your PR.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 border-b border-dashed border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-xl mb-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-3">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-fog">
            From push to review in under 30 seconds
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <div
                key={step.step}
                className="relative p-6 border border-dashed border-border hover:border-accent/30 transition-colors group"
              >
                {/* Connector line on large screens */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-10 right-0 w-px h-8 border-r border-dashed border-accent/20" />
                )}

                {/* Step number */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 flex items-center justify-center border border-dashed border-accent/30 group-hover:border-accent/60 transition-colors">
                    <Icon size={14} className="text-accent" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog-muted">
                    Step {step.step}
                  </span>
                </div>

                <h3 className="font-semibold text-fog text-[15px] mb-2">{step.title}</h3>
                <p className="text-fog-muted text-sm leading-relaxed">{step.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
