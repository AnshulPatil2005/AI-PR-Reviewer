from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agents.risk_agent import assess_risk
from agents.suggestion_agent import generate_suggestions
from github_utils import fetch_pr_details

app = FastAPI()

# Enable CORS for frontend (Vite dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input schema for frontend request
class AnalyzePRRequest(BaseModel):
    repo_url: str
    pr_number: int

# Output schema for response
class AnalyzePRResponse(BaseModel):
    risk_score: int
    explanation: str
    suggestions: list[str]

# Endpoint to handle PR analysis
@app.post("/analyze", response_model=AnalyzePRResponse)
async def analyze_pr(request: AnalyzePRRequest):
    # Step 1: Fetch PR title, description, and diff from GitHub
    title, description, diff = fetch_pr_details(request.repo_url, request.pr_number)

    # Step 2: Run the LLM agents
    risk_result = assess_risk(title, description, diff)
    suggestions_result = generate_suggestions(title, description, diff)

    # Step 3: Return structured response
    return AnalyzePRResponse(
        risk_score=risk_result.get("risk_score", 50),
        explanation=risk_result.get("explanation", "Could not determine."),
        suggestions=suggestions_result.get("suggestions", [])
    )
