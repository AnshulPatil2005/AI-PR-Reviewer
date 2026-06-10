import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { analysisApi, type AnalysisData, type ComparisonData } from "../api/endpoints";
import { describeApiError } from "../api/errors";
import AnalysisSummary from "../components/AnalysisSummary";

type OutletCtx = { darkMode: boolean };

export default function AnalysisDetailPage() {
  const { darkMode } = useOutletContext<OutletCtx>();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rerunning, setRerunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.allSettled([analysisApi.get(Number(id)), analysisApi.compare(Number(id))])
      .then(([analysisRes, compareRes]) => {
        if (analysisRes.status === "fulfilled") {
          setAnalysis(analysisRes.value.data);
        } else {
          setError(describeApiError((analysisRes as PromiseRejectedResult).reason, "Analysis not found."));
        }
        if (compareRes.status === "fulfilled") {
          setComparison(compareRes.value.data);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleRerun = async () => {
    if (!analysis) return;
    setRerunning(true);
    try {
      const res = await analysisApi.rerun(analysis.id);
      navigate(`/jobs/${res.data.id}`);
    } catch (err: any) {
      setError(describeApiError(err, "Could not rerun analysis."));
    } finally {
      setRerunning(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Loading...</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-rose-500">{error || "Analysis not found."}</p>
        <button onClick={() => navigate("/history")} className="mt-4 text-sm text-cyan-500 hover:underline">
          Back to History
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <button
        onClick={() => navigate("/history")}
        className={`mb-4 text-sm hover:underline ${darkMode ? "text-slate-400" : "text-slate-500"}`}
      >
        Back to History
      </button>

      <div className={`rounded-[2rem] border p-6 ${darkMode ? "border-slate-700 bg-slate-950/90" : "border-slate-200 bg-white"}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-500">Review Report</p>
            <h1 className="mt-2 text-2xl font-bold">
              PR #{analysis.pr_number} {analysis.pr_title ? `• ${analysis.pr_title}` : ""}
            </h1>
            <p className={`mt-2 text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              {analysis.repo_url.replace("https://github.com/", "")} • {new Date(analysis.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {comparison && comparison.baseline_analysis_id && (
          <div className={`mt-6 rounded-3xl border p-5 ${darkMode ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Rerun comparison</p>
                <p className={`mt-2 text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                  Compared with analysis #{comparison.baseline_analysis_id}. Risk delta: {comparison.risk_delta >= 0 ? "+" : ""}
                  {comparison.risk_delta}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className={`rounded-full px-3 py-1 ${darkMode ? "bg-slate-800 text-slate-300" : "bg-white text-slate-700"}`}>
                  Added findings: {comparison.findings_added.length}
                </span>
                <span className={`rounded-full px-3 py-1 ${darkMode ? "bg-slate-800 text-slate-300" : "bg-white text-slate-700"}`}>
                  Resolved: {comparison.findings_resolved.length}
                </span>
                <span className={`rounded-full px-3 py-1 ${darkMode ? "bg-slate-800 text-slate-300" : "bg-white text-slate-700"}`}>
                  New risky files: {comparison.newly_risky_files.length}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <AnalysisSummary
            analysis={analysis}
            darkMode={darkMode}
            analysisId={analysis.id}
            onRerun={handleRerun}
            rerunning={rerunning}
          />
        </div>
      </div>
    </div>
  );
}
