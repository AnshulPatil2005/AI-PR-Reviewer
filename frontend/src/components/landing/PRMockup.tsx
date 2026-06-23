type DiffLine = { num: string; type: "ctx" | "add" | "del"; code: string };
type Comment  = { severity: "HIGH" | "MED"; text: string };

const LINES: DiffLine[] = [
  { num: "30", type: "ctx", code: "export async function processPayment(" },
  { num: "31", type: "ctx", code: "  amount: number, currency: string" },
  { num: "32", type: "ctx", code: ") {" },
  { num: "33", type: "del", code: "  const result = await charge(amount)" },
  { num: "34", type: "del", code: "  return result" },
  { num: "33", type: "add", code: '  if (amount <= 0) throw new Error("Bad amount")' },
  { num: "34", type: "add", code: "  const result = await charge(amount, {" },
  { num: "35", type: "add", code: "    idempotencyKey: uuid()," },
  { num: "36", type: "add", code: "  })" },
  { num: "37", type: "add", code: "  await auditLog.record({ amount, result })" },
  { num: "38", type: "ctx", code: "  return result" },
  { num: "39", type: "ctx", code: "}" },
];

const COMMENTS: Comment[] = [
  {
    severity: "HIGH",
    text: "currency flows unsanitized into charge() — potential injection via string interpolation on charge.ts:88",
  },
  {
    severity: "MED",
    text: "auditLog.record() is not awaited — failures will be silently swallowed",
  },
];

const severityCls: Record<Comment["severity"], string> = {
  HIGH: "bg-red-500/15 text-red-400 border border-red-500/30",
  MED:  "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
};

export default function PRMockup() {
  return (
    <div className="border border-dashed border-accent/20 bg-surface overflow-hidden shadow-glow">
      {/* Window chrome */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-dashed border-border bg-surface-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
          <span className="font-mono text-[11px] text-fog-muted ml-2">
            PR #247 · Add payment processing module
          </span>
        </div>
        <span className="font-mono text-[9px] px-1.5 py-0.5 border border-dashed border-accent/30 text-accent uppercase tracking-widest">
          OPEN
        </span>
      </div>

      {/* File header */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-surface-2/60 border-b border-border">
        <span className="font-mono text-[11px] text-fog-dim">src/payments/processor.ts</span>
        <div className="flex gap-2 font-mono text-[10px]">
          <span className="text-emerald-400">+42</span>
          <span className="text-red-400">-8</span>
        </div>
      </div>

      {/* Diff */}
      <div className="font-mono text-[11px] leading-5">
        {LINES.map((line, i) => (
          <div
            key={i}
            className={`flex ${
              line.type === "add" ? "bg-emerald-500/[0.06]" :
              line.type === "del" ? "bg-red-500/[0.06]"     : ""
            }`}
          >
            <span className="w-11 text-right pr-3 py-[3px] text-fog-muted/30 select-none border-r border-border shrink-0 text-[10px]">
              {line.num}
            </span>
            <span
              className={`pl-3 py-[3px] whitespace-pre ${
                line.type === "add" ? "text-emerald-300" :
                line.type === "del" ? "text-red-300/70 line-through decoration-red-500/30" :
                "text-fog-muted"
              }`}
            >
              {line.type === "add" ? "+ " : line.type === "del" ? "- " : "  "}
              {line.code}
            </span>
          </div>
        ))}
      </div>

      {/* AI comment panel */}
      <div className="border-t border-dashed border-accent/25 bg-accent/[0.03] p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
          </span>
          <span className="font-mono text-[10px] text-accent uppercase tracking-widest">
            AI PR Copilot · 2 issues detected
          </span>
        </div>
        <div className="space-y-2">
          {COMMENTS.map((c, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px]">
              <span className={`font-mono uppercase text-[8px] tracking-widest px-1.5 py-0.5 shrink-0 mt-0.5 ${severityCls[c.severity]}`}>
                {c.severity}
              </span>
              <span className="font-mono text-fog-dim leading-relaxed">{c.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
