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
  { value: "47%",   label: "Faster review cycle" },
  { value: "99.2%", label: "Uptime" },
];

const HOW_STEPS = [
  { icon: GitBranch,      num: "1", title: "Connect your repo",     desc: "Authorize on GitHub in one click. No webhook config, no YAML files." },
  { icon: GitPullRequest, num: "2", title: "Open a pull request",   desc: "Work exactly as you do today. The copilot picks up every PR automatically." },
  { icon: Cpu,            num: "3", title: "AI reviews in seconds", desc: "Diff parsing, heuristic checks, then LLM review on the critical files." },
  { icon: CheckCircle,    num: "4", title: "Merge with confidence", desc: "Severity-ranked findings and actionable suggestions, directly in the PR." },
];

const FEATURES = [
  { icon: Shield,    title: "Security scanning",    tag: "Security",     desc: "Injection vectors, exposed secrets, insecure deps, and auth bypass patterns." },
  { icon: Bug,       title: "Logic analysis",        tag: "Correctness",  desc: "Null dereferences, off-by-ones, missing error branches, and async races." },
  { icon: Zap,       title: "Performance profiling", tag: "Performance",  desc: "N+1 queries, unnecessary re-renders, unbounded loops, and memory leaks." },
  { icon: Brain,     title: "Codebase context",      tag: "Intelligence", desc: "Analyzes changes against the surrounding file — reducing false positives by 60%." },
  { icon: Code2,     title: "Multi-language",        tag: "Coverage",     desc: "Python, TypeScript, Go, Rust, Java, Ruby, C++ with per-language heuristics." },
  { icon: BarChart2, title: "Risk analytics",        tag: "Analytics",    desc: "Track quality over time. Surface which files consistently introduce risk." },
] as const;

function AnnouncementBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="relative bg-accent/6 border-b border-dashed border-accent/15 py-2 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2.5">
        <Zap size={11} className="text-accent shrink-0" />
        <p className="font-mono text-[11px] uppercase tracking-widest text-fog-muted">
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
        {/* Warm ambient glow — top left */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-5%", left: "-5%", width: 600, height: 600,
            background: "radial-gradient(circle, rgba(224,148,0,0.055) 0%, transparent 65%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left */}
            <div className="space-y-8 animate-fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-dashed border-accent/25 bg-accent/5">
                <GitPullRequest size={10} className="text-accent" />
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
                  Free for open source
                </span>
              </div>

              <div>
                <h1 className="font-display text-[2.8rem] sm:text-[3.4rem] lg:text-[3.6rem] leading-[1.04] font-bold text-fog tracking-tight">
                  Ship code you can{" "}
                  <span className="text-accent text-glow">stand behind.</span>
                </h1>
                <p className="mt-5 text-base sm:text-lg text-fog-dim leading-relaxed max-w-lg">
                  AI PR Copilot reviews every pull request in seconds — catching security
                  vulnerabilities, logic bugs, and performance issues before they reach users.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="clip-notch inline-flex items-center gap-2 bg-accent text-bg font-mono text-[11px] uppercase tracking-[0.14em] font-bold px-6 py-3 hover:shadow-glow transition-shadow"
                >
                  Start reviewing free <ArrowRight size={13} />
                </Link>
                <a
                  href="#how-it-works"
                  className="clip-notch inline-flex items-center gap-2 border border-dashed border-border text-fog-dim font-mono text-[11px] uppercase tracking-[0.14em] px-6 py-3 hover:border-accent/40 hover:text-fog transition-all"
                >
                  See how it works
                </a>
              </div>

              {/* Stats */}
              <div className="flex gap-10 pt-1 border-t border-dashed border-border">
                {STATS.map((s) => (
                  <div key={s.label} className="pt-5">
                    <div className="font-display text-3xl font-bold text-accent text-glow">{s.value}</div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-fog-muted mt-1">{s.label}</div>
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
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-fog tracking-tight">
              From push to review in under 30 seconds
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0">
            {HOW_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="p-6 border border-dashed border-border hover:border-accent/30 transition-colors group relative overflow-hidden"
                >
                  {/* Large decorative number — not a label, just texture */}
                  <span
                    className="absolute -top-1 right-3 font-display text-[5.5rem] font-bold leading-none select-none pointer-events-none"
                    style={{ color: "rgb(224 148 0 / 0.07)" }}
                  >
                    {step.num}
                  </span>
                  <div className="relative">
                    <div className="w-8 h-8 flex items-center justify-center border border-dashed border-accent/25 group-hover:border-accent/60 transition-colors mb-5">
                      <Icon size={14} className="text-accent" />
                    </div>
                    <h3 className="font-display font-semibold text-fog text-base mb-2">{step.title}</h3>
                    <p className="text-fog-muted text-sm leading-relaxed">{step.desc}</p>
                  </div>
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
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-fog tracking-tight">
              Everything your team needs to review with confidence
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="p-6 border border-dashed border-border hover:border-accent/25 hover:bg-surface/60 transition-all group cursor-default"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-9 h-9 flex items-center justify-center border border-dashed border-border group-hover:border-accent/40 transition-colors">
                      <Icon size={16} className="text-accent" />
                    </div>
                    <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-fog-muted border border-dashed border-border px-1.5 py-0.5">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-fog text-[15px] mb-2">{f.title}</h3>
                  <p className="text-fog-muted text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(224,148,0,0.06) 0%, transparent 70%)" }}
        />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-3xl sm:text-[2.75rem] font-bold text-fog leading-tight mb-5 tracking-tight">
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
              className="clip-notch inline-flex items-center gap-2 border border-dashed border-border text-fog-dim font-mono text-[11px] uppercase tracking-[0.14em] px-7 py-3.5 hover:border-accent/40 hover:text-fog transition-all w-full sm:w-auto justify-center"
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
  { id: "security",        label: "Security",         desc: "Auth, permissions, secrets, and unsafe execution patterns." },
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

          {/* Left */}
          <div className="space-y-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-3">
                Welcome back
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-fog tracking-tight">
                Start a PR review
              </h1>
              <p className="mt-3 text-fog-muted text-base leading-relaxed max-w-lg">
                Paste a GitHub repo URL and PR number. The pipeline parses the diff,
                runs heuristic checks, and calls the LLM review chain on critical files.
              </p>
            </div>

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

            {error && (
              <div className="border border-dashed border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400 font-mono">
                {error}
              </div>
            )}

            {atLimit && (
              <div className="border border-dashed border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400 font-mono text-center">
                Monthly limit reached ({user!.monthly_quota} analyses).
                Resets {user!.quota_resets_on ?? "next month"}.
              </div>
            )}

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
