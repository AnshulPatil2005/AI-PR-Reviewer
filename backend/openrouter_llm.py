# backend/openrouter_llm.py
import os
import time
import requests
from dotenv import load_dotenv
from pathlib import Path

# Load .env from backend directory
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

headers = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "https://github.com/AI-PR-Reviewer",  # Optional: identifies your app
    "X-Title": "AI PR Reviewer"  # Optional: for app rankings
}

API_URL = "https://openrouter.ai/api/v1/chat/completions"

def call_llm(prompt: str, max_retries: int = 3) -> dict:
    """
    Call OpenRouter LLM API with retry logic for rate limits.
    Falls back to alternative models if the primary model is rate-limited.
    """
    # List of free models to try in order (tested and working)
    # All models are free but have rate limits
    models = [
        "meta-llama/llama-3.2-3b-instruct:free",  # FREE: Working, decent quality
        "google/gemini-2.0-flash-exp:free",  # FREE: Rate limited but good
        "mistralai/mistral-7b-instruct:free",  # FREE: Backup option
    ]

    last_error = None

    for model in models:
        for attempt in range(max_retries):
            try:
                payload = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "You are a code quality auditor. Return a JSON object."},
                        {"role": "user", "content": prompt}
                    ]
                }

                response = requests.post(API_URL, headers=headers, json=payload, timeout=30)
                response.raise_for_status()
                result = response.json()

                # Extract model response and attempt to parse JSON
                content = result["choices"][0]["message"]["content"]
                print(f"✓ Successfully used model: {model}")

                import re, json
                match = re.search(r'\{.*\}', content, re.DOTALL)
                if match:
                    parsed_result = json.loads(match.group())
                    print(f"✓ Parsed result: risk_score={parsed_result.get('risk_score', 'N/A')}")
                    return parsed_result
                else:
                    print(f"⚠ Could not parse JSON from model output")
                    return {"risk_score": 50, "explanation": "Could not parse model output", "suggestions": []}

            except requests.exceptions.HTTPError as e:
                last_error = e

                # Check if it's a rate limit error (429)
                if e.response and e.response.status_code == 429:
                    if attempt < max_retries - 1:
                        # Exponential backoff: wait 2^attempt seconds
                        wait_time = 2 ** attempt
                        print(f"Rate limited on {model}, retrying in {wait_time}s... (attempt {attempt + 1}/{max_retries})")
                        time.sleep(wait_time)
                        continue
                    else:
                        # Move to next model if all retries exhausted
                        print(f"Rate limit exhausted for {model}, trying next model...")
                        break

                # For other HTTP errors, try next model immediately
                print(f"HTTP error {e.response.status_code if e.response else 'unknown'} on {model}, trying next model...")
                break

            except Exception as e:
                last_error = e
                # For non-HTTP errors, try next model
                print(f"Error with {model}: {type(e).__name__}: {str(e)}")
                break

    # If all models failed, return error response

    if isinstance(last_error, requests.exceptions.HTTPError):
        error_detail = str(last_error)
        if hasattr(last_error, 'response') and last_error.response is not None:
            try:
                error_json = last_error.response.json()
                error_detail = f"{last_error.response.status_code}: {error_json.get('error', {}).get('message', str(last_error))}"
            except:
                error_detail = f"{last_error.response.status_code}: {last_error.response.text[:200]}"

        return {
            "risk_score": 50,
            "explanation": f"All models rate-limited or unavailable. Error: {error_detail}",
            "suggestions": [
                "OpenRouter free tier has strict rate limits",
                "Wait a few minutes and try again",
                "Consider upgrading to paid tier or using your own API key"
            ]
        }
    else:
        return {
            "risk_score": 50,
            "explanation": f"API Error: {type(last_error).__name__}: {str(last_error) if last_error else 'Unknown error'}",
            "suggestions": ["Check your OPENROUTER_API_KEY", "Verify network connectivity"]
        }
