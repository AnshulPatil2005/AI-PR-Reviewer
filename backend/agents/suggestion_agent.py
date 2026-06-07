from backend.openrouter_llm import call_llm

_SYSTEM = (
    "You are an expert software engineer reviewing a pull request. "
    "Respond ONLY with a JSON object — no markdown, no prose."
)


def generate_suggestions(title: str, description: str, diff: str) -> dict:
    prompt = f"""Review this pull request and return ONLY this JSON structure with no other keys:
{{"suggestions": ["string suggestion 1", "string suggestion 2", "string suggestion 3"]}}

Each suggestion MUST be a plain string sentence. Do NOT use objects, arrays, or nested structures inside suggestions.

### PR Title:
{title}

### Description:
{description or "(no description)"}

### Code Diff:
{diff}"""
    return call_llm(prompt, system_prompt=_SYSTEM)
