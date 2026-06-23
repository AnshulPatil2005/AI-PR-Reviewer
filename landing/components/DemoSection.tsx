type Line = { num: number; type: 'ctx' | 'add' | 'del'; code: string }

const DIFF: Line[] = [
  { num: 1,  type: 'ctx', code: 'import jwt from "jsonwebtoken"' },
  { num: 2,  type: 'ctx', code: '' },
  { num: 3,  type: 'ctx', code: 'export function createToken(userId: string) {' },
  { num: 4,  type: 'del', code: '  return jwt.sign({ userId }, process.env.SECRET)' },
  { num: 5,  type: 'del', code: '}' },
  { num: 4,  type: 'add', code: '  if (!process.env.JWT_SECRET) {' },
  { num: 5,  type: 'add', code: '    throw new Error("JWT_SECRET env var is not set")' },
  { num: 6,  type: 'add', code: '  }' },
  { num: 7,  type: 'add', code: '  return jwt.sign(' },
  { num: 8,  type: 'add', code: '    { userId, iat: Math.floor(Date.now() / 1000) },' },
  { num: 9,  type: 'add', code: '    process.env.JWT_SECRET,' },
  { num: 10, type: 'add', code: '    { expiresIn: "15m", algorithm: "HS256" }' },
  { num: 11, type: 'add', code: '  )' },
  { num: 12, type: 'ctx', code: '}' },
]

const ANNOTATIONS = [
  {
    line: 4,
    type: 'del' as const,
    severity: 'HIGH',
    comment: 'process.env.SECRET may be undefined at runtime — jwt.sign() with undefined secret creates tokens that always verify, bypassing auth entirely.',
  },
  {
    line: 10,
    type: 'add' as const,
    severity: 'INFO',
    comment: '15m expiry is appropriate for short-lived tokens. Consider adding a refresh token flow for UX.',
  },
]

const severityBg: Record<string, string> = {
  HIGH: 'border-l-2 border-red-500 bg-red-500/8',
  MED: 'border-l-2 border-yellow-500 bg-yellow-500/8',
  INFO: 'border-l-2 border-blue-500 bg-blue-500/8',
}
const severityLabel: Record<string, string> = {
  HIGH: 'text-red-400 border-red-500/30',
  MED: 'text-yellow-400 border-yellow-500/30',
  INFO: 'text-blue-400 border-blue-500/30',
}

export default function DemoSection() {
  return (
    <section id="demo" className="py-24 border-b border-dashed border-border bg-surface/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-xl mb-12">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-3">Live demo</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-fog mb-4">
            See a real review in action
          </h2>
          <p className="text-fog-dim text-base leading-relaxed">
            This is how CodeLens AI surfaces a critical auth bug — the kind that passes human review 40% of the time.
          </p>
        </div>

        {/* Editor frame */}
        <div className="border border-dashed border-accent/20 bg-surface overflow-hidden shadow-glow-lg">
          {/* Titlebar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-dashed border-border bg-surface-2">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
              </div>
              <span className="font-mono text-[11px] text-fog-muted ml-2">
                PR #301 · Fix JWT token creation
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-fog-muted">
                src/auth/token.ts
              </span>
              <span className="font-mono text-[9px] px-1.5 py-0.5 border border-dashed border-emerald-500/30 text-emerald-400">
                +11 -2
              </span>
            </div>
          </div>

          {/* Diff lines */}
          <div className="font-mono text-[12px] leading-[1.65] overflow-x-auto">
            {DIFF.map((line, i) => {
              const annotation = ANNOTATIONS.find(
                (a) => a.line === line.num && a.type === line.type
              )
              return (
                <div key={i}>
                  <div
                    className={`flex ${
                      line.type === 'add'
                        ? 'bg-emerald-500/[0.05]'
                        : line.type === 'del'
                        ? 'bg-red-500/[0.05]'
                        : ''
                    }`}
                  >
                    <span className="w-14 text-right pr-3 py-[3px] text-fog-muted/25 select-none border-r border-border shrink-0 text-[10px]">
                      {line.num || ''}
                    </span>
                    <span className="w-5 text-center py-[3px] shrink-0 text-[11px]">
                      {line.type === 'add' ? (
                        <span className="text-emerald-400">+</span>
                      ) : line.type === 'del' ? (
                        <span className="text-red-400">-</span>
                      ) : (
                        ' '
                      )}
                    </span>
                    <span
                      className={`pl-2 py-[3px] whitespace-pre ${
                        line.type === 'add'
                          ? 'text-emerald-200'
                          : line.type === 'del'
                          ? 'text-red-300/60'
                          : 'text-fog-dim'
                      }`}
                    >
                      {line.code}
                    </span>
                  </div>

                  {/* Annotation below this line */}
                  {annotation && (
                    <div className={`flex items-start gap-3 px-4 py-2.5 ${severityBg[annotation.severity]}`}>
                      <span
                        className={`font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 border shrink-0 mt-0.5 ${severityLabel[annotation.severity]}`}
                      >
                        {annotation.severity}
                      </span>
                      <p className="font-mono text-[11px] text-fog-dim leading-relaxed">
                        {annotation.comment}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-dashed border-border bg-surface-2 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-50" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
              </span>
              <span className="font-mono text-[10px] text-fog-muted uppercase tracking-widest">
                1 high · 0 medium · 1 info
              </span>
            </div>
            <span className="font-mono text-[10px] text-fog-muted uppercase tracking-widest">
              Reviewed in 4.2s
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
