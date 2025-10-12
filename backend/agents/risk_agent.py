# backend/agents/risk_agent.py
from openrouter_llm import call_llm

def assess_risk(title: str, description: str, diff: str) -> dict:
    prompt = f"""
You are a senior code reviewer AI.

Given the following pull request information, assess the code changes and return a JSON response with:
- "risk_score": a number from 0 (low) to 100 (critical)
- "explanation": a brief reason for the risk
- "suggestions": an array of improvement tips

### PR Title:
{title}

### Description:
{description}

### Code Diff:
{diff}

Respond only in JSON format:
{{
  "risk_score": 0-100,
  "explanation": "...",
  "suggestions": ["...", "..."]
}}
"""
    return call_llm(prompt)
