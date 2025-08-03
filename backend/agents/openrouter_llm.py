# File: openrouter_llm.py

import os
import requests
import json
import re
from dotenv import load_dotenv

# Load your OpenRouter API key from the .env file
load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

API_URL = "https://openrouter.ai/api/v1/chat/completions"
HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json"
}

def call_llm(prompt: str) -> dict:
    try:
        payload = {
            "model": "mistralai/mistral-7b-instruct",  # You can change to other OpenRouter models
            "messages": [
                {"role": "system", "content": "You are a code quality auditor. Return a JSON object."},
                {"role": "user", "content": prompt}
            ]
        }

        response = requests.post(API_URL, headers=HEADERS, json=payload)
        response.raise_for_status()

        content = response.json()["choices"][0]["message"]["content"]

        # Extract the JSON from the model's response
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            return json.loads(match.group())
        else:
            return {
                "risk_score": 50,
                "explanation": "Could not parse model output",
                "suggestions": []
            }

    except Exception as e:
        return {
            "risk_score": 50,
            "explanation": f"{type(e).__name__}: {str(e)}",
            "suggestions": []
        }
