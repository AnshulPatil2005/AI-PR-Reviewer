
# Agentic PR Copilot

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB.svg)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Style-TailwindCSS-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## Overview

**Agentic PR Copilot** is an AI-powered Pull Request reviewer that automatically analyzes GitHub PRs for potential risks, code quality issues, and maintainability concerns. It leverages large language models (LLMs) through the **OpenRouter API** to assist reviewers by highlighting risky changes and providing actionable suggestions.

### Key Features

* **Automated PR Analysis**: AI-powered risk scoring (0-100 scale) with detailed explanations
* **Smart Suggestions**: 2-3 actionable improvement tips for each pull request
* **Multi-Model Support**: Automatic fallback between multiple AI models for reliability
* **GitHub Integration**: Seamless integration with GitHub API for real-time PR data
* **Modern UI**: React + TypeScript + TailwindCSS with light/dark mode
* **Fast & Scalable**: FastAPI backend with intelligent retry logic and rate limit handling

---

## Example Output

```json
{
  "risk_score": 82,
  "explanation": "Major refactor in API endpoints and data validation logic with significant changes to core business logic.",
  "suggestions": [
    "Add integration tests for new validation logic to ensure backward compatibility",
    "Review rate-limiting implementation to prevent potential DoS vulnerabilities",
    "Consider adding rollback mechanisms for the database schema changes"
  ]
}
```

---

## Project Structure

```
AI-PR-Reviewer/
├── backend/
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── risk_agent.py         # Risk assessment logic
│   │   └── suggestion_agent.py   # Improvement suggestions
│   ├── github_utils.py            # GitHub API integration
│   ├── openrouter_llm.py          # OpenRouter LLM client with fallback
│   ├── main.py                    # FastAPI application
│   ├── requirements.txt           # Python dependencies
│   └── .env                       # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx               # Main React component
│   │   ├── main.tsx              # Entry point
│   │   └── index.css             # Global styles
│   ├── .env                      # Frontend environment variables
│   ├── package.json              # Node dependencies
│   ├── tailwind.config.js        # TailwindCSS configuration
│   ├── postcss.config.js         # PostCSS configuration
│   ├── tsconfig.json             # TypeScript configuration
│   └── vite.config.ts            # Vite build configuration
│
└── README.md
```

---

## Quick Start

### Prerequisites

