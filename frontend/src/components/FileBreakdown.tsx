import { useState } from "react";
import type { FileAnalysisData } from "../api/endpoints";

interface FileBreakdownProps {
  files: FileAnalysisData[];
  darkMode: boolean;
}

function scoreBadge(score: number): string {
  if (score <= 33) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (score <= 66) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
}

export default function FileBreakdown({ files, darkMode }: FileBreakdownProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (!files.length) return null;

  return (
    <div className="space-y-2">
      {files.map((file, i) => (
        <div
          key={i}
          className={`rounded-lg border overflow-hidden ${
            darkMode ? "border-slate-700" : "border-slate-200"
          }`}
        >
          <button
            className={`w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-left ${
              darkMode ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-50 hover:bg-slate-100"
            } transition`}
            onClick={() => setExpanded(expanded === i ? null : i)}
          >
            <span className="truncate max-w-xs">{file.filename}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${scoreBadge(file.risk_score)}`}>
                {file.risk_score}/100
              </span>
              <span className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                {expanded === i ? "▲" : "▼"}
              </span>
            </div>
          </button>
          {expanded === i && (
            <div className={`px-4 py-3 text-sm ${darkMode ? "text-slate-300 bg-slate-900" : "text-slate-700 bg-white"}`}>
              {file.explanation}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
