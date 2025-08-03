import os
import requests
from dotenv import load_dotenv

load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

headers = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json"
}

API_URL = "https://openrouter.ai/api/v1/chat/completions"

def call_llm(prompt: str) -> dict:
    try:
        payload = {
            "model": "mistralai/mistral-7b-instruct",  # You can also use "openai/gpt-3.5-turbo" or others
            "messages": [
                {"role": "system", "content": "You are a code quality auditor. Return a JSON object."},
                {"role": "user", "content": prompt}
            ]
        }

        response = requests.post(API_URL, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()

        # Extract model response and attempt to parse JSON
        content = result["choices"][0]["message"]["content"]

        import re, json
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            return json.loads(match.group())
        else:
            return {"risk_score": 50, "explanation": "Could not parse model output", "suggestions": []}

    except Exception as e:
        return {
            "risk_score": 50,
            "explanation": f"{type(e).__name__}: {str(e)}",
            "suggestions": []
        }
