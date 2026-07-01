import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { analysisApi, type AnalysisSummaryData, type InsightsData } from "../api/endpoints";
import { describeApiError } from "../api/errors";

function riskColor(score: number): string {
  if (score <= 33) return "#00e676";
  if (score <= 66) return "#eab308";
  return "#ef4444";
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<AnalysisSummaryData[]>([]);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [page, setPage] = useState(1);
  const [repo, setRepo] = useState("");
  const [sort, setSort] = useState<"newest" | "highest_risk">("newest");
  const [riskMin, setRiskMin] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPage = async (nextPage: number, nextRepo = repo, nextSort = sort, nextRiskMin = riskMin) => {
    setLoading(true);
    setError("");
    try {
      const [analysisRes, insightsRes] = await Promise.all([
        analysisApi.list({
          page: nextPage,
          limit: 20,
          repo: nextRepo || undefined,
          risk_min: nextRiskMin ? Number(nextRiskMin) : undefined,
          sort: nextSort,
        }),
        analysisApi.insights(),
      ]);
      setAnalyses(analysisRes.data);
      setInsights(insightsRes.data);
      setPage(nextPage);
    } catch (err: any) {
      setError(describeApiError(err, "Failed to load analysis history."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPage(1); }, []);

  const handleDelete = async (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm("Delete this analysis?")) return;
    await analysisApi.delete(id);
    setAnalyses((prev) => prev.filter((item) => item.id !== id));
  };

  const inputCls = "bg-bg border border-dashed border-border text-fog font-mono text-sm px-4 py-2.5 focus:outline-none focus:border-accent/50 transition-colors placeholder:text-fog-muted";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-2">History</p>
        <h1 className="text-3xl font-bold text-fog">Past reviews &amp; repo trends</h1>
      </div>

      {/* Filters */}
      <div className="grid gap-3 lg:grid-cols-[1fr,1fr,200px,180px]">
        <input
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="Filter by repo URL"
          className={inputCls}
        />
        <input
          value={riskMin}
          onChange={(e) => setRiskMin(e.target.value)}
          placeholder="Min risk score"
          type="number"
          className={inputCls}
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "newest" | "highest_risk")}
          className={inputCls}
        >
          <option value="newest">Newest first</option>
          <option value="highest_risk">Highest risk</option>
        </select>
        <button
          onClick={() => fetchPage(1, repo, sort, riskMin)}
          className="clip-notch bg-accent text-bg font-mono text-[11px] uppercase tracking-[0.14em] font-bold px-4 py-2.5 hover:shadow-glow transition-shadow"
        >
          Apply filters
        </button>
      </div>

      {/* Insights */}
      {insights && (
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            {
              label: "Most analyzed repos",
              rows: insights.most_analyzed_repos.map((item) => ({
                key: item.repo_url,
                primary: item.repo_url.replace("https://github.com/", ""),
                secondary: `${item.count} analyses`,
                onClick: undefined as undefined | (() => void),
              })),
            },
            {
              label: "Average risk by repo",
              rows: insights.average_risk_by_repo.map((item) => ({
                key: item.repo_url,
                primary: item.repo_url.replace("https://github.com/", ""),
                secondary: `${item.average_risk}/100 avg risk`,
                onClick: undefined as undefined | (() => void),
              })),
            },
            {
              label: "Recent high-risk PRs",
              rows: insights.recent_high_risk_prs.map((item) => ({
                key: String(item.analysis_id),
                primary: `${item.repo_url.replace("https://github.com/", "")} #${item.pr_number}`,
                secondary: `${item.risk_score}/100`,
                onClick: () => navigate(`/analysis/${item.analysis_id}`),
              })),
            },
          ].map((panel) => (
            <div key={panel.label} className="border border-dashed border-border bg-surface p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog-muted mb-3">{panel.label}</p>
              <div className="space-y-2">
                {panel.rows.length === 0 && (
                  <p className="text-fog-muted text-xs font-mono">None yet</p>
                )}
                {panel.rows.map((row) =>
                  row.onClick ? (
                    <button
                      key={row.key}
                      onClick={row.onClick}
                      className="block w-full text-left group"
                    >
                      <span className="text-sm text-fog-dim group-hover:text-fog transition-colors font-mono">{row.primary}</span>
                      <span className="font-mono text-[9px] text-fog-muted ml-2">{row.secondary}</span>
                    </button>
                  ) : (
                    <div key={row.key}>
                      <span className="text-sm text-fog-dim font-mono">{row.primary}</span>
                      <span className="font-mono text-[9px] text-fog-muted ml-2">{row.secondary}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      <div>
        {loading && <p className="font-mono text-sm text-fog-muted">Loading…</p>}
        {error && <p className="font-mono text-sm text-red-400">{error}</p>}

        {!loading && analyses.length === 0 && (
          <div className="border border-dashed border-border bg-surface p-8 text-center">
            <p className="font-mono text-sm text-fog-muted">No analyses match these filters.</p>
          </div>
        )}

        {analyses.length > 0 && (
          <div className="border border-dashed border-border divide-y divide-dashed divide-border">
            {analyses.map((analysis) => {
              const color = riskColor(analysis.risk_score);
              return (
                <article
                  key={analysis.id}
                  onClick={() => navigate(`/analysis/${analysis.id}`)}
                  className="cursor-pointer px-5 py-4 hover:bg-surface transition-colors group"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-sm text-fog group-hover:text-accent transition-colors">
                        {analysis.repo_url.replace("https://github.com/", "")}
                      </p>
                      <p className="text-fog-muted text-sm mt-0.5">
                        PR #{analysis.pr_number}{analysis.pr_title ? ` · ${analysis.pr_title}` : ""}
                      </p>
                      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-fog-muted mt-1.5">
                        {analysis.review_mode} · {new Date(analysis.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="font-mono text-sm font-bold"
                        style={{ color }}
                      >
                        {analysis.risk_score}/100
                      </span>
                      <button
                        onClick={(e) => handleDelete(analysis.id, e)}
                        className="font-mono text-[9px] uppercase tracking-widest text-fog-muted hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {analysis.top_priorities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {analysis.top_priorities.slice(0, 3).map((priority) => (
                        <span
                          key={priority}
                          className="font-mono text-[9px] text-fog-muted border border-dashed border-border px-2 py-0.5"
                        >
                          {priority}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {(page > 1 || analyses.length === 20) && (
        <div className="flex justify-end gap-2">
          {page > 1 && (
            <button
              onClick={() => fetchPage(page - 1)}
              className="clip-notch-sm border border-dashed border-border text-fog-muted font-mono text-[10px] uppercase tracking-widest px-4 py-2 hover:border-accent/40 hover:text-fog transition-all"
            >
              ← Previous
            </button>
          )}
          {analyses.length === 20 && (
            <button
              onClick={() => fetchPage(page + 1)}
              className="clip-notch-sm border border-dashed border-border text-fog-muted font-mono text-[10px] uppercase tracking-widest px-4 py-2 hover:border-accent/40 hover:text-fog transition-all"
            >
              Next →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
