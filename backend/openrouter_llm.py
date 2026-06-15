import json
import os
import re
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
API_URL = "https://openrouter.ai/api/v1/chat/completions"

_HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "https://github.com/AI-PR-Reviewer",
    "X-Title": "AI PR Reviewer",
}

_MODELS = [
    "deepseek/deepseek-r1-0528:free",
    "deepseek/deepseek-chat-v3-0324:free",
    "google/gemma-4-31b-it:free",
    "qwen/qwen3-235b-a22b:free",
    "qwen/qwen3-30b-a3b:free",
    "microsoft/phi-4-reasoning:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "z-ai/glm-4.5-air:free",
    "nvidia/nemotron-nano-9b-v2:free",
    "mistralai/mistral-7b-instruct:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "google/gemma-2-9b-it:free",
]

_MAX_DIFF_CHARS = 6000


def _truncate_diff(prompt: str) -> str:
    if len(prompt) > _MAX_DIFF_CHARS:
        return prompt[:_MAX_DIFF_CHARS] + "\n\n[...diff truncated for length...]"
    return prompt


def _extract_json(content: str) -> dict | None:
    match = re.search(r"\{.*\}", content, re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group())
    except json.JSONDecodeError:
        return None


def call_llm(
    prompt: str,
    system_prompt: str = "You are a code quality auditor. Return a JSON object.",
    max_retries: int = 2,
) -> dict:
    prompt = _truncate_diff(prompt)
    last_error = None
    attempted_models: list[str] = []
    last_model: str | None = None

    for model in _MODELS:
        attempted_models.append(model)
        for attempt in range(max_retries):
            try:
                payload = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt},
                    ],
                }
                response = requests.post(API_URL, headers=_HEADERS, json=payload, timeout=30)
                response.raise_for_status()
                content = response.json()["choices"][0]["message"]["content"]
                last_model = model
                print(f"[OK] Model used: {model}")

                parsed = _extract_json(content)
                meta = {
                    "model": model,
                    "attempted_models": attempted_models,
                    "fallback_used": len(attempted_models) > 1,
                }
                if parsed is not None:
                    parsed.setdefault("risk_score", 50)
                    parsed.setdefault("explanation", "No explanation provided.")
                    parsed.setdefault("suggestions", [])
                    parsed["_meta"] = {**meta, "raw_parse_ok": True}
                    return parsed

                print("[WARN] Could not parse JSON from model output")
                return {
                    "risk_score": 50,
                    "explanation": "Could not parse model output",
                    "suggestions": [],
                    "_meta": {**meta, "raw_parse_ok": False},
                }

            except requests.exceptions.HTTPError as e:
                last_error = e
                if e.response and e.response.status_code == 429:
                    if attempt < max_retries - 1:
                        wait_time = 2**attempt
                        print(f"Rate limited on {model}, retrying in {wait_time}s...")
                        time.sleep(wait_time)
                        continue
                    print(f"Rate limit exhausted for {model}, trying next model...")
                    break
                print(f"HTTP error on {model}, trying next model...")
                break

            except Exception as e:
                last_error = e
                print(f"Error with {model}: {type(e).__name__}: {e}")
                break

    error_msg = str(last_error) if last_error else "Unknown error"
    return {
        "risk_score": 50,
        "explanation": f"All LLM models unavailable. Error: {error_msg}",
        "suggestions": [
            "OpenRouter free tier has strict rate limits. Wait a few minutes and retry.",
            "Check your OPENROUTER_API_KEY.",
        ],
        "_meta": {
            "model": last_model,
            "attempted_models": attempted_models,
            "fallback_used": len(attempted_models) > 1,
            "raw_parse_ok": False,
            "error": error_msg,
        },
    }