- Python 3.10 or higher
- Node.js 16+ and npm
- OpenRouter API key ([Get it here](https://openrouter.ai/))
- GitHub Personal Access Token ([Generate here](https://github.com/settings/tokens))

### Backend Setup (FastAPI)

#### 1. Install Python dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### 2. Configure environment variables

Create a `.env` file inside `backend/`:

```env
GITHUB_TOKEN=github_pat_YOUR_TOKEN_HERE
OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE
```

**Getting API Keys:**

- **GitHub Token**:
  1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
  2. Generate a new token (fine-grained or classic)
  3. Grant `public_repo` or `repo` scope
  4. Copy and paste into `.env`

- **OpenRouter API Key**:
  1. Visit [OpenRouter](https://openrouter.ai/)
  2. Sign up and go to [API Keys](https://openrouter.ai/settings/keys)
  3. Generate a new API key
  4. Add $5-10 in credits (optional but recommended)
  5. Copy and paste into `.env`

#### 3. Run the backend server

**From the repository root:**

```bash
uvicorn backend.main:app --reload
```

**Alternative (from backend directory):**

```bash
cd backend
python -m uvicorn main:app --reload
```

**Backend URL:** [http://localhost:8000](http://localhost:8000)
**API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Frontend Setup (React + Vite + TailwindCSS)

#### 1. Install Node dependencies

```bash
cd frontend
npm install
```

#### 2. Configure environment

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE=http://localhost:8000
```

#### 3. Run the development server

```bash
npm run dev
```

**Frontend URL:** [http://localhost:5173](http://localhost:5173)

---

## AI Model Configuration

### Current Model Strategy

The application uses a **smart fallback system** with multiple **FREE** AI models:

| Priority | Model | Type | Cost | Status |
|----------|-------|------|------|--------|
| 1st | `meta-llama/llama-3.2-3b-instruct:free` | **FREE** | $0 | ✅ Working |
| 2nd | `google/gemini-2.0-flash-exp:free` | **FREE** | $0 | ⚠️ Rate limited |
| 3rd | `mistralai/mistral-7b-instruct:free` | **FREE** | $0 | ⚠️ Rate limited |

### How Model Fallback Works

1. **Primary Model**: Tries Llama 3.2 3B (free, decent quality)
   - Works without credits
   - May have rate limits during peak hours

2. **Fallback Models**: Tries Gemini and Mistral free models
   - Backup options if primary model is rate-limited
   - Ensures availability even during high traffic

3. **Retry Logic**: Exponential backoff (1s, 2s, 4s) for rate limits
   - Automatically waits and retries when rate-limited
   - Seamlessly switches to next available model

### Cost

**100% FREE** - All models use OpenRouter's free tier. No credits required!

---

## How It Works

### Request Flow

1. **User Input**: Enter GitHub repo URL and PR number in the frontend
2. **Frontend Request**: React app sends POST request to `/analyze` endpoint
3. **GitHub API**: Backend fetches PR metadata (title, description, diff)
4. **AI Processing**:
   - `risk_agent`: Analyzes code changes and assigns risk score (0-100)
   - `suggestion_agent`: Generates 2-3 actionable improvement tips
   - Both agents use `openrouter_llm.py` with automatic model fallback
5. **Response**: Backend returns JSON with risk score, explanation, and suggestions
6. **Display**: Frontend renders results with copy-to-clipboard functionality

### Architecture Diagram

```
┌─────────────┐      HTTP/JSON      ┌──────────────┐
│   React     │ ←─────────────────→ │   FastAPI    │
│  Frontend   │                     │   Backend    │
└─────────────┘                     └──────┬───────┘
                                           │
                                           ├─→ GitHub API
                                           │   (fetch PR data)
                                           │
                                           ├─→ OpenRouter API
                                           │   (AI analysis)
                                           │
                                           └─→ Risk & Suggestion
                                               Agents
```

---

## API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/analyze` | Analyze a GitHub pull request |
| `GET` | `/docs` | Interactive API documentation (Swagger UI) |
| `GET` | `/openapi.json` | OpenAPI schema |

### POST /analyze

**Request Body:**

```json
{
  "repo_url": "https://github.com/owner/repo",
  "pr_number": 123
}
```

**Response (200 OK):**

```json
{
  "risk_score": 65,
  "explanation": "Moderate risk due to changes in authentication logic and database queries.",
  "suggestions": [
    "Add unit tests for the new authentication flow",
    "Review SQL queries for potential injection vulnerabilities",
    "Consider adding rate limiting to the login endpoint"
  ]
}
```

**Error Response (400/500):**

```json
{
  "detail": "[GitHub Error] Cannot fetch PR #123 from 'owner/repo': Not Found"
}
```

### Example cURL Request

```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "https://github.com/fastapi/fastapi",
    "pr_number": 10000
  }'
```

---

## Core Components

### Backend Modules

| Module | Description |
|--------|-------------|
| **main.py** | FastAPI application with CORS, request validation, and endpoints |
| **github_utils.py** | GitHub API integration with robust error handling and URL parsing |
| **openrouter_llm.py** | LLM client with multi-model fallback, retry logic, and rate limit handling |
| **agents/risk_agent.py** | Analyzes PR risk and generates scores with explanations |
| **agents/suggestion_agent.py** | Generates actionable improvement recommendations |

### Key Features per Module

#### github_utils.py
- Validates GitHub URLs (handles `.git` suffix, trailing slashes)
- Fetches PR metadata using PyGithub
- Retrieves unified diff via direct HTTP requests
- Comprehensive error handling with actionable messages

#### openrouter_llm.py
- **Smart Model Selection**: Tries multiple models in priority order
- **Retry Logic**: Exponential backoff for rate limits (1s → 2s → 4s)
- **JSON Extraction**: Regex-based parsing handles non-JSON responses
- **Detailed Logging**: Shows which model was used for each request
- **Cost Optimization**: Prefers cheap paid models over rate-limited free ones

#### agents/risk_agent.py
- Prompts LLM with PR title, description, and diff
- Requests structured JSON: `{risk_score, explanation, suggestions}`
- Returns risk score (0-100) with contextual reasoning

#### agents/suggestion_agent.py
- Focuses on actionable improvements
- Generates 2-3 specific, practical tips
- Returns JSON: `{suggestions: [...]}`

---

## Frontend Features

### User Interface
- **Clean Design**: Modern, responsive UI built with React and TailwindCSS
- **Theme Toggle**: Light/dark mode with localStorage persistence
- **Input Persistence**: Saves repo URL and PR number locally
- **Progress Indicator**: Animated loading bar during API calls
- **Error Handling**: Clear, user-friendly error messages
- **Copy to Clipboard**: One-click JSON result copying

### Technical Features
- **TypeScript**: Type-safe React components
- **Vite**: Fast HMR and optimized builds
- **Axios**: HTTP client for API requests
- **React Router DOM**: Client-side routing (if needed)
- **Responsive**: Mobile-friendly design

---

## Configuration Files

| File | Purpose |
|------|---------|
| **backend/.env** | GitHub token and OpenRouter API key |
| **frontend/.env** | Backend API base URL |
| **backend/requirements.txt** | Python dependencies (FastAPI, PyGithub, etc.) |
| **frontend/package.json** | Node.js dependencies (React, Vite, etc.) |
| **frontend/tailwind.config.js** | TailwindCSS theme and dark mode settings |
| **frontend/vite.config.ts** | Vite server and build configuration |
| **frontend/tsconfig.json** | TypeScript compiler options |

---

## Deployment

### Option 1: Docker (Recommended)

```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Option 2: Cloud Hosting

#### Backend Deployment
Deploy FastAPI backend to:
- **Railway**: Zero-config Python deployment
- **Render**: Free tier available
- **AWS Lambda**: Serverless deployment
- **Azure App Service**: Managed hosting
- **Google Cloud Run**: Containerized deployment

**Example (Railway):**
1. Connect your GitHub repo
2. Add environment variables (`GITHUB_TOKEN`, `OPENROUTER_API_KEY`)
3. Railway auto-detects FastAPI and deploys

#### Frontend Deployment
Deploy React frontend to:
- **Vercel**: Optimized for Vite/React
- **Netlify**: Drag-and-drop deployment
- **Cloudflare Pages**: Global CDN
- **GitHub Pages**: Free static hosting

**Important**: Update `VITE_API_BASE` in frontend `.env` to your deployed backend URL.

---

## Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.10+ | Core language |
| FastAPI | 0.111+ | Web framework |
| Uvicorn | 0.30+ | ASGI server |
| PyGithub | 2.3+ | GitHub API client |
| requests | Latest | HTTP client for OpenRouter |
| python-dotenv | 1.0+ | Environment variable management |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1+ | UI framework |
| TypeScript | 5.8+ | Type safety |
| Vite | 7.0+ | Build tool |
| TailwindCSS | 4.1+ | Styling |
| Axios | 1.11+ | HTTP client |
| React Router DOM | 7.7+ | Routing |

### AI/LLM
| Service | Model | Cost |
|---------|-------|------|
| OpenRouter | Claude 3 Haiku | $0.25/1M tokens |
| OpenRouter | Llama 3.2 3B | Free (rate limited) |
| OpenRouter | Gemini 2.0 Flash | Free (rate limited) |

---

## Troubleshooting

### Common Issues

#### 1. "ModuleNotFoundError: No module named 'agents'"

**Cause**: Running uvicorn from wrong directory or incorrect import paths.

**Solution**:
```bash
# Run from repository root (not from backend/)
cd AI-PR-Reviewer
uvicorn backend.main:app --reload
```

#### 2. "Missing GITHUB_TOKEN in environment variables"

**Cause**: `.env` file not found or GitHub token not set.

**Solution**:
- Verify `backend/.env` exists
- Check token format: `GITHUB_TOKEN=github_pat_...`
- Restart the server after updating `.env`

#### 3. "Bad credentials" from GitHub API

**Cause**: Invalid or expired GitHub token.

**Solution**:
1. Generate new token at [github.com/settings/tokens](https://github.com/settings/tokens)
2. Grant `public_repo` or `repo` scope
3. Update `GITHUB_TOKEN` in `backend/.env`
4. Restart server

#### 4. "429: Provider returned error" (Rate Limiting)

**Cause**: Free tier models have strict rate limits.

**Solution**:
- **Best**: Add $5+ credits to OpenRouter account
- **Alternative**: Wait 1-2 minutes between requests
- **Automatic**: System will try fallback models

#### 5. "API Error: User not found" from OpenRouter

**Cause**: Invalid OpenRouter API key.

**Solution**:
1. Visit [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys)
2. Generate new API key
3. Update `OPENROUTER_API_KEY` in `backend/.env`
4. Restart server

#### 6. Frontend can't connect to backend

**Cause**: Backend not running or wrong URL.

**Solution**:
- Check backend is running on port 8000
- Verify `VITE_API_BASE=http://localhost:8000` in `frontend/.env`
- Check CORS settings in `backend/main.py` (should allow localhost:5173)

---

## Security Best Practices

### API Keys & Tokens
- ✅ Never commit `.env` files to version control
- ✅ Use `.gitignore` to exclude `.env` files
- ✅ Rotate API keys periodically (every 3-6 months)
- ✅ Use fine-grained GitHub tokens with minimal permissions
- ✅ Store secrets in environment variables or secret managers (AWS Secrets Manager, etc.)

### GitHub Token Permissions
- **Recommended**: Fine-grained token with read-only access to pull requests
- **Minimum**: `public_repo` scope (for public repos only)
- **Full repo access**: Only if analyzing private repositories

### Rate Limiting
- Free OpenRouter models have strict rate limits
- Consider implementing request throttling on frontend
- Add caching layer for repeated PR analyses

---

## Development Workflow

### Running Locally

1. **Start Backend**:
   ```bash
   uvicorn backend.main:app --reload
   ```

2. **Start Frontend** (in new terminal):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open Browser**: Visit [http://localhost:5173](http://localhost:5173)

4. **Test Analysis**:
   - Enter repo: `https://github.com/fastapi/fastapi`
   - Enter PR number: Any valid PR number
   - Click "Analyze PR"

### Monitoring Logs

Backend logs show model usage:
```
✓ Successfully used model: anthropic/claude-3-haiku
✓ Parsed result: risk_score=75
```

### Testing Different Models

Edit `backend/openrouter_llm.py` to change model priority:
```python
models = [
    "meta-llama/llama-3.2-3b-instruct:free",  # Try free model first
    "anthropic/claude-3-haiku",                # Fall back to paid
]
```

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Roadmap

### Planned Features
- [ ] Support for GitLab and Bitbucket
- [ ] Batch PR analysis
- [ ] Historical risk tracking
- [ ] Custom risk scoring rules
- [ ] Integration with CI/CD pipelines
- [ ] Slack/Discord notifications
- [ ] Multi-language support
- [ ] Cost tracking dashboard

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Acknowledgments

- **OpenRouter**: For providing unified LLM API access
- **Anthropic**: For Claude models
- **Meta**: For Llama models
- **Google**: For Gemini models
- **GitHub**: For comprehensive PR API
- **FastAPI**: For excellent Python web framework
- **React Team**: For amazing frontend library

---

## Support

For issues, questions, or feedback:
- **GitHub Issues**: [Report a bug](https://github.com/yourusername/AI-PR-Reviewer/issues)
- **Discussions**: [Ask questions](https://github.com/yourusername/AI-PR-Reviewer/discussions)

---

**Made by Anshul** | [GitHub](https://github.com/yourusername) | [Twitter](https://twitter.com/yourusername)

