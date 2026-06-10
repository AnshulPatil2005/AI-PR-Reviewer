import type { AnalysisData } from "../api/endpoints";

interface CoveragePanelProps {
  analysis: AnalysisData;
  darkMode: boolean;
}

export default function CoveragePanel({ analysis, darkMode }: CoveragePanelProps) {
  const coverage = analysis.coverage_summary;
  const modelInfo = analysis.model_metadata;

  return (
    <div className={`rounded-3xl border p-5 ${darkMode ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Coverage and Trust Signals</h3>
          <p className={`mt-1 text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
            Reviewed {coverage.reviewed_count} files with {coverage.skipped_count} skipped and {coverage.truncated_count} truncated.
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-cyan-500">{Math.round(analysis.review_confidence * 100)}%</p>
          <p className={`text-xs uppercase tracking-[0.2em] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
            Review confidence
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div>
          <p className={`text-xs uppercase tracking-[0.2em] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Models</p>
          <p className={`mt-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
            {(modelInfo.models_used || []).join(", ") || "No model metadata"}
          </p>
          <p className={`mt-2 text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
            Fallback used: {modelInfo.fallback_used ? "yes" : "no"}
          </p>
        </div>
        <div>
          <p className={`text-xs uppercase tracking-[0.2em] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Skipped files</p>
          <div className="mt-2 space-y-1 text-sm">
            {coverage.skipped_files.length === 0 && <p className={darkMode ? "text-slate-300" : "text-slate-700"}>None</p>}
            {coverage.skipped_files.slice(0, 4).map((file) => (
              <p key={file.filename} className={darkMode ? "text-slate-300" : "text-slate-700"}>
                {file.filename}
                <span className={`ml-2 text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}>{file.reason}</span>
              </p>
            ))}
          </div>
        </div>
        <div>
          <p className={`text-xs uppercase tracking-[0.2em] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Heuristic support</p>
          <p className={`mt-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
            {modelInfo.partially_heuristic ? "Yes" : "No"} • {modelInfo.heuristic_findings ?? 0} heuristic findings
          </p>
          <p className={`mt-2 text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
            Truncated files: {coverage.truncated_files.join(", ") || "None"}
          </p>
        </div>
      </div>
    </div>
  );
}
