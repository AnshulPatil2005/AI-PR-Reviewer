import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { analysisApi, type JobData } from "../api/endpoints";
import { describeApiError } from "../api/errors";

const STAGES = ["queued", "fetching_pr", "analyzing_diff", "saving_report"] as const;

const STAGE_LABELS: Record<string, string> = {
  queued:         "Queued",
  fetching_pr:    "Fetching PR",
  analyzing_diff: "Analyzing Diff",
  saving_report:  "Saving Report",
  completed:      "Completed",
  failed:         "Failed",
};

const STAGE_THRESHOLDS: Record<string, number> = {
  queued:         0,
  fetching_pr:    0.1,
  analyzing_diff: 0.45,
  saving_report:  0.8,
};

export default function JobStatusPage() {
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
        if (!isCancelled) setError(describeApiError(err, "Could not load job status."));
      }
    };

    poll();
    return () => { isCancelled = true; };
  }, [id, navigate]);

  const progress = job?.progress ?? 0;

  return (
    <div className="grid-bg min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
      <div className="w-full max-w-xl border border-dashed border-border bg-surface p-8 space-y-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-2">Review Job</p>
          <h1 className="text-2xl font-bold text-fog">Running staged PR analysis</h1>
          {job && (
            <p className="font-mono text-[11px] text-fog-muted mt-2">
              {job.repo_url.replace("https://github.com/", "")} · PR #{job.pr_number}
            </p>
          )}
        </div>

        {error ? (
          <div className="border border-dashed border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400 font-mono">
            {error}
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div>
              <div className="flex justify-between font-mono text-[9px] uppercase tracking-widest text-fog-muted mb-2">
                <span>{STAGE_LABELS[job?.stage ?? "queued"]}</span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <div className="h-1 bg-border w-full">
                <div
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${Math.max(4, progress * 100)}%` }}
                />
              </div>
            </div>

            {/* Stage indicators */}
            <div className="grid grid-cols-4 gap-2">
              {STAGES.map((stage) => {
                const active = job?.stage === stage;
                const done = progress >= (STAGE_THRESHOLDS[stage] ?? 0);
                return (
                  <div
                    key={stage}
                    className={`border border-dashed px-2 py-2 text-center transition-colors ${
                      active
                        ? "border-accent/60 bg-accent/5"
                        : done
                        ? "border-border bg-surface-2"
                        : "border-border opacity-40"
                    }`}
                  >
                    <p className={`font-mono text-[9px] uppercase tracking-[0.14em] ${active ? "text-accent" : "text-fog-muted"}`}>
                      {STAGE_LABELS[stage]}
                    </p>
                  </div>
                );
              })}
            </div>

            <p className="font-mono text-[9px] text-fog-muted text-center">
              Report page opens automatically when the job completes
            </p>
          </>
        )}
      </div>
    </div>
  );
}
