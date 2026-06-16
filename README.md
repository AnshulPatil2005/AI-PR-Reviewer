# Agentic PR Copilot

[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB.svg)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Style-TailwindCSS-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

An AI-powered pull request reviewer with user accounts, persistent analysis history, structured findings, per-file breakdowns, repo analytics, and export to JSON/PDF. Deployed free on Render (backend) + Vercel (frontend) + Supabase (PostgreSQL).

**Live:** https://ai-pr-reviewer-lacj.onrender.com

---

## Section 1 — Project Flow

### 1.1 Authentication

```
Browser → POST /auth/register or /auth/login
       ← JWT (7-day expiry) + user info
```

The frontend stores the JWT in `localStorage`. On every subsequent request, an Axios interceptor (`frontend/src/api/client.ts`) reads it and adds `Authorization: Bearer <token>`. A 401 or 403 response from any endpoint auto-redirects to `/login`.

On the backend, `get_current_user` (`backend/auth.py`) decodes the JWT, looks up the user in the DB, and returns the `User` ORM object. Every protected endpoint declares it as a FastAPI `Depends`.

The `/auth/me` endpoint also returns the user's monthly quota state (`analyses_this_month`, `monthly_quota`, `quota_resets_on`) so the nav can show the usage badge.

---

### 1.2 PR Analysis — Full End-to-End

```
1. User fills in: repo URL + PR number + review mode
   (General / Security / Performance / Maintainability)

2. Frontend → POST /analysis-jobs
   Backend creates AnalysisJob (status="queued") and returns job ID.
   A daemon thread is spawned immediately to run the analysis.

3. Frontend polls GET /analysis-jobs/{id} every ~2 seconds.
   When status="completed", navigates to /jobs/{id} → fetches result.

4. (Inside the background thread — _run_job in main.py)
   a. Cache check: if same user+repo+PR+mode was analyzed in last 24h
      and is still non-deleted, mark the job "completed" pointing to
      the cached Analysis. No LLM call.

   b. Quota check: if user.analyses_this_month >= user.monthly_quota
      raise 429. Otherwise increment counter and commit.

   c. Fetch PR from GitHub:
      - PyGithub: fetch title, body
      - requests: fetch unified diff via raw API URL
      Both capped at 20s timeout.

   d. Run analysis_pipeline.analyze_pull_request(title, desc, diff, mode)

5. (Inside analyze_pull_request — backend/analysis_pipeline.py)
   a. parse_files(diff)
      Splits unified diff on "diff --git" headers into ParsedFile objects.
      For each file:
        - Count added/removed lines
        - classify_file_categories() — tag as auth/config/migration/
          workflow/dependency/tests based on filename keywords
        - detect_skip_reason() — mark lock files, minified JS,
          build artifacts, binary diffs for skipping
        - score_file_priority() — integer score from lines changed +
          file extension + categories. Skipped files score 0.
      Files are sorted by priority (descending).

   b. detect_heuristics(files, diff)
      Pure regex — no LLM call. Produces Finding objects for:
        - Tests removed (more removals than additions in test files)
        - Dependency surface changed (package.json / requirements.txt)
        - CI/workflow file changed
        - Auth-sensitive code changed
        - CORS/security config changed
        - Schema or migration changed
        - Possible secret committed (regex: api_key= "...")
        - Unsafe execution (subprocess, eval, exec, os.system)
        - Raw SQL construction (SELECT/INSERT + string concatenation)
        - "Breaking change" mentioned in PR body

   c. LLM file reviews (top 15 non-skipped files by priority score)
      For each file: review_file_with_llm()
        - Builds prompt with PR context + file diff + review mode focus
        - Calls call_llm() → tries 12 free models in order, 2 retries
          each with exponential backoff on 429
        - LLM returns JSON: {risk_score, change_summary, why_it_matters,
          issue_categories, findings:[{title,detail,severity,...}]}
        - Findings normalized and merged with heuristic findings

   d. synthesize_report()
      One more LLM call with the top 8 findings and 6 file summaries.
      Returns: {summary, top_priorities, executive_summary}
      Falls back to template strings if LLM fails.

   e. aggregate_risk()
      Overall risk_score = max(avg of reviewed file scores,
      floor set by highest finding severity:
        low→20, medium→45, high→70, critical→85).
      Clamped 0–100.

   f. compute_confidence()
      0.0–1.0 signal: coverage ratio (reviewed/eligible files)
      + LLM parse success rate.

6. Persist to database:
   - Analysis row: risk_score, explanation, suggestions, top_priorities,
     executive_summary, review_mode, review_confidence, coverage_summary,
     model_metadata (which models ran, fallback used, etc.)
   - FileAnalysis rows: one per file with risk_score, change_summary,
     categories, why_it_matters, coverage_status (reviewed/skipped),
     reviewed_chars, total_chars
   - Finding rows: one per finding with title, detail, severity, category,
     confidence, suggested_fix, file_path, source (llm/heuristic)
   - AnalysisJob updated: status="completed", analysis_id=<id>

7. Frontend receives completed job → fetches full AnalysisOut →
   renders:
     - Risk gauge (0–100 with colour coding)
     - Confidence badge + review mode label
     - Executive summary
     - Top priorities list
     - Typed findings accordion (filterable by severity/category)
     - Per-file breakdown (reviewed vs skipped, risk per file)
     - Coverage summary (which files were reviewed/truncated/skipped)
     - Export buttons (JSON, PDF, Markdown, GitHub comment format)
```

