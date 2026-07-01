import type { AnalysisData } from "../api/endpoints";
import CoveragePanel from "./CoveragePanel";
import FileBreakdown from "./FileBreakdown";
import FindingFeed from "./FindingFeed";
import RiskGauge from "./RiskGauge";
import SuggestionCard from "./SuggestionCard";

interface AnalysisSummaryProps {
  analysis: AnalysisData;
  analysisId?: number;
  onRerun?: () => void;
  rerunning?: boolean;
}

async function downloadWithAuth(url: string, filename: string) {
  const token = localStorage.getItem("token") ?? "";
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(blobUrl);
}

const EXPORT_FORMATS = [
  { key: "json",      label: "JSON",      ext: "json" },
  { key: "pdf",       label: "PDF",       ext: "pdf"  },
  { key: "markdown",  label: "Markdown",  ext: "md"   },
  { key: "comment",   label: "PR Comment",ext: "txt"  },
  { key: "executive", label: "Executive", ext: "txt"  },
] as const;

export default function AnalysisSummary({
  analysis,
  analysisId,
  onRerun,
  rerunning = false,
}: AnalysisSummaryProps) {
  const id = analysisId ?? analysis.id;
  const base = `${import.meta.env.VITE_API_BASE || "http://localhost:8000"}/analyses/${id}/export`;

  const handleExport = async (format: typeof EXPORT_FORMATS[number]["key"]) => {
    const fmtObj = EXPORT_FORMATS.find((f) => f.key === format)!;
    await downloadWithAuth(`${base}?format=${format}`, `analysis-${id}.${fmtObj.ext}`);
  };

  return (
    <div className="space-y-5">
      {/* Risk + Summary */}
      <section className="grid gap-4 lg:grid-cols-[220px,1fr]">
        <div className="border border-dashed border-border bg-surface p-5 flex flex-col items-center justify-center">
          <RiskGauge score={analysis.risk_score} />
          <div className="mt-3 text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-fog-muted">
              {analysis.review_mode} mode
            </p>
            <p className="font-mono text-[9px] text-fog-muted mt-1">
              {Math.round(analysis.review_confidence * 100)}% confidence
            </p>
          </div>
        </div>

        <div className="border border-dashed border-border bg-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">Assessment</p>
            <div className="flex flex-wrap gap-2">
              {EXPORT_FORMATS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => handleExport(f.key)}
                  className="clip-notch-sm border border-dashed border-border text-fog-muted font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 hover:border-accent/40 hover:text-fog transition-all"
                >
                  {f.label}
                </button>
              ))}
              {onRerun && (
                <button
                  onClick={onRerun}
                  disabled={rerunning}
                  className="clip-notch-sm bg-accent text-bg font-mono text-[9px] uppercase tracking-widest font-bold px-3 py-1 hover:shadow-glow-sm transition-shadow disabled:opacity-50"
                >
                  {rerunning ? "Rerunning…" : "Rerun"}
                </button>
              )}
            </div>
          </div>
          <p className="text-fog-dim text-sm leading-relaxed">{analysis.explanation}</p>
        </div>
      </section>

      {/* Top Priorities */}
      {analysis.top_priorities.length > 0 && (
        <section>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog-muted mb-3">Top Priorities</p>
          <div className="grid gap-2 md:grid-cols-3">
            {analysis.top_priorities.map((item, index) => (
              <SuggestionCard key={`${item}-${index}`} suggestion={item} index={index + 1} />
            ))}
          </div>
        </section>
      )}

      {/* Coverage */}
      <CoveragePanel analysis={analysis} />

      {/* Executive Summary */}
      {analysis.executive_summary && (
        <section className="border border-dashed border-border bg-surface p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog-muted mb-3">Executive Summary</p>
          <p className="text-fog-dim text-sm leading-relaxed">{analysis.executive_summary}</p>
        </section>
      )}

      {/* Findings */}
      <section>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog-muted mb-3">
          Findings ({analysis.findings.length})
        </p>
        <FindingFeed findings={analysis.findings} />
      </section>

      {/* File Breakdown */}
      <section>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog-muted mb-3">
          File Breakdown ({analysis.file_summaries.length} files)
        </p>
        <FileBreakdown files={analysis.file_summaries} />
      </section>
    </div>
  );
}
