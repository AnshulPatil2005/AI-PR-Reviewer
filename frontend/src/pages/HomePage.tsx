import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight, GitPullRequest, GitBranch, Shield, Bug, Zap,
  Brain, Code2, BarChart2, CheckCircle, Cpu, X,
} from "lucide-react";
import { analysisApi, type ReviewMode } from "../api/endpoints";
import { describeApiError } from "../api/errors";
import { useAuth } from "../context/AuthContext";
import PRMockup from "../components/landing/PRMockup";

// ─── Landing page (unauthenticated) ─────────────────────────────

const STATS = [
  { value: "2.4k+", label: "PRs reviewed" },
  { value: "47%",   label: "Faster review" },
  { value: "99.2%", label: "Uptime SLA" },
];

const HOW_STEPS = [
  { icon: GitBranch,   step: "01", title: "Connect your repo",    desc: "Authorize on GitHub, GitLab, or Bitbucket in one click. No webhook config." },
  { icon: GitPullRequest, step: "02", title: "Open a pull request", desc: "Work exactly as you do today. Copilot picks up every PR automatically." },
  { icon: Cpu,         step: "03", title: "AI reviews in seconds", desc: "Parse diffs, run heuristic checks, then LLM review on critical files — not the whole codebase." },
  { icon: CheckCircle, step: "04", title: "Merge with confidence", desc: "Structured feedback with severity levels and actionable suggestions right in your PR." },
];

const FEATURES = [
  { icon: Shield,   title: "Security scanning",     tag: "Security",     desc: "Detects injection vectors, exposed secrets, insecure deps, and auth bypass patterns." },
  { icon: Bug,      title: "Logic analysis",         tag: "Correctness",  desc: "Catches null dereferences, off-by-ones, missing error branches, and async races." },
  { icon: Zap,      title: "Performance profiling",  tag: "Performance",  desc: "Flags N+1 queries, unnecessary re-renders, unbounded loops, and memory leaks." },
  { icon: Brain,    title: "Codebase context",       tag: "Intelligence", desc: "Analyzes changes in context of the surrounding file — reducing false positives by 60%." },
  { icon: Code2,    title: "Multi-language",         tag: "Coverage",     desc: "Python, TypeScript, Go, Rust, Java, Ruby, C++ and more with per-language heuristics." },
  { icon: BarChart2,  title: "Risk analytics",       tag: "Analytics",    desc: "Track quality over time. Spot which files consistently introduce risk." },
] as const;

function AnnouncementBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="relative bg-accent/8 border-b border-dashed border-accent/20 py-2 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2.5">
        <Zap size={11} className="text-accent shrink-0" />
        <p className="font-mono text-[11px] uppercase tracking-widest text-fog-dim">
          Multi-file context analysis is now live —
        </p>
        <Link to="/register" className="font-mono text-[11px] uppercase tracking-widest text-accent hover:underline underline-offset-2 shrink-0">
          Try it free →
        </Link>
        <button
          onClick={() => setVisible(false)}
          aria-label="Dismiss"
          className="absolute right-4 text-fog-muted hover:text-fog transition-colors p-1"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