---

### 1.3 Repo Analytics Flow

```
User enters repo URL → GET /repos/analytics?repo_url=...

Backend:
  1. get_repo_stats() (backend/repo_analytics.py)
     Uses PyGithub (existing GITHUB_TOKEN, no new deps):
       - repo.get_languages() → primary language
       - repo.get_pulls(state="open").totalCount → open PR count
       - Iterate recent closed PRs, count merged_at > 30 days ago
       - repo.get_contributors() → top 5 logins
       - repo.stargazers_count, forks_count, open_issues_count, pushed_at

  2. DB aggregation (current user's analyses for this repo):
       - AVG(risk_score), COUNT(*) → avg_risk_score, analyses_count
       - Last 10 risk_scores (desc) → risk_trend (reversed for chart)
       - FileAnalysis JOIN Analysis WHERE risk_score >= 60,
         GROUP BY filename, ORDER BY AVG(risk_score) DESC → hot_files

Frontend (/repos):
  - Stat cards: stars, forks, open PRs, merged last 30d
  - Contributor chips: @login
  - Risk profile card (only shown if analyses_count > 0):
      - Avg risk score in colour-coded text
      - SVG sparkline of risk trend (oldest→newest)
      - Hot files list (monospace filenames)
```

---

### 1.4 History Flow

```
GET /analyses?page=1&limit=20&repo=...&status=...&risk_min=...&sort=newest

Returns paginated AnalysisSummaryOut list. User can filter by repo,
status, risk range, and sort by date or highest risk.

Click row → /analysis/:id → GET /analyses/{id} → full AnalysisOut
with all findings, file summaries, coverage data, and export links.

DELETE /analyses/{id} → soft delete (is_deleted=True, not removed from DB)
POST /analyses/{id}/rerun → creates a new AnalysisJob for the same PR
GET /analyses/{id}/compare?baseline_id=... → diff two analyses:
  risk delta, added/resolved findings, newly risky files, model change
```

---

### 1.5 LLM Call Chain

Every LLM call goes through `call_llm()` in `backend/openrouter_llm.py`:

```
For each model in _MODELS (12 free-tier models, best-first):
  For attempt in range(2):
    POST https://openrouter.ai/api/v1/chat/completions
      timeout=30s
    If 429 → exponential backoff (2^attempt seconds), retry
    If other HTTP error → try next model
    If success → extract JSON with regex (\{.*\} DOTALL)
                  set defaults for missing keys
                  return with _meta (which model, fallback_used, parse_ok)
If all 12 models fail → return fallback dict with risk_score=50

Model order (highest quality first):
  deepseek/deepseek-r1-0528:free
  deepseek/deepseek-chat-v3-0324:free
  google/gemma-4-31b-it:free
  qwen/qwen3-235b-a22b:free
  qwen/qwen3-30b-a3b:free
  microsoft/phi-4-reasoning:free
  nvidia/nemotron-3-nano-30b-a3b:free
  z-ai/glm-4.5-air:free
  nvidia/nemotron-nano-9b-v2:free
  mistralai/mistral-7b-instruct:free
  meta-llama/llama-3.2-3b-instruct:free
  google/gemma-2-9b-it:free
```

---

### 1.6 Data Model

