import { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { analysisApi } from "../api/endpoints";
import type { AnalysisSummaryData } from "../api/endpoints";

type OutletCtx = { darkMode: boolean };

function riskBadge(score: number): string {
  if (score <= 33) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (score <= 66) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
}

export default function HistoryPage() {
  const { darkMode } = useOutletContext<OutletCtx>();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<AnalysisSummaryData[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPage = async (p: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await analysisApi.list(p, 20);
      setAnalyses(res.data);
      setPage(p);
    } catch {
      setError("Failed to load analysis history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPage(1); }, []);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this analysis?")) return;
    await analysisApi.delete(id);
    setAnalyses((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6 text-blue-600 dark:text-blue-400">Analysis History</h1>

      {loading && <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Loading...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && analyses.length === 0 && (
        <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          No analyses yet.{" "}
          <button onClick={() => navigate("/")} className="text-blue-500 hover:underline">
            Analyze a PR
          </button>
          .
        </p>
      )}

      {analyses.length > 0 && (
        <div className={`rounded-xl border overflow-hidden ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
          <table className="w-full text-sm">
            <thead className={darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-50 text-slate-600"}>
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Repository</th>
                <th className="px-4 py-3 text-left font-semibold">PR</th>
                <th className="px-4 py-3 text-left font-semibold">Risk</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {analyses.map((a, i) => (
                <tr
                  key={a.id}
                  onClick={() => navigate(`/analysis/${a.id}`)}
                  className={`cursor-pointer border-t transition ${
                    darkMode
                      ? `border-slate-700 ${i % 2 === 0 ? "bg-slate-900" : "bg-slate-800/60"} hover:bg-slate-700`
                      : `border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/60"} hover:bg-slate-100`
                  }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-xs opacity-70">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate">
                    {a.repo_url.replace("https://github.com/", "")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono">#{a.pr_number}</span>
                    {a.pr_title && (
                      <span className="ml-2 opacity-60 truncate hidden md:inline">{a.pr_title}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${riskBadge(a.risk_score)}`}>
                      {a.risk_score}/100
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => handleDelete(a.id, e)}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-2 mt-4 justify-end">
        {page > 1 && (
          <button
            onClick={() => fetchPage(page - 1)}
            className="px-3 py-1 text-sm rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Previous
          </button>
        )}
        {analyses.length === 20 && (
          <button
            onClick={() => fetchPage(page + 1)}
            className="px-3 py-1 text-sm rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
