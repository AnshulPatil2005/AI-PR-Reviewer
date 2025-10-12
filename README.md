
# Agentic PR Copilot

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB.svg)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Style-TailwindCSS-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## Overview

**Agentic PR Copilot** is an AI-powered Pull Request reviewer that automatically analyzes GitHub PRs for potential risk, code quality, and maintainability concerns.
It leverages large language models (LLMs) through the **OpenRouter API (Mistral-7B-Instruct)** to assist reviewers by highlighting risky changes and providing actionable suggestions.

---

## Key Features

* Automated analysis of pull requests using LLM agents.
* AI-generated **risk scores**, **explanations**, and **improvement recommendations**.
* End-to-end integration with the **GitHub API** for real PR data.
* Modern **React + TailwindCSS frontend** with light/dark mode.
* Fast, scalable **FastAPI backend** supporting OpenRouter and Hugging Face models.

---

## Example Output

```json
{
  "risk_score": 82,
  "explanation": "Major refactor in API endpoints and data validation logic.",
  "suggestions": [
    "Add integration tests for new validation logic.",
    "Review rate-limiting to ensure backward compatibility."
  ]
}
```

---

## Project Structure

```
AI-PR-Reviewer/
├── backend/
│   ├── agents/
│   │   ├── openrouter_llm.py
│   │   ├── risk_agent.py
│   │   ├── suggestion_agent.py
│   ├── github_utils.py
│   ├── huggingface_llm.py
│   ├── main.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── .env
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.ts
│
└── README.md
```

---

## Backend Setup (FastAPI)

### 1. Install dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Create environment file

Create a `.env` file inside `backend/`:

```
OPENROUTER_API_KEY=your_openrouter_api_key
GITHUB_TOKEN=your_github_personal_access_token
```

### 3. Run the backend

```bash
uvicorn backend.main:app --reload
```

**Backend URL:** [http://localhost:8000](http://localhost:8000)

---

## Frontend Setup (React + Vite + Tailwind)

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment

Create a `.env` file in the `frontend/` directory:

```
VITE_API_URL=http://localhost:8000
```

### 3. Run the development server

```bash
npm run dev
```

**Frontend URL:** [http://localhost:5173](http://localhost:5173)
**Backend connection:** Configured via `VITE_API_URL` in `.env`

---

## How It Works

1. The **frontend** sends a POST request to the backend endpoint `/analyze`:

   ```json
   {
     "repo_url": "https://github.com/owner/repo",
     "pr_number": 42
   }
   ```
2. The **backend**:

   * Fetches the PR metadata and diff via `github_utils.py`.
   * Passes the information to `risk_agent` and `suggestion_agent`.
   * Each agent calls the LLM through `openrouter_llm.py`.
   * Returns a unified JSON result.
3. The **frontend** renders the AI analysis, risk score, and improvement suggestions.

---

## API Reference

| Method | Endpoint   | Description                                              |
| ------ | ---------- | -------------------------------------------------------- |
| `POST` | `/analyze` | Analyze a pull request and return AI-generated insights. |

**Example Request**

```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"repo_url": "https://github.com/python/cpython", "pr_number": 12345}'
```

---

## Core Components

| Component               | Description                                                        |
| ----------------------- | ------------------------------------------------------------------ |
| **risk_agent.py**       | Computes a numerical risk score and provides contextual reasoning. |
| **suggestion_agent.py** | Suggests potential improvements or refactoring opportunities.      |
| **openrouter_llm.py**   | Connects to the OpenRouter API and invokes the Mistral LLM.        |
| **github_utils.py**     | Retrieves pull request details and diffs using the GitHub API.     |

---

## Frontend Features

* Built with **React (Vite)** and styled using **TailwindCSS**.
* Light and dark mode toggle with persistent theme memory.
* Input persistence via local storage.
* Animated progress indicator during LLM inference.
* Copy-to-clipboard support for AI output.
* Detailed error feedback for API responses.

---

## Configuration Summary

| File                 | Description                             |
| -------------------- | --------------------------------------- |
| `.env` (backend)     | API keys for OpenRouter and GitHub.     |
| `.env` (frontend)    | Base URL for backend API communication. |
| `tailwind.config.js` | TailwindCSS configuration.              |
| `vite.config.ts`     | Vite build and server configuration.    |

---

## Deployment

### Docker

You can containerize and deploy the application with Docker Compose:

```bash
docker-compose up --build
```

### Cloud Hosting

* **Backend**: Deploy to Railway, Render, AWS, or Azure as a FastAPI service.
* **Frontend**: Deploy to Netlify, Vercel, or Cloudflare Pages.
* Update `VITE_API_URL` in `frontend/.env` to point to the live backend endpoint.

---

## Technology Stack

| Layer           | Technologies                         |
| --------------- | ------------------------------------ |
| **Frontend**    | React, TypeScript, Vite, TailwindCSS |
| **Backend**     | FastAPI, Python 3.10+                |
| **AI/LLM**      | Mistral-7B-Instruct via OpenRouter   |
| **Integration** | GitHub REST API, PyGithub            |
| **Build Tools** | Node.js, Axios, dotenv               |

---

## Security Recommendations

* Never commit `.env` files or API keys to version control.
* Use GitHub tokens with minimal permissions (read-only).
* Rotate OpenRouter API keys periodically.
* Use environment variables or secret managers for sensitive credentials.

---

## Example Workflow

1. Start the backend:

   ```bash
   uvicorn backend.main:app --reload
   ```
2. Start the frontend:

   ```bash
   npm run dev
   ```
3. Visit `http://localhost:5173`
4. Enter:

   * Repository URL: `https://github.com/python/cpython`
   * Pull Request Number: `12345`
5. Review the generated AI analysis.

---

## License

Made by Anshul.
