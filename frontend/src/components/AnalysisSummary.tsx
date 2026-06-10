import type { AnalysisData } from "../api/endpoints";
import CoveragePanel from "./CoveragePanel";
import FileBreakdown from "./FileBreakdown";
import FindingFeed from "./FindingFeed";
import RiskGauge from "./RiskGauge";
import SuggestionCard from "./SuggestionCard";

interface AnalysisSummaryProps {
  analysis: AnalysisData;
  darkMode: boolean;
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

export default function AnalysisSummary({
  analysis,
  darkMode,
  analysisId,
  onRerun,
  rerunning = false,
}: AnalysisSummaryProps) {
  const id = analysisId ?? analysis.id;
  const base = `${import.meta.env.VITE_API_BASE || "http://localhost:8000"}/analyses/${id}/export`;

  const handleExport = async (format: "json" | "pdf" | "markdown" | "comment" | "executive") => {
    const extension = format === "markdown" ? "md" : format === "comment" || format === "executive" ? "txt" : format;
    await downloadWithAuth(`${base}?format=${format}`, `analysis-${id}.${extension}`);
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-5 lg:grid-cols-[240px,1fr]">
        <div className={`rounded-3xl border p-5 ${darkMode ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white"}`}>
          <RiskGauge score={analysis.risk_score} />
          <div className="mt-4 text-center">
            <p className={`text-xs uppercase tracking-[0.22em] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
              {analysis.review_mode} mode
            </p>
            <p className={`mt-2 text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              Confidence {Math.round(analysis.review_confidence * 100)}%
            </p>
          </div>
        </div>

        <div className={`rounded-3xl border p-6 ${darkMode ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white"}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className={`text-xs uppercase tracking-[0.22em] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                Summary
              </p>
              <p className={`mt-3 text-sm leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                {analysis.explanation}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleExport("json")}
                className="rounded-full border border-cyan-500 px-3 py-2 text-xs font-semibold text-cyan-600 transition hover:bg-cyan-50 dark:text-cyan-300 dark:hover:bg-cyan-900/20"
              >
                JSON
              </button>
              <button
                onClick={() => handleExport("pdf")}
                className="rounded-full border border-orange-500 px-3 py-2 text-xs font-semibold text-orange-600 transition hover:bg-orange-50 dark:text-orange-300 dark:hover:bg-orange-900/20"
              >
                PDF
              </button>
              <button
                onClick={() => handleExport("markdown")}
                className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Markdown
              </button>
              <button
                onClick={() => handleExport("comment")}
                className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                PR Comment
              </button>
              <button
                onClick={() => handleExport("executive")}
                className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Executive
              </button>
              {onRerun && (
                <button
                  onClick={onRerun}
                  disabled={rerunning}
                  className="rounded-full bg-cyan-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60"
                >
                  {rerunning ? "Rerunning..." : "Rerun"}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className={`mb-3 text-sm font-semibold uppercase tracking-[0.22em] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          Top Priorities
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          {analysis.top_priorities.map((item, index) => (
            <SuggestionCard key={`${item}-${index}`} suggestion={item} index={index + 1} darkMode={darkMode} />
          ))}
        </div>
      </section>

      <CoveragePanel analysis={analysis} darkMode={darkMode} />

      {analysis.executive_summary && (
        <section className={`rounded-3xl border p-5 ${darkMode ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white"}`}>
          <h3 className={`text-sm font-semibold uppercase tracking-[0.22em] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            Executive Summary
          </h3>
          <p className={`mt-3 text-sm leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
            {analysis.executive_summary}
          </p>
        </section>
      )}

      <section>
        <h3 className={`mb-3 text-sm font-semibold uppercase tracking-[0.22em] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          Findings
        </h3>
        <FindingFeed findings={analysis.findings} darkMode={darkMode} />
      </section>

      <section>
        <h3 className={`mb-3 text-sm font-semibold uppercase tracking-[0.22em] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          File Breakdown
        </h3>
        <FileBreakdown files={analysis.file_summaries} darkMode={darkMode} />
      </section>
    </div>
  );
}
