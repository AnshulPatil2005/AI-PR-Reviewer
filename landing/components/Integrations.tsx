import { Github, Slack, MessageSquare } from 'lucide-react'

// Using Lucide for some; text-based for the rest
const INTEGRATIONS = [
  { name: 'GitHub', icon: 'github', desc: 'PR comments, status checks, webhooks' },
  { name: 'GitLab', icon: 'gitlab', desc: 'Merge request integration, CI/CD hooks' },
  { name: 'Bitbucket', icon: 'bitbucket', desc: 'Pull request comments, pipelines' },
  { name: 'Slack', icon: 'slack', desc: 'Review summaries delivered to channels' },
  { name: 'Jira', icon: 'jira', desc: 'Auto-link issues, update story status' },
  { name: 'Linear', icon: 'linear', desc: 'Sync PR feedback to Linear issues' },
  { name: 'VS Code', icon: 'vscode', desc: 'View reviews directly in your editor' },
  { name: 'Discord', icon: 'discord', desc: 'Team notifications for high-severity issues' },
]

function IntegrationIcon({ name }: { name: string }) {
  if (name === 'GitHub') return <Github size={22} />
  if (name === 'Slack') return <Slack size={22} />
  if (name === 'Discord') return <MessageSquare size={22} />
  // Text-based logo for others
  const abbrevs: Record<string, string> = {
    GitLab: 'GL',
    Bitbucket: 'BB',
    Jira: 'JR',
    Linear: 'LN',
    'VS Code': 'VS',
  }
  return (
    <span className="font-mono text-xs font-bold text-fog-dim">
      {abbrevs[name] ?? name.slice(0, 2).toUpperCase()}
    </span>
  )
}

export default function Integrations() {
  return (
    <section id="integrations" className="py-24 border-b border-dashed border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mb-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-3">
            Integrations
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-fog">
            Fits your stack without friction
          </h2>
          <p className="text-fog-dim text-base leading-relaxed mt-4">
            CodeLens AI connects to the tools your team already uses. No new workflows, no context switching.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0">
          {INTEGRATIONS.map((item) => (
            <div
              key={item.name}
              className="flex flex-col items-center gap-3 p-6 border border-dashed border-border hover:border-accent/30 hover:bg-surface/60 transition-all group cursor-default text-center"
            >
              <div className="w-10 h-10 flex items-center justify-center border border-dashed border-border group-hover:border-accent/40 text-fog-muted group-hover:text-fog transition-all">
                <IntegrationIcon name={item.name} />
              </div>
              <div>
                <div className="font-mono text-[12px] font-semibold text-fog mb-1">{item.name}</div>
                <div className="font-mono text-[10px] text-fog-muted leading-relaxed">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
