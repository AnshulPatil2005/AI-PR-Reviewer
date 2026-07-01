import type { FindingData } from "../api/endpoints";

interface FindingFeedProps {
  findings: FindingData[];
}

const SEVERITY_COLORS: Record<FindingData["severity"], string> = {
  critical: "#ef4444",
  high:     "#f97316",
  medium:   "#eab308",
  low:      "#00e676",
};

export default function FindingFeed({ findings }: FindingFeedProps) {
  if (!findings.length) {
    return (
      <div className="border border-dashed border-border bg-surface p-4 text-sm text-fog-muted font-mono">
        No structured findings were generated for this review.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {findings.map((finding, index) => {
        const color = SEVERITY_COLORS[finding.severity] ?? SEVERITY_COLORS.low;
        return (
          <article
            key={`${finding.file_path}-${finding.title}-${index}`}
            className="border border-dashed border-border bg-surface p-4"
            style={{ borderLeftColor: color, borderLeftWidth: "2px", borderLeftStyle: "solid" }}
          >
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className="font-mono text-[9px] uppercase tracking-[0.2em] px-1.5 py-0.5 border border-dashed"
                style={{ color, borderColor: `${color}40` }}
              >
                {finding.severity}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-fog-muted border border-dashed border-border px-1.5 py-0.5">
                {finding.category}
              </span>
              <span className="font-mono text-[9px] text-fog-muted">
                {Math.round(finding.confidence * 100)}% confidence
              </span>
            </div>

            <h4 className="font-semibold text-fog text-sm mb-1.5">{finding.title}</h4>
            <p className="text-fog-dim text-sm leading-relaxed">{finding.detail}</p>

            {finding.suggested_fix && (
              <p className="mt-3 text-sm text-fog-muted border-t border-dashed border-border pt-3">
                <span className="text-accent font-mono text-[9px] uppercase tracking-widest mr-2">Fix →</span>
                {finding.suggested_fix}
              </p>
            )}

            <div className="mt-3 font-mono text-[9px] text-fog-muted">
              {finding.file_path || "PR-wide"} · {finding.source}
              {finding.line_start != null && ` · L${finding.line_start}${finding.line_end != null && finding.line_end !== finding.line_start ? `–${finding.line_end}` : ""}`}
            </div>
          </article>
        );
      })}
    </div>
  );
}
