import type { FindingData } from "../api/endpoints";

interface FindingFeedProps {
  findings: FindingData[];
  darkMode: boolean;
}

function severityClasses(severity: FindingData["severity"]) {
  switch (severity) {
    case "critical":
      return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800";
    case "high":
      return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800";
    case "medium":
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
    default:
      return "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800";
  }
}

export default function FindingFeed({ findings, darkMode }: FindingFeedProps) {
  if (!findings.length) {
    return (
      <div className={`rounded-2xl border p-4 text-sm ${darkMode ? "border-slate-700 bg-slate-900/70 text-slate-300" : "border-slate-200 bg-white text-slate-700"}`}>
        No structured findings were generated for this review.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {findings.map((finding, index) => (
        <article
          key={`${finding.file_path}-${finding.title}-${index}`}
          className={`rounded-2xl border p-4 ${darkMode ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white"}`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${severityClasses(finding.severity)}`}>
              {finding.severity}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] ${darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}`}>
              {finding.category}
            </span>
            <span className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
              Confidence {Math.round(finding.confidence * 100)}%
            </span>
          </div>

          <h4 className="mt-3 font-semibold">{finding.title}</h4>
          <p className={`mt-2 text-sm leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
            {finding.detail}
          </p>
          {finding.suggested_fix && (
            <p className={`mt-3 text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              Suggested fix: {finding.suggested_fix}
            </p>
          )}
          <div className={`mt-3 text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
            {finding.file_path || "PR-wide finding"} • {finding.source}
          </div>
        </article>
      ))}
    </div>
  );
}
