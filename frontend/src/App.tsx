import { useState } from "react";
import axios from "axios";

function App() {
  const [repoUrl, setRepoUrl] = useState("");
  const [prNumber, setPrNumber] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    setResult("");

    try {
      const response = await axios.post("http://localhost:8000/analyze_pr/", {
        repo_url: repoUrl,
        pr_number: parseInt(prNumber),
      });

      setResult(JSON.stringify(response.data, null, 2));
    } catch (err) {
      setError("🚫 Something went wrong. Please check the URL and PR number.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-4xl font-bold mb-6 text-center text-blue-700">
          🧠 Agentic PR Copilot
        </h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              GitHub Repo URL
            </label>
            <input
              type="text"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Pull Request Number
            </label>
            <input
              type="number"
              placeholder="e.g. 42"
              value={prNumber}
              onChange={(e) => setPrNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className={`w-full py-2 px-4 rounded-lg font-semibold text-white transition ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Analyzing..." : "Analyze Pull Request"}
          </button>

          {error && (
            <div className="text-red-600 text-center font-medium">{error}</div>
          )}
        </div>

        {result && (
          <div className="mt-6 bg-gray-100 rounded-lg p-4 text-sm overflow-auto max-h-96 whitespace-pre-wrap">
            <h2 className="font-bold text-gray-700 mb-2">Result:</h2>
            <pre>{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
