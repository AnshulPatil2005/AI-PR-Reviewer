# backend/main.py
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 👇 Local imports (not prefixed with "backend.")
from agents.risk_agent import assess_risk
from agents.suggestion_agent import generate_suggestions
from github_utils import fetch_pr_details

app = FastAPI()

# CORS setup for your React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input / output schemas
class AnalyzePRRequest(BaseModel):
    repo_url: str
    pr_number: int

class AnalyzePRResponse(BaseModel):
    risk_score: int
    explanation: str
    suggestions: list[str]

@app.post("/analyze", response_model=AnalyzePRResponse)
async def analyze_pr(request: AnalyzePRRequest):
    title, description, diff = fetch_pr_details(request.repo_url, request.pr_number)
    risk_result = assess_risk(title, description, diff)
    suggestions_result = generate_suggestions(title, description, diff)

    return AnalyzePRResponse(
        risk_score=risk_result.get("risk_score", 50),
        explanation=risk_result.get("explanation", "Could not determine."),
        suggestions=suggestions_result.get("suggestions", []),
    )
