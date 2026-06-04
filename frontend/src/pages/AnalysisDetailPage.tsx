import { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { analysisApi } from "../api/endpoints";
import type { AnalysisData } from "../api/endpoints";
import AnalysisSummary from "../components/AnalysisSummary";

type OutletCtx = { darkMode: boolean };

export default function AnalysisDetailPage() {
  const { darkMode } = useOutletContext<OutletCtx>();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    analysisApi.get(Number(id))
      .then((res) => setAnalysis(res.data))
      .catch(() => setError("Analysis not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Loading...</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-sm text-red-500">{error || "Not found."}</p>
        <button onClick={() => navigate("/history")} className="mt-4 text-sm text-blue-500 hover:underline">
          Back to History
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <button
        onClick={() => navigate("/history")}
        className={`text-sm mb-4 hover:underline ${darkMode ? "text-slate-400" : "text-slate-500"}`}
      >
        ← Back to History
      </button>

      <div className={`rounded-2xl shadow-xl p-8 border ${darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
        <div className="mb-6">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">
            PR #{analysis.pr_number}{analysis.pr_title ? ` — ${analysis.pr_title}` : ""}
          </h1>
          <p className={`text-xs mt-1 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
            {analysis.repo_url.replace("https://github.com/", "")} · {new Date(analysis.created_at).toLocaleString()}
          </p>
        </div>

        <AnalysisSummary analysis={analysis} darkMode={darkMode} analysisId={Number(id)} />
      </div>
    </div>
  );
}
