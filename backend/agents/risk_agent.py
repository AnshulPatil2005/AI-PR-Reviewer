from backend.openrouter_llm import call_llm

_SYSTEM = (
    "You are a senior code reviewer. Assess pull request changes for risk. "
    "Respond ONLY with a JSON object — no markdown, no prose."
)


def assess_risk(title: str, description: str, diff: str) -> dict:
    prompt = f"""Analyze this pull request and return a JSON object with:
- "risk_score": integer 0 (safe) to 100 (critical)
- "explanation": one concise paragraph explaining the risk level
- "suggestions": array of 2-4 actionable improvement strings

### PR Title:
{title}

### Description:
{description or "(no description)"}

### Code Diff:
{diff}

Respond only with JSON:
{{
  "risk_score": 0-100,
  "explanation": "...",
  "suggestions": ["...", "..."]
}}"""
    return call_llm(prompt, system_prompt=_SYSTEM)
