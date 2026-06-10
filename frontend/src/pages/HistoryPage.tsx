import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { analysisApi, type AnalysisSummaryData, type InsightsData } from "../api/endpoints";
import { describeApiError } from "../api/errors";

type OutletCtx = { darkMode: boolean };

function riskBadge(score: number): string {
  if (score <= 33) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (score <= 66) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
}

export default function HistoryPage() {
  const { darkMode } = useOutletContext<OutletCtx>();
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

  useEffect(() => {
    fetchPage(1);
  }, []);

  const handleDelete = async (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm("Delete this analysis?")) return;
    await analysisApi.delete(id);
    setAnalyses((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-500">History Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold">Past reviews, reruns, and repo trends</h1>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr,1fr,220px,220px]">
        <input
          value={repo}
          onChange={(event) => setRepo(event.target.value)}
          placeholder="Filter by repo URL"
          className={`rounded-2xl border px-4 py-3 text-sm ${darkMode ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-900"}`}
        />
        <input
          value={riskMin}
          onChange={(event) => setRiskMin(event.target.value)}
          placeholder="Minimum risk"
          className={`rounded-2xl border px-4 py-3 text-sm ${darkMode ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-900"}`}
        />
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as "newest" | "highest_risk")}
          className={`rounded-2xl border px-4 py-3 text-sm ${darkMode ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-900"}`}
        >
          <option value="newest">Newest</option>
          <option value="highest_risk">Highest Risk</option>
        </select>
        <button
          onClick={() => fetchPage(1, repo, sort, riskMin)}
          className="rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
        >
          Apply Filters
        </button>
      </div>

      {insights && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className={`rounded-3xl border p-5 ${darkMode ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white"}`}>
            <p className="text-sm font-semibold">Most analyzed repos</p>
            <div className="mt-3 space-y-2 text-sm">
              {insights.most_analyzed_repos.map((item) => (
                <p key={item.repo_url} className={darkMode ? "text-slate-300" : "text-slate-700"}>
                  {item.repo_url.replace("https://github.com/", "")} • {item.count}
                </p>
              ))}
            </div>
          </div>
          <div className={`rounded-3xl border p-5 ${darkMode ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white"}`}>
            <p className="text-sm font-semibold">Average risk by repo</p>
            <div className="mt-3 space-y-2 text-sm">
              {insights.average_risk_by_repo.map((item) => (
                <p key={item.repo_url} className={darkMode ? "text-slate-300" : "text-slate-700"}>
                  {item.repo_url.replace("https://github.com/", "")} • {item.average_risk}/100
                </p>
              ))}
            </div>
          </div>
          <div className={`rounded-3xl border p-5 ${darkMode ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white"}`}>
            <p className="text-sm font-semibold">Recent high-risk PRs</p>
            <div className="mt-3 space-y-2 text-sm">
              {insights.recent_high_risk_prs.map((item) => (
                <button
                  key={item.analysis_id}
                  onClick={() => navigate(`/analysis/${item.analysis_id}`)}
                  className={`block text-left ${darkMode ? "text-slate-300 hover:text-cyan-300" : "text-slate-700 hover:text-cyan-600"}`}
                >
                  {item.repo_url.replace("https://github.com/", "")} #{item.pr_number} • {item.risk_score}/100
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        {loading && <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Loading...</p>}
        {error && <p className="text-sm text-rose-500">{error}</p>}

        {!loading && analyses.length === 0 && (
          <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            No analyses match these filters.
          </p>
        )}

        {analyses.length > 0 && (
          <div className="grid gap-4">
            {analyses.map((analysis) => (
              <article
                key={analysis.id}
                onClick={() => navigate(`/analysis/${analysis.id}`)}
                className={`cursor-pointer rounded-[2rem] border p-5 transition ${
                  darkMode ? "border-slate-700 bg-slate-900/80 hover:border-slate-500" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{analysis.repo_url.replace("https://github.com/", "")}</p>
                    <p className={`mt-1 text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                      PR #{analysis.pr_number} {analysis.pr_title ? `• ${analysis.pr_title}` : ""}
                    </p>
                    <p className={`mt-2 text-xs uppercase tracking-[0.22em] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                      {analysis.review_mode} • {new Date(analysis.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${riskBadge(analysis.risk_score)}`}>
                      {analysis.risk_score}/100
                    </span>
                    <button
                      onClick={(event) => handleDelete(analysis.id, event)}
                      className="text-xs text-rose-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {analysis.top_priorities.slice(0, 3).map((priority) => (
                    <span
                      key={priority}
                      className={`rounded-full px-3 py-1 text-xs ${
                        darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {priority}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        {page > 1 && (
          <button
            onClick={() => fetchPage(page - 1)}
            className="rounded-full border px-4 py-2 text-sm transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Previous
          </button>
        )}
        {analyses.length === 20 && (
          <button
            onClick={() => fetchPage(page + 1)}
            className="rounded-full border px-4 py-2 text-sm transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