function LandingView() {
  return (
    <div className="bg-bg text-fog">
      <AnnouncementBanner />

      {/* ── Hero ── */}
      <section className="relative grid-bg overflow-hidden">
        <div
          className="absolute pointer-events-none"
          style={{ top: "15%", left: "3%", width: 480, height: 480,
            background: "radial-gradient(circle, rgba(0,230,118,0.06) 0%, transparent 70%)" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left */}
            <div className="space-y-7 animate-fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-dashed border-accent/30 bg-accent/5">
                <GitPullRequest size={11} className="text-accent" />
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
                  Free forever for open source projects
                </span>
              </div>

              <h1 className="text-[2.6rem] sm:text-[3.25rem] lg:text-[3.5rem] leading-[1.08] font-bold text-fog tracking-tight">
                Ship code you can{" "}
                <span className="text-accent text-glow">stand behind</span>
              </h1>

              <p className="text-base sm:text-lg text-fog-dim leading-relaxed max-w-xl">
                AI PR Copilot reviews every pull request in seconds — catching security
                vulnerabilities, logic bugs, and performance issues before they reach users.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="clip-notch inline-flex items-center gap-2 bg-accent text-bg font-mono text-[11px] uppercase tracking-[0.14em] font-bold px-6 py-3 hover:shadow-glow transition-shadow"
                >
                  Start reviewing free <ArrowRight size={13} />
                </Link>
                <a
                  href="#how-it-works"
                  className="clip-notch inline-flex items-center gap-2 border border-dashed border-accent/30 text-fog-dim font-mono text-[11px] uppercase tracking-[0.14em] px-6 py-3 hover:border-accent/50 hover:text-fog transition-all"
                >
                  See how it works
                </a>
              </div>

              <div className="flex gap-8 pt-2">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <div className="font-mono text-2xl font-bold text-accent text-glow">{s.value}</div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-fog-muted mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: PR mockup */}
            <div className="animate-float">
              <PRMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 border-y border-dashed border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-16">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-fog">
              From push to review in under 30 seconds
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0">
            {HOW_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.step}
                  className="p-6 border border-dashed border-border hover:border-accent/30 transition-colors group"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 flex items-center justify-center border border-dashed border-accent/30 group-hover:border-accent/60 transition-colors">
                      <Icon size={14} className="text-accent" />
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog-muted">
                      Step {step.step}
                    </span>
                  </div>
                  <h3 className="font-semibold text-fog text-[15px] mb-2">{step.title}</h3>
                  <p className="text-fog-muted text-sm leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Feature grid ── */}
      <section className="py-24 border-b border-dashed border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-16">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-fog">
              Everything your team needs to review confidently
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="p-6 border border-dashed border-border hover:border-accent/25 hover:bg-surface/50 transition-all group cursor-default"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-9 h-9 flex items-center justify-center border border-dashed border-border group-hover:border-accent/40 transition-colors">
                      <Icon size={16} className="text-accent" />
                    </div>
                    <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-fog-muted border border-dashed border-border px-1.5 py-0.5">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="font-semibold text-fog text-[15px] mb-2">{f.title}</h3>
                  <p className="text-fog-muted text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="py-24 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(0,230,118,0.06) 0%, transparent 70%)" }}
        />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-[2.75rem] font-bold text-fog leading-tight mb-5">
            Ready to review with confidence?
          </h2>
          <p className="text-fog-dim text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            Set up in 2 minutes. No credit card required. 10 free PR analyses every month.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="clip-notch inline-flex items-center gap-2 bg-accent text-bg font-mono text-[11px] uppercase tracking-[0.14em] font-bold px-7 py-3.5 hover:shadow-glow transition-shadow w-full sm:w-auto justify-center"
            >
              Create free account <ArrowRight size={13} />
            </Link>
            <Link
              to="/login"
              className="clip-notch inline-flex items-center gap-2 border border-dashed border-accent/30 text-fog-dim font-mono text-[11px] uppercase tracking-[0.14em] px-7 py-3.5 hover:border-accent/50 hover:text-fog transition-all w-full sm:w-auto justify-center"
            >
              Already have an account
            </Link>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-fog-muted mt-8">
            Your code is never used for training · Ephemeral processing · OSS friendly
          </p>
        </div>
      </section>
    </div>
  );
}

// ─── Analyze form (authenticated) ───────────────────────────────

const REVIEW_MODES: Array<{ id: ReviewMode; label: string; desc: string }> = [
  { id: "general",         label: "General",         desc: "Balanced correctness, maintainability, and change-risk review." },
  { id: "security",        label: "Security",         desc: "Focused on auth, permissions, secrets, and unsafe execution." },
  { id: "performance",     label: "Performance",      desc: "Expensive paths, scaling risks, and perf regressions." },
  { id: "maintainability", label: "Maintainability",  desc: "Clarity, cohesion, and testability of the diff." },
];

function isGitHubRepoUrl(value: string) {
  return /^https?:\/\/github\.com\/[^/]+\/[^/]+/i.test(value.trim());
}

