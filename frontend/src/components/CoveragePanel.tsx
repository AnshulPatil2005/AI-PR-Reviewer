import type { AnalysisData } from "../api/endpoints";

interface CoveragePanelProps {
  analysis: AnalysisData;
}

export default function CoveragePanel({ analysis }: CoveragePanelProps) {
  const coverage = analysis.coverage_summary;
  const modelInfo = analysis.model_metadata;

  return (
    <div className="border border-dashed border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-1">Coverage</p>
          <p className="text-fog text-sm">
            {coverage.reviewed_count} files reviewed
            {coverage.skipped_count > 0 && ` · ${coverage.skipped_count} skipped`}
            {coverage.truncated_count > 0 && ` · ${coverage.truncated_count} truncated`}
          </p>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl font-bold text-accent text-glow">
            {Math.round(analysis.review_confidence * 100)}%
          </div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-fog-muted mt-0.5">confidence</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 border-t border-dashed border-border pt-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog-muted mb-2">Models used</p>
          <p className="text-fog-dim text-sm">
            {(modelInfo.models_used ?? []).join(", ") || "No model metadata"}
          </p>
          <p className="font-mono text-[9px] text-fog-muted mt-1">
            Fallback: {modelInfo.fallback_used ? "yes" : "no"}
          </p>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog-muted mb-2">Skipped files</p>
          <div className="space-y-1 text-sm">
            {coverage.skipped_files.length === 0
              ? <p className="text-fog-dim">None</p>
              : coverage.skipped_files.slice(0, 4).map((f) => (
                  <p key={f.filename} className="font-mono text-[11px] text-fog-dim">
                    {f.filename}
                    <span className="text-fog-muted ml-2">{f.reason}</span>
                  </p>
                ))
            }
          </div>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog-muted mb-2">Heuristics</p>
          <p className="text-fog-dim text-sm">
            {modelInfo.partially_heuristic ? "Partial" : "None"} · {modelInfo.heuristic_findings ?? 0} findings
          </p>
          {coverage.truncated_files.length > 0 && (
            <p className="font-mono text-[9px] text-fog-muted mt-1">
              Truncated: {coverage.truncated_files.join(", ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
