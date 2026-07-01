---
name: run-ai-pr-reviewer
description: Run, start, build, launch, screenshot, or test the AI PR Reviewer app (FastAPI backend + React/Vite frontend). Use when asked to run the app, verify a UI change, take a screenshot, start the dev server, or test the API.
---

AI PR Reviewer is a full-stack web app: a Python FastAPI backend (port 8000) and a React/Vite frontend (port 5173). The backend is driven with `curl`; the frontend is driven with `npx playwright screenshot`. All paths below are relative to the repo root (`C:\Users\dpati\AI-PR-Reviewer`).

## Prerequisites

Python 3.13+ with these packages (all already installed in this environment):
```
fastapi uvicorn python-dotenv PyGithub sqlalchemy passlib[bcrypt] python-jose[cryptography] pydantic
```

Node.js 22+ with frontend deps already installed in `frontend/node_modules`.

Playwright chromium (for screenshots):
```
npx playwright install chromium
```

## Build

No build step required for local dev. The backend runs from source; the frontend uses Vite's dev server.

## Run — agent path

### 1. Start the backend

Run from the **repo root** (not inside `backend/`). The backend loads `backend/.env` on startup; if that file sets `DATABASE_URL` to a Supabase PostgreSQL URL, override it with SQLite for local dev:

```
cd C:\Users\dpati\AI-PR-Reviewer
DATABASE_URL=sqlite:///./app.db python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --log-level warning
```

Health check — should return `{"status":"ok","version":"2.1.0"}`:
```
curl -s http://127.0.0.1:8000/
```

### 2. Start the frontend

```
cd C:\Users\dpati\AI-PR-Reviewer\frontend
npm run dev
```

Vite prints the actual port in its output (e.g. `Local: http://localhost:5173/`). If 5173 is in use it auto-increments to 5174.

### 3. Take a screenshot

```
npx playwright screenshot --browser chromium http://localhost:5173/ screenshot.png
```

Replace the URL with any route (`/login`, `/history`, etc.).

### 4. Test the API with curl

Register and get a JWT:
```
curl -s -X POST http://127.0.0.1:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","password":"devpass123"}'
```

Verify auth (replace `<TOKEN>` with the `access_token` from above):
```
curl -s -H "Authorization: Bearer <TOKEN>" http://127.0.0.1:8000/auth/me
```

Submit a PR for analysis (requires a valid `OPENROUTER_API_KEY` and `GITHUB_TOKEN` in `backend/.env`):
```
curl -s -X POST http://127.0.0.1:8000/analysis-jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"repo_url":"https://github.com/owner/repo","pr_number":1,"review_mode":"general"}'
```

## Run — human path

Start both services in separate terminals, then open `http://localhost:5173` in a browser. The "GET STARTED" button on the landing page takes you to register; "SIGN IN" goes to the login page. The backend must be running for auth and analysis to work.

## Gotchas

- **`backend/.env` causes psycopg2 crash on fresh machines**: If `backend/.env` contains a `DATABASE_URL` pointing at Supabase (PostgreSQL), uvicorn will crash at startup with `ModuleNotFoundError: No module named 'psycopg2'`. Fix: prefix the start command with `DATABASE_URL=sqlite:///./app.db` to force the SQLite fallback.

- **Must start backend from repo root**: The Python package is `backend.main` — if you `cd backend` and run `python -m uvicorn main:app`, all `from backend.xxx import` lines in the source will fail with ImportError.

- **`VITE_API_URL` in `frontend/.env` is silently ignored**: `frontend/src/api/client.ts` reads `VITE_API_BASE`, not `VITE_API_URL`. The `.env` file has the wrong key name; the code always falls back to `http://localhost:8000`. This is harmless for local dev but means changing the backend port in `.env` has no effect — you must set `VITE_API_BASE` instead.

- **Vite port auto-increments**: If port 5173 is already in use (e.g. a previous dev server still running), Vite will silently switch to 5174. Always check the "Local:" line in Vite's startup output for the actual port.

- **Root `package.json` is not the frontend**: The repo root has a `package.json` with only `react-router-dom` as a dependency — it is unrelated to the frontend app. All frontend work (install, dev, build) runs inside `frontend/`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `ModuleNotFoundError: No module named 'psycopg2'` | Add `DATABASE_URL=sqlite:///./app.db` before the uvicorn command |
| `ImportError: attempted relative import beyond top-level package` | You're running uvicorn from inside `backend/`. Run from the repo root instead |
| `curl: (7) Failed to connect` | Backend isn't running yet; wait 2–3 seconds after launch |
| Frontend shows a blank white page | Backend is down; check `http://127.0.0.1:8000/` returns 200 |
| Vite starts but screenshots are blank | Port mismatch — check the actual port in Vite's startup output |
