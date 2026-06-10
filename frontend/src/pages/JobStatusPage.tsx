import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { analysisApi, type JobData } from "../api/endpoints";
import { describeApiError } from "../api/errors";

type OutletCtx = { darkMode: boolean };

const stageLabels: Record<string, string> = {
  queued: "Queued",
  fetching_pr: "Fetching PR",
  analyzing_diff: "Analyzing Diff",
  saving_report: "Saving Report",
  completed: "Completed",
  failed: "Failed",
};

const stageThresholds: Record<string, number> = {
  queued: 0,
  fetching_pr: 0.1,
  analyzing_diff: 0.45,
  saving_report: 0.8,
};

export default function JobStatusPage() {
  const { darkMode } = useOutletContext<OutletCtx>();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let isCancelled = false;

    const poll = async () => {
      try {
        const res = await analysisApi.getJob(Number(id));
        if (isCancelled) return;
        setJob(res.data);
        if (res.data.status === "completed" && res.data.analysis_id) {
          navigate(`/analysis/${res.data.analysis_id}`, { replace: true });
          return;
        }
        if (res.data.status === "failed") {
          setError(res.data.error_message || "Review job failed.");
          return;
        }
        window.setTimeout(poll, 1800);
      } catch (err: any) {
        if (!isCancelled) {
          setError(describeApiError(err, "Could not load job status."));
        }
      }
    };

    poll();
    return () => {
      isCancelled = true;
    };
  }, [id, navigate]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <div className={`rounded-[2rem] border p-8 ${darkMode ? "border-slate-700 bg-slate-950/90" : "border-slate-200 bg-white"}`}>
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-500">Review Job</p>
        <h1 className="mt-3 text-3xl font-bold">Running staged PR analysis</h1>

        {error ? (
          <div className={`mt-6 rounded-2xl border p-4 text-sm ${darkMode ? "border-rose-800 bg-rose-900/30 text-rose-300" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
            {error}
          </div>
        ) : (
          <>
            <p className={`mt-4 text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              {job ? `${job.repo_url} • PR #${job.pr_number}` : "Loading job details..."}
            </p>
            <div className={`mt-8 h-3 overflow-hidden rounded-full ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}>
              <div
                className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                style={{ width: `${Math.max(6, (job?.progress || 0) * 100)}%` }}
              />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              {["queued", "fetching_pr", "analyzing_diff", "saving_report"].map((stage) => {
                const active = job?.stage === stage;
                const done = (job?.progress || 0) >= stageThresholds[stage];
                return (
                  <div
                    key={stage}
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      active
                        ? "border-cyan-500 bg-cyan-500/10"
                        : done
                          ? darkMode
                            ? "border-slate-700 bg-slate-900 text-slate-300"
                            : "border-slate-200 bg-slate-50 text-slate-700"
                          : darkMode
                            ? "border-slate-800 bg-slate-950 text-slate-500"
                            : "border-slate-200 bg-white text-slate-400"
                    }`}
                  >
                    {stageLabels[stage]}
                  </div>
                );
              })}
            </div>

            <div className={`mt-8 rounded-2xl border p-5 ${darkMode ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-slate-50"}`}>
              <p className="text-sm font-semibold">Current stage</p>
              <p className={`mt-2 text-lg ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                {stageLabels[job?.stage || "queued"] || job?.stage || "Queued"}
              </p>
              <p className={`mt-2 text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                The report page will open automatically once the job completes.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
