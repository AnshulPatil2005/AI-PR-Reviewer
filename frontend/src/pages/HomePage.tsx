import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { analysisApi, type ReviewMode } from "../api/endpoints";
import { describeApiError } from "../api/errors";
import { useAuth } from "../context/AuthContext";

type OutletCtx = { darkMode: boolean };

const reviewModes: Array<{ id: ReviewMode; label: string; description: string }> = [
  { id: "general", label: "General Review", description: "Balanced correctness, maintainability, and change-risk review." },
  { id: "security", label: "Security Focus", description: "Bias analysis toward auth, permissions, secrets, and unsafe execution." },
  { id: "performance", label: "Performance Focus", description: "Bias analysis toward expensive paths, scaling risks, and regressions." },
  { id: "maintainability", label: "Maintainability Focus", description: "Bias analysis toward clarity, cohesion, and testability." },
];

function isGitHubRepoUrl(value: string) {
  return /^https?:\/\/github\.com\/[^/]+\/[^/]+/i.test(value.trim());
}

export default function HomePage() {
  const { darkMode } = useOutletContext<OutletCtx>();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState(localStorage.getItem("repoUrl") || "");
  const [prNumber, setPrNumber] = useState(localStorage.getItem("prNumber") || "");
  const [reviewMode, setReviewMode] = useState<ReviewMode>(
    (localStorage.getItem("reviewMode") as ReviewMode) || "general"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem("repoUrl", repoUrl);
    localStorage.setItem("prNumber", prNumber);
    localStorage.setItem("reviewMode", reviewMode);
  }, [repoUrl, prNumber, reviewMode]);

  const handleAnalyze = async () => {
    setError("");
    const trimmedUrl = repoUrl.trim();
    const pr = Number(prNumber);

    if (!user) {
      setError("Sign in first to create and track review jobs.");
      return;
    }
    if (!isGitHubRepoUrl(trimmedUrl)) {
      setError("Invalid repo URL. Use https://github.com/<owner>/<repo>.");
      return;
    }
    if (!Number.isInteger(pr) || pr <= 0) {
      setError("Pull Request number must be a positive integer.");
      return;
    }

    try {
      setLoading(true);
      const res = await analysisApi.createJob(trimmedUrl, pr, reviewMode);
      refreshUser(); // update quota badge (fire-and-forget)
      navigate(`/jobs/${res.data.id}`);
    } catch (err: any) {
      const msg = describeApiError(err, "Could not create review job.");
      setError(err?.response?.status === 429 ? `Monthly quota reached. ${msg}` : msg);
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
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="grid gap-8 lg:grid-cols-[1.15fr,0.85fr]">
        <div className="space-y-5">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-500">Version 2</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
              Turn PR diffs into a structured review workspace, not just a score.
            </h1>
            <p className={`mt-4 max-w-2xl text-base leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
              Agentic PR Copilot now runs staged analysis with findings, per-file review, trust signals, reruns, and exportable outputs for GitHub review workflows.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              "Typed findings across bug risk, security, performance, and breaking changes",
              "Coverage metadata showing what was reviewed, skipped, or truncated",
              "Async job flow with reruns, comparisons, and reviewer-friendly exports",
            ].map((item) => (
              <div
                key={item}
                className={`rounded-3xl border p-4 text-sm ${
                  darkMode ? "border-slate-700 bg-slate-900/80 text-slate-300" : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-[2rem] border p-6 shadow-2xl ${darkMode ? "border-slate-700 bg-slate-950/90" : "border-slate-200 bg-white"}`}>
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold">GitHub Repository URL</label>
              <input
                type="text"
                placeholder="https://github.com/owner/repo"
                value={repoUrl}
                onChange={(event) => setRepoUrl(event.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">Pull Request Number</label>
              <input
                type="number"
                placeholder="e.g. 42"
                value={prNumber}
                onChange={(event) => setPrNumber(event.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-semibold">Review Mode</label>
              <div className="grid gap-3">
                {reviewModes.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setReviewMode(mode.id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      reviewMode === mode.id
                        ? "border-cyan-500 bg-cyan-500/10"
                        : darkMode
                          ? "border-slate-700 bg-slate-900 hover:border-slate-600"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <p className="font-semibold">{mode.label}</p>
                    <p className={`mt-1 text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>{mode.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className={`rounded-2xl border p-3 text-sm ${darkMode ? "border-rose-800 bg-rose-900/30 text-rose-300" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                {error}
              </div>
            )}

            {user && user.analyses_this_month >= user.monthly_quota && (
              <p className={`text-sm text-center rounded-2xl border p-3 ${darkMode ? "border-red-800 bg-red-900/30 text-red-400" : "border-red-200 bg-red-50 text-red-600"}`}>
                Monthly limit reached ({user.monthly_quota} analyses). Resets {user.quota_resets_on ?? "next month"}.
              </p>
            )}
            <button
              onClick={handleAnalyze}
              disabled={loading || (!!user && user.analyses_this_month >= user.monthly_quota)}
              className="w-full rounded-2xl bg-cyan-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating Review Job..." : "Start PR Review"}
            </button>

            {!user && (
              <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                You need an account to store review jobs and history. <Link to="/login" className="text-cyan-500 hover:underline">Sign in</Link>.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