```
users
  id, email, hashed_password, created_at, is_active
  monthly_quota (default 10), analyses_this_month, quota_reset_date

analyses
  id, user_id → users
  repo_url, pr_number, pr_title
  risk_score, explanation, suggestions (JSON array)
  top_priorities (JSON array), executive_summary (in model_metadata)
  review_mode, review_confidence, coverage_summary (JSON), model_metadata (JSON)
  status, is_deleted, created_at

file_analyses
  id, analysis_id → analyses
  filename, risk_score, explanation, change_summary
  categories (JSON), why_it_matters
  coverage_status (reviewed|skipped), skipped_reason
  priority_rank, reviewed_chars, total_chars

findings
  id, analysis_id → analyses
  file_path, category, severity, confidence
  title, detail, suggested_fix
  source (llm|heuristic), line_start, line_end

analysis_jobs
  id, user_id → users, analysis_id → analyses (nullable)
  repo_url, pr_number, review_mode
  status (queued|running|completed|failed)
  stage (string description of current step), progress (0.0–1.0)
  error_message, created_at, updated_at
```

---

### 1.7 Deployment Architecture

```
GitHub repo (main branch)
  │
  ├─ Push → Render auto-deploy (backend)
  │          Python 3.11.9, uvicorn backend.main:app
  │          Env: GITHUB_TOKEN, OPENROUTER_API_KEY,
  │               DATABASE_URL (Supabase), SECRET_KEY
  │
  ├─ Push → Vercel auto-deploy (frontend)
  │          npm run build (Vite), static SPA
  │          Env: VITE_API_BASE=https://ai-pr-reviewer-lacj.onrender.com
  │          vercel.json: all routes rewrite to /index.html
  │
  └─ GitHub Actions (.github/workflows/keep-alive.yml)
             Every 5 minutes: GET /docs
             Prevents Render free tier from spinning down

Supabase PostgreSQL (free tier)
  Connected via Session pooler URL (IPv4-compatible):
  postgresql://postgres.<ref>:pass@aws-0-<region>.pooler.supabase.com:5432/postgres
```

---

## Section 2 — Important Design Decisions

### 2.1 Async Job System Instead of Synchronous Analysis

**Problem:** LLM calls for a large PR (15+ files × synthesis call) take 45–90 seconds. A synchronous HTTP response would time out in the browser and on the hosting layer.

**Decision:** Every analysis creates an `AnalysisJob` row immediately and spawns a `daemon=True` background thread. The frontend receives the job ID within milliseconds and polls `GET /analysis-jobs/{id}` until `status="completed"`.

The `/analyze` compatibility endpoint does a 20-second inline poll before falling back to 202, which covers small PRs and lets older frontend code still work synchronously.

**Trade-off:** Polling adds latency perception but avoids timeouts. A proper task queue (Celery, RQ) would be more robust for scale; daemon threads are enough for free-tier single-instance deployment.

---

### 2.2 Heuristics Before LLM

**Problem:** Running LLM on every file in a large PR is slow and expensive. A PR touching `package-lock.json` + 20 source files would waste most of its token budget on the lock file.

**Decision:** `detect_heuristics()` runs pure regex patterns before any LLM call and produces findings directly. Findings for secrets, raw SQL injection, subprocess usage, auth-path changes, and breaking-change mentions are generated in milliseconds. This means even if all LLM models fail, the review still has useful output.

Files are also priority-scored so only the top 15 non-trivial files receive LLM review. Lock files, minified JS, build artifacts, and binary diffs are skipped entirely.

**Trade-off:** Heuristics have false positives and miss subtlety. LLM findings from the reviewed files compensate, and the UI clearly shows which files were skipped and why.

---

### 2.3 JWT Bearer + Wildcard CORS (Not Cookies)

**Problem:** Starlette's `CORSMiddleware` requires `allow_credentials=True` when the browser sends cookies. But `allow_credentials=True` with `allow_origins=["*"]` causes Starlette to reject every preflight request with 400, because the CORS spec forbids wildcard origin with credentials.

**Decision:** Auth uses JWT sent as an `Authorization: Bearer` header, not a cookie. Bearer headers are not "credentials" in the CORS sense, so `allow_credentials=False` with `allow_origins=["*"]` is correct and works without configuring specific origins.

**Trade-off:** JWTs in localStorage are vulnerable to XSS (unlike httpOnly cookies). Acceptable for this project scope. A future mitigation would be storing the token in an httpOnly cookie and configuring explicit allowed origins.

