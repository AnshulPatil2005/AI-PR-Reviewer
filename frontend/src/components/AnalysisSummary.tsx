import type { AnalysisData } from "../api/endpoints";
import RiskGauge from "./RiskGauge";
import SuggestionCard from "./SuggestionCard";
import FileBreakdown from "./FileBreakdown";

interface AnalysisSummaryProps {
  analysis: AnalysisData;
  darkMode: boolean;
  analysisId?: number;
}

export default function AnalysisSummary({ analysis, darkMode, analysisId }: AnalysisSummaryProps) {
  const exportUrl = (format: "json" | "pdf") => {
    const id = analysisId ?? analysis.id;
    const token = localStorage.getItem("token") ?? "";
    return `${import.meta.env.VITE_API_BASE || "http://localhost:8000"}/analyses/${id}/export?format=${format}&token=${token}`;
  };

  const handleExport = async (format: "json" | "pdf") => {
    const id = analysisId ?? analysis.id;
    const token = localStorage.getItem("token") ?? "";
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE || "http://localhost:8000"}/analyses/${id}/export?format=${format}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analysis-${id}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Risk gauge + export */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <RiskGauge score={analysis.risk_score} />
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => handleExport("json")}
            className="text-xs px-3 py-1.5 rounded-lg border border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition font-medium"
          >
            Export JSON
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Explanation */}
      <div>
        <h3 className={`text-sm font-semibold mb-1 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
          Assessment
        </h3>
        <p className={`text-sm leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
          {analysis.explanation}
        </p>
      </div>

      {/* Suggestions */}
      {analysis.suggestions.length > 0 && (
        <div>
          <h3 className={`text-sm font-semibold mb-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
            Suggestions
          </h3>
          <div className="space-y-2">
            {analysis.suggestions.map((s, i) => (
              <SuggestionCard key={i} suggestion={s} index={i + 1} darkMode={darkMode} />
            ))}
          </div>
        </div>
      )}

      {/* File breakdown */}
      {analysis.file_analyses && analysis.file_analyses.length > 0 && (
        <div>
          <h3 className={`text-sm font-semibold mb-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
            File-Level Breakdown
          </h3>
          <FileBreakdown files={analysis.file_analyses} darkMode={darkMode} />
        </div>
      )}
    </div>
  );
}
