from backend.openrouter_llm import call_llm

_SYSTEM = (
    "You are a senior code reviewer analyzing a single file's diff. "
    "Respond ONLY with a JSON object — no markdown, no prose."
)


def analyze_file(filename: str, file_diff: str) -> dict:
    """Analyze a single file diff and return risk_score + explanation."""
    prompt = f"""Analyze the following diff for the file '{filename}' and return a JSON object with:
- "risk_score": integer 0 (no risk) to 100 (critical)
- "explanation": one sentence summarizing the risk in this file

### File: {filename}

### Diff:
{file_diff}

Respond only with JSON:
{{"risk_score": 0-100, "explanation": "..."}}"""

    result = call_llm(prompt, system_prompt=_SYSTEM)
    return {
        "filename": filename,
        "risk_score": result.get("risk_score", 50),
        "explanation": result.get("explanation", "Could not analyze file."),
    }