---

### 2.4 Global Exception Handler for CORS on 500s

**Problem:** Starlette's middleware stack processes requests from outermost to innermost. The order is:

```
ServerErrorMiddleware (outermost, Starlette adds it automatically)
  └─ CORSMiddleware
       └─ Route handler
```

When a route handler raises an unhandled exception, `ServerErrorMiddleware` catches it and returns a 500 **before** `CORSMiddleware` can add response headers. The browser sees a 500 with no `Access-Control-Allow-Origin` header and shows a misleading "CORS error" that hides the real error.

**Decision:** Register `@app.exception_handler(Exception)` which is invoked inside the router layer (below CORS). It manually adds `Access-Control-Allow-Origin: *` to the 500 response and prints the full traceback to stdout (visible in Render logs).

**Trade-off:** This exposes exception type and message to the client in production. Acceptable for a personal project; a production service would filter the detail in non-debug environments.

---

### 2.5 Schema Migrations via `ensure_runtime_schema()`

**Problem:** No migration framework (Alembic) is set up. Adding new columns to an existing Supabase database requires either a migration file or a manual SQL command.

**Decision:** `database.py` has `ensure_runtime_schema()` which runs on every startup. It inspects existing columns and runs `ALTER TABLE ... ADD COLUMN` for each column that's missing. Safe to run repeatedly since it checks before altering.

```python
if "analyses" in inspector.get_table_names():
    existing = {col["name"] for col in inspector.get_columns("analyses")}
    for name, ddl in additions.items():
        if name not in existing:
            conn.execute(text(f"ALTER TABLE analyses ADD COLUMN {name} {ddl}"))
```

**Trade-off:** Column types must be chosen carefully since `ALTER TABLE` on PostgreSQL cannot change a column type without explicit `USING`. Works well for additive changes; column renames or type changes still require manual SQL. For a project at this scale it avoids the Alembic setup and migration file management overhead.

---

### 2.6 Supabase Session Pooler for IPv4 Compatibility

**Problem:** Render's free tier runs on IPv4-only infrastructure. Supabase's direct database URL (`db.<ref>.supabase.co`) resolves to an IPv6 address. The connection fails silently or with a DNS/timeout error.

**Decision:** Use Supabase's Session pooler URL instead:
```
postgresql://postgres.<ref>:<pass>@aws-0-<region>.pooler.supabase.com:5432/postgres
```
The pooler endpoint is IPv4-addressable. Session mode (vs Transaction mode) is required because SQLAlchemy uses persistent connections; Transaction mode closes the connection after each transaction which breaks SQLAlchemy's connection pool.

---

### 2.7 24-Hour Analysis Cache

**Problem:** Repeatedly analyzing the same PR wastes LLM quota. A user testing the app or a CI pipeline re-triggering analysis would exhaust the monthly limit quickly.

**Decision:** Before spawning a thread, `_create_job()` queries for a completed, non-deleted analysis for the same `user_id + repo_url + pr_number + review_mode` within the last 24 hours. If found, a new job is created immediately in `status="completed", stage="cached"` pointing to the existing analysis. No LLM call, no quota decrement.

**Trade-off:** A PR that receives new commits after the first analysis will return stale results for up to 24 hours. Acceptable since the PR number + review mode uniquely identifies the review intent, and users can force a rerun via the "Rerun" button which bypasses the cache by creating a fresh job.

---

### 2.8 Per-User Monthly Quota

**Problem:** OpenRouter free-tier models have shared rate limits. A single user running automated analyses could exhaust the account's free quota for all users.

**Decision:** Three columns added to the `users` table: `monthly_quota` (default 10), `analyses_this_month`, `quota_reset_date`. On each new (non-cached) analysis:

1. If `quota_reset_date < start_of_current_month`, reset `analyses_this_month = 0`.
2. If `analyses_this_month >= monthly_quota`, raise HTTP 429.
3. Otherwise increment and commit.

The quota badge in the nav colour-codes: blue (< 80%), yellow (80–99%), red (at limit). The analyze button is disabled client-side when the limit is hit.

**Trade-off:** The counter can drift if a job is created but the thread crashes before finishing (quota was decremented but no analysis was saved). Fixing this would require decrementing quota only on successful completion — acceptable future improvement.

---

### 2.9 LLM Suggestion Normalization

