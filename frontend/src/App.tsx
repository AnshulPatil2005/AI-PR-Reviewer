// frontend/src/App.tsx
import { useState, useEffect } from "react";
import axios from "axios";

export default function App() {
  // Persistent state (saves repo/pr in localStorage)
  const [repoUrl, setRepoUrl] = useState(localStorage.getItem("repoUrl") || "");
  const [prNumber, setPrNumber] = useState(localStorage.getItem("prNumber") || "");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );
  const [copied, setCopied] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

  // Theme persistence
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Save inputs persistently
  useEffect(() => {
    localStorage.setItem("repoUrl", repoUrl);
    localStorage.setItem("prNumber", prNumber);
  }, [repoUrl, prNumber]);

  const handleAnalyze = async () => {
    setError("");
    setResult("");
    setLoading(true);
    setProgress(0);

    // Simulated loading bar animation
    const progressInterval = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.random() * 10 : p));
    }, 400);

    const trimmedUrl = repoUrl.trim();
    const pr = Number(prNumber);

    if (!/^https?:\/\/github\.com\/[^/]+\/[^/]+/i.test(trimmedUrl)) {
      setError("❌ Invalid repo URL. Use: https://github.com/<owner>/<repo>");
      clearInterval(progressInterval);
      setLoading(false);
      return;
    }

    if (!Number.isInteger(pr) || pr <= 0) {
      setError("❌ Pull Request number must be a positive integer.");
      clearInterval(progressInterval);
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/analyze`, {
        repo_url: trimmedUrl,
        pr_number: pr,
      });

      setProgress(100);
      clearInterval(progressInterval);
      setResult(JSON.stringify(res.data, null, 2));
    } catch (err: any) {
      clearInterval(progressInterval);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "🚫 Something went wrong. Please check the URL and PR number.";
      setError(detail);
    } finally {
      setTimeout(() => setProgress(0), 1000);
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-gray-100"
          : "bg-gradient-to-br from-slate-50 to-slate-100 text-gray-900"
      } flex items-center justify-center px-4 py-10`}
    >
      <div
        className={`max-w-2xl w-full rounded-2xl shadow-2xl p-8 border transition-all duration-500 ${
          darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
            🧠 Agentic PR Copilot
          </h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            title="Toggle theme"
          >
            {darkMode ? "🌞" : "🌙"}
          </button>
        </div>

        <p className="text-sm opacity-80 mb-6">
          Analyze any GitHub Pull Request for risk and AI-driven improvement
          suggestions.
        </p>

        {/* Inputs */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-1">
              GitHub Repository URL
            </label>
            <input
              type="text"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition ${
                darkMode
                  ? "bg-slate-800 border-slate-700 focus:ring-blue-400"
                  : "bg-white border-slate-300 focus:ring-blue-500"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">
              Pull Request Number
            </label>
            <input
              type="number"
              placeholder="e.g. 42"
              value={prNumber}
              onChange={(e) => setPrNumber(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition ${
                darkMode
                  ? "bg-slate-800 border-slate-700 focus:ring-blue-400"
                  : "bg-white border-slate-300 focus:ring-blue-500"
              }`}
            />
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition transform active:scale-[0.98] shadow ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Analyzing..." : "Analyze Pull Request"}
          </button>

          {/* Progress Bar */}
          {loading && (
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              className={`mt-4 rounded-lg p-3 text-center text-sm font-medium border ${
                darkMode
                  ? "bg-red-900/30 border-red-700 text-red-300"
                  : "bg-red-50 border-red-200 text-red-700"
              } whitespace-pre-wrap`}
            >
              {error}
            </div>
          )}
        </div>

        {/* Result Section */}
        {result && (
          <div
            className={`mt-8 rounded-lg p-4 text-sm border overflow-auto max-h-96 transition-all duration-700 ${
              darkMode
                ? "bg-slate-800 border-slate-700 text-slate-200"
                : "bg-slate-50 border-slate-200 text-slate-800"
            } animate-fade-in`}
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-blue-600 dark:text-blue-400">
                🧾 AI Analysis Result
              </h2>
              <button
                onClick={copyToClipboard}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                {copied ? "✅ Copied!" : "Copy JSON"}
              </button>
            </div>
            <pre className="whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
