import { useState } from "react";
import type { FileSummaryData } from "../api/endpoints";

interface FileBreakdownProps {
  files: FileSummaryData[];
  darkMode: boolean;
}

function scoreBadge(score: number): string {
  if (score <= 33) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (score <= 66) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
}

export default function FileBreakdown({ files, darkMode }: FileBreakdownProps) {
  const [expanded, setExpanded] = useState<number | null>(0);

  if (!files.length) return null;

  return (
    <div className="space-y-3">
      {files.map((file, i) => (
        <div
          key={`${file.filename}-${i}`}
          className={`rounded-2xl border overflow-hidden ${
            darkMode ? "border-slate-700 bg-slate-900/70" : "border-slate-200 bg-white"
          }`}
        >
          <button
            className={`w-full flex items-start justify-between gap-4 px-4 py-4 text-left ${
              darkMode ? "hover:bg-slate-800/70" : "hover:bg-slate-50"
            } transition`}
            onClick={() => setExpanded(expanded === i ? null : i)}
          >
            <div className="min-w-0">
              <p className="font-semibold truncate">{file.filename}</p>
              <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                {file.change_summary}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${scoreBadge(file.risk_score)}`}>
                {file.risk_score}/100
              </span>
              <span className={`text-[11px] uppercase tracking-[0.2em] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                {file.coverage_status}
              </span>
            </div>
          </button>

          {expanded === i && (
            <div className={`px-4 pb-4 space-y-3 text-sm ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
              <p>{file.explanation}</p>
              <p className={darkMode ? "text-slate-400" : "text-slate-600"}>{file.why_it_matters}</p>
              {file.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {file.categories.map((category) => (
                    <span
                      key={category}
                      className={`px-2 py-1 rounded-full text-xs border ${
                        darkMode ? "border-slate-700 text-slate-300 bg-slate-800" : "border-slate-200 text-slate-700 bg-slate-50"
                      }`}
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}
              {file.coverage_status === "skipped" && file.skipped_reason && (
                <p className="text-xs text-amber-600 dark:text-amber-300">Skipped: {file.skipped_reason}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
