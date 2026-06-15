import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { repoApi, type RepoAnalyticsData } from "../api/endpoints";

type OutletCtx = { darkMode: boolean };

function Sparkline({ values, darkMode }: { values: number[]; darkMode: boolean }) {
  if (values.length < 2) return null;
  const w = 200;
  const h = 48;
  const max = Math.max(...values, 1);
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - (v / max) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke={darkMode ? "#22d3ee" : "#0891b2"}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StatCard({ label, value, darkMode }: { label: string; value: string | number; darkMode: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
      <p className={`text-xs uppercase tracking-widest mb-1 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function riskColor(score: number) {
  if (score >= 70) return "text-red-500";
  if (score >= 40) return "text-yellow-500";
  return "text-green-500";
}

export default function RepoAnalyticsPage() {
  const { darkMode } = useOutletContext<OutletCtx>();
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<RepoAnalyticsData | null>(null);

  const handleAnalyze = async () => {
    const url = repoUrl.trim();
    if (!url) return;
    setError("");
    setData(null);
    setLoading(true);
    try {
      const res = await repoApi.analytics(url);
      setData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not fetch repo analytics.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = `w-full rounded-2xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 ${
    darkMode
      ? "border-slate-700 bg-slate-900 text-slate-100 focus:ring-cyan-400"
      : "border-slate-300 bg-white text-slate-900 focus:ring-cyan-500"
  }`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Repo Analytics</h1>
        <p className={`mt-1 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          GitHub stats + risk profile from your past PR analyses — no LLM, instant results.
        </p>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="https://github.com/owner/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          className={inputCls}
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || !repoUrl.trim()}
          className="shrink-0 rounded-2xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {loading ? "Loading..." : "Analyze"}
        </button>
      </div>

      {error && (
        <div className={`rounded-2xl border p-3 text-sm ${darkMode ? "border-rose-800 bg-rose-900/30 text-rose-300" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Header */}
          <div className={`rounded-2xl border p-5 ${darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold">{data.repo_name}</h2>
                {data.description && (
                  <p className={`mt-1 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{data.description}</p>
                )}
              </div>
              <span className={`text-xs px-3 py-1 rounded-full border font-medium ${darkMode ? "border-slate-600 text-slate-300" : "border-slate-300 text-slate-600"}`}>
                {data.language}
              </span>
            </div>
            {data.last_pushed_at && (
              <p className={`mt-2 text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                Last pushed: {new Date(data.last_pushed_at).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* GitHub Stats Grid */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest mb-3 text-slate-500">GitHub Stats</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Stars" value={data.stars.toLocaleString()} darkMode={darkMode} />
              <StatCard label="Forks" value={data.forks.toLocaleString()} darkMode={darkMode} />
              <StatCard label="Open PRs" value={data.open_prs} darkMode={darkMode} />
              <StatCard label="Merged (30d)" value={data.prs_merged_last_30d} darkMode={darkMode} />
            </div>
          </div>

          {/* Top Contributors */}
          {data.top_contributors.length > 0 && (
            <div className={`rounded-2xl border p-5 ${darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
              <h3 className="text-sm font-semibold uppercase tracking-widest mb-3 text-slate-500">Top Contributors</h3>
              <div className="flex flex-wrap gap-2">
                {data.top_contributors.map((login) => (
                  <span
                    key={login}
                    className={`text-sm px-3 py-1 rounded-full border ${darkMode ? "border-slate-600 text-slate-300" : "border-slate-300 text-slate-700"}`}
                  >
                    @{login}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Risk Profile from DB */}
          <div className={`rounded-2xl border p-5 ${darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <h3 className="text-sm font-semibold uppercase tracking-widest mb-4 text-slate-500">
              Risk Profile ({data.analyses_count} PR{data.analyses_count !== 1 ? "s" : ""} analyzed by you)
            </h3>

            {data.analyses_count === 0 ? (
              <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                No analyses yet for this repo. Run a PR review to start building a risk profile.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-6 flex-wrap">
                  {data.avg_risk_score !== null && (
                    <div>
                      <p className={`text-xs uppercase tracking-widest mb-1 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Avg Risk</p>
                      <p className={`text-3xl font-bold ${riskColor(data.avg_risk_score)}`}>
                        {data.avg_risk_score}
                        <span className="text-base font-normal text-slate-400">/100</span>
                      </p>
                    </div>
                  )}
                  {data.risk_trend.length >= 2 && (
                    <div>
                      <p className={`text-xs uppercase tracking-widest mb-1 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Risk Trend</p>
                      <Sparkline values={data.risk_trend} darkMode={darkMode} />
                    </div>
                  )}
                </div>

                {data.hot_files.length > 0 && (
                  <div>
                    <p className={`text-xs uppercase tracking-widest mb-2 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Frequently Risky Files</p>
                    <ul className="space-y-1">
                      {data.hot_files.map((f) => (
                        <li key={f} className={`text-sm font-mono px-3 py-1.5 rounded-lg ${darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}`}>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
