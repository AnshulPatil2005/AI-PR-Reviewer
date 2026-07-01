import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { analysisApi, type AnalysisData, type ComparisonData } from "../api/endpoints";
import { describeApiError } from "../api/errors";
import AnalysisSummary from "../components/AnalysisSummary";

export default function AnalysisDetailPage() {
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
      <div className="max-w-5xl mx-auto px-4 py-12">
        <p className="font-mono text-sm text-fog-muted">Loading…</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-4">
        <p className="font-mono text-sm text-red-400">{error || "Analysis not found."}</p>
        <button
          onClick={() => navigate("/history")}
          className="font-mono text-[10px] uppercase tracking-widest text-fog-muted hover:text-fog transition-colors border-b border-dashed border-fog-muted/30 hover:border-accent/40 pb-0.5"
        >
          ← Back to History
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate("/history")}
        className="font-mono text-[10px] uppercase tracking-widest text-fog-muted hover:text-fog transition-colors border-b border-dashed border-fog-muted/30 hover:border-accent/40 pb-0.5"
      >
        ← History
      </button>

      {/* Header card */}
      <div className="border border-dashed border-border bg-surface p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-2">Review Report</p>
        <h1 className="text-2xl font-bold text-fog">
          PR #{analysis.pr_number}{analysis.pr_title ? ` · ${analysis.pr_title}` : ""}
        </h1>
        <p className="font-mono text-[11px] text-fog-muted mt-2">
          {analysis.repo_url.replace("https://github.com/", "")} · {new Date(analysis.created_at).toLocaleString()}
        </p>
      </div>

      {/* Comparison delta */}
      {comparison?.baseline_analysis_id && (
        <div className="border border-dashed border-border bg-surface p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog-muted mb-3">Rerun Comparison</p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-fog-dim text-sm">
              vs. analysis #{comparison.baseline_analysis_id} · risk delta:{" "}
              <span className={comparison.risk_delta >= 0 ? "text-red-400" : "text-accent"}>
                {comparison.risk_delta >= 0 ? "+" : ""}{comparison.risk_delta}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Added", count: comparison.findings_added.length },
                { label: "Resolved", count: comparison.findings_resolved.length },
                { label: "New risky files", count: comparison.newly_risky_files.length },
              ].map(({ label, count }) => (
                <span
                  key={label}
                  className="font-mono text-[9px] uppercase tracking-widest text-fog-muted border border-dashed border-border px-2 py-0.5"
                >
                  {label}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Full analysis */}
      <AnalysisSummary
        analysis={analysis}
        analysisId={analysis.id}
        onRerun={handleRerun}
        rerunning={rerunning}
      />
    </div>
  );
}
