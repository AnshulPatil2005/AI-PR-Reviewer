import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { analysisApi } from "../api/endpoints";
import type { AnalysisData } from "../api/endpoints";
import AnalysisSummary from "../components/AnalysisSummary";

type OutletCtx = { darkMode: boolean };

export default function HomePage() {
  const { darkMode } = useOutletContext<OutletCtx>();
  const [repoUrl, setRepoUrl] = useState(localStorage.getItem("repoUrl") || "");
  const [prNumber, setPrNumber] = useState(localStorage.getItem("prNumber") || "");
  const [result, setResult] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    localStorage.setItem("repoUrl", repoUrl);
    localStorage.setItem("prNumber", prNumber);
  }, [repoUrl, prNumber]);

  const handleAnalyze = async () => {
    setError("");
    setResult(null);
    setLoading(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.random() * 10 : p));
    }, 400);

    const trimmedUrl = repoUrl.trim();
    const pr = Number(prNumber);

    if (!/^https?:\/\/github\.com\/[^/]+\/[^/]+/i.test(trimmedUrl)) {
      setError("Invalid repo URL. Use: https://github.com/<owner>/<repo>");
      clearInterval(progressInterval);
      setLoading(false);
      return;
    }

    if (!Number.isInteger(pr) || pr <= 0) {
      setError("Pull Request number must be a positive integer.");
      clearInterval(progressInterval);
      setLoading(false);
      return;
    }

    try {
      const res = await analysisApi.analyze(trimmedUrl, pr);
      setProgress(100);
      clearInterval(progressInterval);
      setResult(res.data);
    } catch (err: any) {
      clearInterval(progressInterval);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Something went wrong. Please check the URL and PR number.";
      if (err?.response?.status === 401) {
        setError("You must be logged in to analyze pull requests.");
      } else {
        setError(detail);
      }
    } finally {
      setTimeout(() => setProgress(0), 1000);
      setLoading(false);
    }
  };

  const inputCls = `w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition ${
    darkMode
      ? "bg-slate-800 border-slate-700 focus:ring-blue-400"
      : "bg-white border-slate-300 focus:ring-blue-500"
  }`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div
        className={`rounded-2xl shadow-2xl p-8 border transition-all duration-500 ${
          darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
        }`}
      >
        <p className={`text-sm mb-6 ${darkMode ? "opacity-70" : "opacity-60"}`}>
          Analyze any GitHub Pull Request for risk and AI-driven improvement suggestions.
        </p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-1">GitHub Repository URL</label>
            <input
              type="text"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Pull Request Number</label>
            <input
              type="number"
              placeholder="e.g. 42"
              value={prNumber}
              onChange={(e) => setPrNumber(e.target.value)}
              className={inputCls}
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition transform active:scale-[0.98] shadow ${
              loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Analyzing..." : "Analyze Pull Request"}
          </button>

          {loading && (
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {error && (
            <div
              className={`rounded-lg p-3 text-sm font-medium border ${
                darkMode
                  ? "bg-red-900/30 border-red-700 text-red-300"
                  : "bg-red-50 border-red-200 text-red-700"
              } whitespace-pre-wrap`}
            >
              {error}
            </div>
          )}
        </div>

        {result && (
          <div className="mt-8">
            <h2 className="font-bold text-blue-600 dark:text-blue-400 mb-4">AI Analysis Result</h2>
            <AnalysisSummary analysis={result} darkMode={darkMode} />
          </div>
        )}
      </div>
    </div>
  );
}
