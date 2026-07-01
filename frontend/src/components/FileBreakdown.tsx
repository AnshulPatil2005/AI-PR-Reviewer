import { useState } from "react";
import type { FileSummaryData } from "../api/endpoints";

interface FileBreakdownProps {
  files: FileSummaryData[];
}

function riskColor(score: number): string {
  if (score <= 33) return "#00e676";
  if (score <= 66) return "#eab308";
  return "#ef4444";
}

export default function FileBreakdown({ files }: FileBreakdownProps) {
  const [expanded, setExpanded] = useState<number | null>(0);

  if (!files.length) return null;

  return (
    <div className="border border-dashed border-border divide-y divide-dashed divide-border">
      {files.map((file, i) => {
        const color = riskColor(file.risk_score);
        const isOpen = expanded === i;
        return (
          <div key={`${file.filename}-${i}`}>
            <button
              className="w-full flex items-start justify-between gap-4 px-4 py-3.5 text-left hover:bg-surface-2 transition-colors"
              onClick={() => setExpanded(isOpen ? null : i)}
            >
              <div className="min-w-0 flex items-start gap-3">
                <span className="font-mono text-[10px] text-fog-muted shrink-0 mt-0.5">
                  {isOpen ? "▼" : "▶"}
                </span>
                <div>
                  <p className="font-mono text-sm text-fog truncate">{file.filename}</p>
                  <p className="text-fog-muted text-xs mt-0.5 leading-relaxed">{file.change_summary}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className="font-mono text-[10px] font-bold tracking-widest"
                  style={{ color }}
                >
                  {file.risk_score}/100
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-fog-muted border border-dashed border-border px-1.5 py-0.5">
                  {file.coverage_status}
                </span>
              </div>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 pt-2 space-y-3 bg-surface border-t border-dashed border-border">
                <p className="text-sm text-fog-dim leading-relaxed">{file.explanation}</p>
                {file.why_it_matters && (
                  <p className="text-sm text-fog-muted leading-relaxed">{file.why_it_matters}</p>
                )}
                {file.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {file.categories.map((cat) => (
                      <span
                        key={cat}
                        className="font-mono text-[9px] uppercase tracking-widest text-fog-muted border border-dashed border-border px-1.5 py-0.5"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
                {file.coverage_status === "skipped" && file.skipped_reason && (
                  <p className="font-mono text-[10px] text-yellow-500">
                    Skipped: {file.skipped_reason}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