function AnalyzeView() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl]     = useState(localStorage.getItem("repoUrl")     || "");
  const [prNumber, setPrNumber]   = useState(localStorage.getItem("prNumber")    || "");
  const [reviewMode, setReviewMode] = useState<ReviewMode>(
    (localStorage.getItem("reviewMode") as ReviewMode) || "general"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    localStorage.setItem("repoUrl",     repoUrl);
    localStorage.setItem("prNumber",    prNumber);
    localStorage.setItem("reviewMode",  reviewMode);
  }, [repoUrl, prNumber, reviewMode]);

  const handleAnalyze = async () => {
    setError("");
    const trimmedUrl = repoUrl.trim();
    const pr = Number(prNumber);

    if (!isGitHubRepoUrl(trimmedUrl)) {
      setError("Invalid repo URL. Use https://github.com/<owner>/<repo>.");
      return;
    }
    if (!Number.isInteger(pr) || pr <= 0) {
      setError("PR number must be a positive integer.");
      return;
    }
    try {
      setLoading(true);
      const res = await analysisApi.createJob(trimmedUrl, pr, reviewMode);
      refreshUser();
      navigate(`/jobs/${res.data.id}`);
    } catch (err: any) {
      const msg = describeApiError(err, "Could not create review job.");
      setError(err?.response?.status === 429 ? `Monthly quota reached. ${msg}` : msg);
    } finally {
      setLoading(false);
    }
  };

  const atLimit = !!user && user.analyses_this_month >= user.monthly_quota;

  return (
    <div className="grid-bg min-h-[calc(100vh-56px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-12 lg:gap-16 items-start">

          {/* Left: copy + recent links */}
          <div className="space-y-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-3">
                Welcome back
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-fog tracking-tight">
                Start a PR review
              </h1>
              <p className="mt-3 text-fog-muted text-base leading-relaxed max-w-lg">
                Paste a GitHub repo URL and PR number. The agentic pipeline parses the diff,
                runs heuristic checks, and calls an LLM review chain on critical files.
              </p>
            </div>

            {/* Quick-action cards */}
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                "Typed findings: bug risk, security, performance, breaking changes",
                "Coverage metadata showing what was reviewed, skipped, or truncated",
                "Async job flow with reruns, comparisons, and reviewer-friendly exports",
              ].map((item) => (
                <div
                  key={item}
                  className="border border-dashed border-border bg-surface p-4 text-sm text-fog-muted leading-relaxed"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <Link
                to="/history"
                className="font-mono text-[10px] uppercase tracking-widest text-fog-muted hover:text-fog transition-colors border-b border-dashed border-fog-muted/30 hover:border-accent/40 pb-0.5"
              >
                View history →
              </Link>
              <Link
                to="/repos"
                className="font-mono text-[10px] uppercase tracking-widest text-fog-muted hover:text-fog transition-colors border-b border-dashed border-fog-muted/30 hover:border-accent/40 pb-0.5"
              >
                Repo analytics →
              </Link>
            </div>
          </div>

          {/* Right: form */}
          <div className="border border-dashed border-border bg-surface p-6 space-y-5">
            {/* Repo URL */}
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.16em] text-fog-muted mb-2">
                GitHub Repository URL
              </label>
              <input
                type="text"
                placeholder="https://github.com/owner/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full bg-bg border border-dashed border-border text-fog font-mono text-sm px-4 py-3 focus:outline-none focus:border-accent/50 transition-colors placeholder:text-fog-muted"
              />
            </div>

            {/* PR number */}
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.16em] text-fog-muted mb-2">
                Pull Request Number
              </label>
              <input
                type="number"
                placeholder="e.g. 42"
                value={prNumber}
                onChange={(e) => setPrNumber(e.target.value)}
                className="w-full bg-bg border border-dashed border-border text-fog font-mono text-sm px-4 py-3 focus:outline-none focus:border-accent/50 transition-colors placeholder:text-fog-muted"
              />
            </div>

            {/* Review mode */}
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.16em] text-fog-muted mb-3">
                Review Mode
              </label>
              <div className="grid gap-2">
                {REVIEW_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setReviewMode(mode.id)}
                    className={`p-3 text-left border border-dashed transition-all ${
                      reviewMode === mode.id
                        ? "border-accent/50 bg-accent/5"
                        : "border-border hover:border-accent/30"
                    }`}
                  >
                    <p className={`font-mono text-[11px] uppercase tracking-widest font-semibold ${reviewMode === mode.id ? "text-accent" : "text-fog"}`}>
                      {mode.label}
                    </p>
                    <p className="text-fog-muted text-xs mt-0.5 leading-relaxed">{mode.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="border border-dashed border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400 font-mono">
                {error}
              </div>
            )}

            {/* Quota limit */}
            {atLimit && (
              <div className="border border-dashed border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400 font-mono text-center">
                Monthly limit reached ({user!.monthly_quota} analyses).
                Resets {user!.quota_resets_on ?? "next month"}.
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleAnalyze}
              disabled={loading || atLimit}
              className="w-full clip-notch bg-accent text-bg font-mono text-[11px] uppercase tracking-[0.14em] font-bold py-4 hover:shadow-glow transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? "Creating review job…" : (<>Start PR Review <ArrowRight size={13} /></>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Route component ─────────────────────────────────────────────

export default function HomePage() {
  const { user } = useAuth();
  return user ? <AnalyzeView /> : <LandingView />;
}
