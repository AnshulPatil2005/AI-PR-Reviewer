# AI PR Reviewer — Project Context

## What this is

Full-stack AI-powered pull request reviewer. Users paste a GitHub repo URL + PR number, the backend fetches the diff, runs it through free LLMs via OpenRouter, and returns a structured risk assessment with suggestions and per-file breakdown. Results are persisted per user account with export to JSON or PDF.

**Live deployment:**
- Backend (Render): https://ai-pr-reviewer-lacj.onrender.com
- Frontend (Vercel): (Vercel project linked to this repo, main branch auto-deploys)
- Database: Supabase PostgreSQL (free tier)

---

## Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI 0.111, Python 3.11.9, SQLAlchemy 2.0, Uvicorn |
| Auth | JWT via python-jose, passlib 1.7.4, bcrypt **pinned to 4.0.1** |
| Database | PostgreSQL (Supabase) in prod, SQLite locally via `DATABASE_URL` |
| LLM | OpenRouter free-tier models (see `backend/openrouter_llm.py`) |
| Frontend | React 19 + TypeScript + Vite + TailwindCSS + React Router v7 |
| Hosting | Render (backend) + Vercel (frontend) |
| Keep-alive | `.github/workflows/keep-alive.yml` pings backend every 5 min |

---

## Environment Variables

### Backend (`backend/.env`)
```
GITHUB_TOKEN=...          # GitHub PAT for fetching PR diffs
OPENROUTER_API_KEY=...    # OpenRouter API key
DATABASE_URL=...          # postgres://... (Supabase Session pooler URL)
SECRET_KEY=...            # JWT signing secret (random 32+ char string)
```

### Frontend (`frontend/.env`)
```
VITE_API_BASE=https://ai-pr-reviewer-lacj.onrender.com
```
Vite bakes this at build time — must be set in Vercel environment variables before deploy.

---

## Key Architecture Decisions

**bcrypt pinned to 4.0.1** — bcrypt 4.1+ enforces strict 72-byte password limit which breaks passlib 1.7.4. Do not upgrade bcrypt without also upgrading passlib.

**CORS: `allow_origins=["*"]` + `allow_credentials=False`** — JWT is sent as Bearer header, not cookies. Using `allow_credentials=True` with wildcard origins causes Starlette to reject preflight with 400.

**Global exception handler before CORSMiddleware** — Starlette's `ServerErrorMiddleware` sits above `CORSMiddleware` in the stack, so unhandled 500s bypass CORS headers entirely. The `@app.exception_handler(Exception)` in `main.py` manually adds `Access-Control-Allow-Origin: *` to 500 responses.

**Supabase Session pooler URL** — Render free tier is IPv4-only. Supabase direct connection URLs resolve to IPv6. Must use the Session pooler URL (`aws-0-*.pooler.supabase.com:5432`) with username format `postgres.PROJECTREF`.

**`.python-version` = 3.11.9** — Prevents Render from picking Python 3.13 which breaks pydantic-core (no pre-built wheel, fails to compile).

**LLM suggestion normalization** — Free-tier LLMs often return `suggestions` as a list of dicts (`{file, suggestion, severity}`) instead of plain strings even when the prompt specifies strings. `_coerce_suggestion()` in `main.py` flattens these. Also applied in `_analysis_to_out()` as a second guard for any stale DB rows.

---

## Project Structure

```
AI-PR-Reviewer/
├── backend/
│   ├── main.py               # FastAPI app, all endpoints
│   ├── auth.py               # JWT + password hashing, get_current_user
│   ├── database.py           # SQLAlchemy engine + get_db dependency
│   ├── models.py             # User, Analysis, FileAnalysis ORM models
│   ├── github_utils.py       # fetch_pr_details, parse_diff_by_file
│   ├── openrouter_llm.py     # call_llm() with multi-model fallback
│   └── agents/
│       ├── risk_agent.py     # Returns {risk_score, explanation}
│       ├── suggestion_agent.py  # Returns {suggestions: [str]}
│       └── file_agent.py     # Per-file {filename, risk_score, explanation}
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Root layout + nav, passes darkMode via Outlet context
│   │   ├── router.tsx        # createBrowserRouter with nested routes under App
│   │   ├── main.tsx          # AuthProvider wraps RouterProvider
│   │   ├── api/
│   │   │   ├── client.ts     # Axios instance, 401/403 → redirect to /login
│   │   │   └── endpoints.ts  # Typed API functions
│   │   ├── context/
│   │   │   └── AuthContext.tsx  # JWT in localStorage, login/register/logout
│   │   ├── components/
│   │   │   ├── RiskGauge.tsx
│   │   │   ├── SuggestionCard.tsx
│   │   │   ├── FileBreakdown.tsx
│   │   │   ├── AnalysisSummary.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   └── pages/
│   │       ├── HomePage.tsx
│   │       ├── LoginPage.tsx
│   │       ├── RegisterPage.tsx
│   │       ├── HistoryPage.tsx
│   │       └── AnalysisDetailPage.tsx
│   └── vercel.json           # SPA rewrite: all routes → index.html
├── .python-version           # 3.11.9 — pins Render Python version
├── requirements.txt
├── docker-compose.yml
└── .github/workflows/keep-alive.yml
```

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | No | Health check |
| POST | `/auth/register` | No | Create account, returns JWT |
| POST | `/auth/login` | No | Login, returns JWT |
| GET | `/auth/me` | JWT | Current user info |
| POST | `/analyze` | JWT | Analyze a PR, saves result |
| GET | `/analyses` | JWT | Paginated analysis history |
| GET | `/analyses/{id}` | JWT | Full analysis with file breakdown |
| DELETE | `/analyses/{id}` | JWT | Soft-delete an analysis |
| GET | `/analyses/{id}/export` | JWT | Download as `?format=json` or `?format=pdf` |

---

## Working LLM Models (as of 2026-06)

In `backend/openrouter_llm.py` — free tier, tested working:
```python
_MODELS = [
    "google/gemma-4-31b-it:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "z-ai/glm-4.5-air:free",
    "nvidia/nemotron-nano-9b-v2:free",
    "meta-llama/llama-3.2-3b-instruct:free",
]
```
Models rotate — if one 404s the list will need updating. Test with `python test_openrouter.py`.

---

## Common Issues & Fixes

| Symptom | Root Cause | Fix |
|---|---|---|
| Registration returns 500, browser shows CORS error | Actual error is in 500 body, CORS headers missing because ServerErrorMiddleware is above CORSMiddleware | Global exception handler with manual CORS header |
| `ValueError: password cannot be longer than 72 bytes` | bcrypt 4.1+ strict enforcement, incompatible with passlib 1.7.4 | Pin `bcrypt==4.0.1` |
| POST /analyze returns 403 | `HTTPBearer()` returns 403 when header is missing | Use `HTTPBearer(auto_error=False)`, return 401 manually |
| LLM suggestions are dicts not strings | Free models ignore JSON schema in prompt | `_coerce_suggestion()` normalizes before save and before serialization |
| Render can't connect to Supabase | Render free tier is IPv4, Supabase direct URL is IPv6 | Use Supabase Session pooler URL |
| Render deploys Python 3.13, pydantic build fails | No pre-built pydantic-core wheel for 3.13 | `.python-version` = `3.11.9` |
| Vercel 404 on page refresh | SPA routes not handled by server | `vercel.json` with rewrite `/(.*) → /index.html` |
| Windows print crash on Unicode | `✓`/`⚠` not in cp1252 | Use `[OK]`/`[WARN]` in print statements |
