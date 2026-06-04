from backend.openrouter_llm import call_llm

_SYSTEM = (
    "You are an expert software engineer reviewing a pull request. "
    "Respond ONLY with a JSON object — no markdown, no prose."
)


def generate_suggestions(title: str, description: str, diff: str) -> dict:
    prompt = f"""Review this pull request and provide specific, actionable improvement suggestions.

### PR Title:
{title}

### Description:
{description or "(no description)"}

### Code Diff:
{diff}

Return a JSON object:
{{"suggestions": ["concrete suggestion 1", "concrete suggestion 2", "concrete suggestion 3"]}}"""
    return call_llm(prompt, system_prompt=_SYSTEM)
