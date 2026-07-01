import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { repoApi, type RepoAnalyticsData } from "../api/endpoints";

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const w = 200;
  const h = 40;
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
        stroke="#00e676"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function riskColor(score: number): string {
  if (score >= 70) return "#ef4444";
  if (score >= 40) return "#eab308";
  return "#00e676";
}

export default function RepoAnalyticsPage() {
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

  const inputCls = "w-full bg-bg border border-dashed border-border text-fog font-mono text-sm px-4 py-3 focus:outline-none focus:border-accent/50 transition-colors placeholder:text-fog-muted";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-2">Analytics</p>
        <h1 className="text-3xl font-bold text-fog">Repo Analytics</h1>
        <p className="text-fog-muted text-sm mt-2">
          GitHub stats + risk profile from your past PR analyses. No LLM — instant results.
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
          className="shrink-0 clip-notch bg-accent text-bg font-mono text-[11px] uppercase tracking-[0.14em] font-bold px-5 py-3 hover:shadow-glow transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? "Loading…" : (<>Analyze <ArrowRight size={13} /></>)}
        </button>
      </div>

      {error && (
        <div className="border border-dashed border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400 font-mono">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-5">
          {/* Repo header */}
          <div className="border border-dashed border-border bg-surface p-5">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold text-fog">{data.repo_name}</h2>
                {data.description && (
                  <p className="text-fog-muted text-sm mt-1">{data.description}</p>
                )}
              </div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-fog-muted border border-dashed border-border px-2 py-1">
                {data.language}
              </span>
            </div>
            {data.last_pushed_at && (
              <p className="font-mono text-[9px] text-fog-muted mt-3">
                Last pushed: {new Date(data.last_pushed_at).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Stats grid */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog-muted mb-3">GitHub Stats</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Stars",      value: data.stars.toLocaleString() },
                { label: "Forks",      value: data.forks.toLocaleString() },
                { label: "Open PRs",   value: data.open_prs },
                { label: "Merged 30d", value: data.prs_merged_last_30d },
              ].map(({ label, value }) => (
                <div key={label} className="border border-dashed border-border bg-surface p-4">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-fog-muted mb-1">{label}</p>
                  <p className="font-mono text-2xl font-bold text-fog">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top contributors */}
          {data.top_contributors.length > 0 && (
            <div className="border border-dashed border-border bg-surface p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog-muted mb-3">Top Contributors</p>
              <div className="flex flex-wrap gap-2">
                {data.top_contributors.map((login) => (
                  <span
                    key={login}
                    className="font-mono text-[11px] text-fog-dim border border-dashed border-border px-2.5 py-1"
                  >
                    @{login}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Risk profile */}
          <div className="border border-dashed border-border bg-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog-muted mb-4">
              Risk Profile · {data.analyses_count} PR{data.analyses_count !== 1 ? "s" : ""} analyzed
            </p>

            {data.analyses_count === 0 ? (
              <p className="text-fog-muted text-sm">
                No analyses yet for this repo. Run a PR review to start building a risk profile.
              </p>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start gap-10 flex-wrap">
                  {data.avg_risk_score !== null && (
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-fog-muted mb-1">Avg Risk</p>
                      <p className="font-mono text-3xl font-bold" style={{ color: riskColor(data.avg_risk_score) }}>
                        {data.avg_risk_score}
                        <span className="text-base font-normal text-fog-muted">/100</span>
                      </p>
                    </div>
                  )}
                  {data.risk_trend.length >= 2 && (
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-fog-muted mb-2">Risk Trend</p>
                      <Sparkline values={data.risk_trend} />
                    </div>
                  )}
                </div>

                {data.hot_files.length > 0 && (
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-fog-muted mb-2">Frequently Risky Files</p>
                    <div className="space-y-1">
                      {data.hot_files.map((f) => (
                        <p key={f} className="font-mono text-sm text-fog-dim border border-dashed border-border px-3 py-1.5">
                          {f}
                        </p>
                      ))}
                    </div>
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
