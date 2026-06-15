from backend.openrouter_llm import call_llm

_SYSTEM = (
    "You are a senior code reviewer. Assess pull request changes for risk. "
    "Respond ONLY with a JSON object — no markdown, no prose."
)


def assess_risk(title: str, description: str, diff: str) -> dict:
    prompt = f"""Analyze this pull request. Return ONLY this JSON structure:
{{
  "risk_score": <integer 0-100, where 0=safe and 100=critical>,
  "explanation": "<one concise paragraph explaining the risk level>",
  "suggestions": ["<plain string suggestion 1>", "<plain string suggestion 2>", "<plain string suggestion 3>"]
}}

Each suggestion MUST be a plain string sentence — no nested objects, no arrays inside suggestions.

### PR Title:
{title}

### Description:
{description or "(no description)"}

### Code Diff:
{diff}"""
    return call_llm(prompt, system_prompt=_SYSTEM)