**Problem:** Free-tier LLMs frequently ignore the JSON schema in the prompt. Even when the prompt specifies `"suggestions": ["string 1", "string 2"]`, models return objects like `{"file": "auth.py", "suggestion": "...", "severity": "high"}`. Pydantic then raises a `ValidationError: Input should be a valid string` that kills the entire request.

**Decision:** `_coerce_suggestion(s)` flattens any input shape into a string:
- If already a string: return as-is
- If a dict: try keys `suggestion`, `text`, `description`, `message`, `content`, `detail` in order. Prefix with `file:` if a file path is present. Fall back to joining all string values.
- Otherwise: `str(s)`

Applied in two places: when saving to DB (before `json.dumps`) and when reading from DB (inside `_normalize_suggestions`), so stale rows with dict-shaped suggestions are also served correctly.

---

### 2.10 Python Version Pin

**Problem:** Render selects the latest available Python version by default. Python 3.13 was available but `pydantic-core` (a Rust extension) had no pre-built wheel for it, causing a compilation failure during `pip install` that took several minutes before failing.

**Decision:** `.python-version` file in the project root containing `3.11.9`. Render's build system reads this file and uses the pinned version. Python 3.11.9 has full pre-built wheels for all dependencies.

---

### 2.11 bcrypt Version Pin

**Problem:** `bcrypt 4.1+` changed to strictly enforce the 72-byte password limit (previously it silently truncated). `passlib 1.7.4` predates this change and passes passwords longer than 72 bytes unchecked, causing `ValueError: password cannot be longer than 72 bytes` at runtime.

**Decision:** Pin `bcrypt==4.0.1` in `requirements.txt`. This is the last version before the strict enforcement was added. The pin is intentional and must not be changed without also upgrading passlib.

---

### 2.12 GitHub Actions Keep-Alive

**Problem:** Render free tier spins down an idle service after 15 minutes of no traffic. The next request triggers a cold start that takes 30–60 seconds, which causes the Axios timeout on the frontend.

**Decision:** `.github/workflows/keep-alive.yml` uses a cron trigger (`*/5 * * * *`) to send `GET /docs` every 5 minutes. This keeps the instance warm at zero cost (GitHub Actions free tier includes 2,000 minutes/month).

**Trade-off:** This pings Render continuously even when no users are active. Fine for a personal project; for a shared service, a smarter approach would only keep it alive during business hours.

---

## Quick Start

### Requirements

- Python 3.11+, Node 18+
- GitHub Personal Access Token (repo read scope)
- OpenRouter API key (free tier works)

### Backend

```bash
# From repo root
pip install -r requirements.txt

# backend/.env
GITHUB_TOKEN=github_pat_...
OPENROUTER_API_KEY=sk-or-v1-...
DATABASE_URL=sqlite:///./app.db   # or Supabase postgres URL
SECRET_KEY=any-random-32-char-string

uvicorn backend.main:app --reload
```

### Frontend

```bash
cd frontend
npm install

# frontend/.env
VITE_API_BASE=http://localhost:8000

npm run dev
```

Visit `http://localhost:5173`. Register an account, enter a GitHub repo URL and PR number, choose a review mode, and click Start PR Review.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | Health check |
| POST | `/auth/register` | No | Create account, returns JWT |
| POST | `/auth/login` | No | Login, returns JWT |
| GET | `/auth/me` | JWT | Current user + quota info |
| POST | `/analysis-jobs` | JWT | Start async PR analysis |
| GET | `/analysis-jobs/{id}` | JWT | Poll job status |
| GET | `/analysis-jobs/{id}/result` | JWT | Fetch completed result |
| POST | `/analyze` | JWT | Sync-compatible (20s poll, then 202) |
| GET | `/analyses` | JWT | Paginated history with filters |
| GET | `/analyses/insights` | JWT | Top repos, avg risk, high-risk PRs |
| GET | `/analyses/{id}` | JWT | Full analysis |
| GET | `/analyses/{id}/compare` | JWT | Diff two analyses |
| POST | `/analyses/{id}/rerun` | JWT | Re-analyze same PR |
| DELETE | `/analyses/{id}` | JWT | Soft delete |
| GET | `/analyses/{id}/export` | JWT | Download as json/pdf/markdown/comment/executive |
| GET | `/repos/analytics` | JWT | GitHub stats + DB risk profile for a repo |

---

**Made by Anshul** · [GitHub](https://github.com/AnshulPatil2005/AI-PR-Reviewer)
