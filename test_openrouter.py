#!/usr/bin/env python3
"""Test script to verify OpenRouter API key and connectivity."""

import os
import requests
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
env_path = Path(__file__).parent / 'backend' / '.env'
load_dotenv(dotenv_path=env_path)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

print(f"API Key found: {OPENROUTER_API_KEY[:15]}..." if OPENROUTER_API_KEY else "No API key found!")
print(f"API Key length: {len(OPENROUTER_API_KEY) if OPENROUTER_API_KEY else 0}")
print()

if not OPENROUTER_API_KEY:
    print("ERROR: OPENROUTER_API_KEY not found in environment")
    exit(1)

# Test the API
headers = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "https://github.com/AI-PR-Reviewer",
    "X-Title": "AI PR Reviewer Test"
}

payload = {
    "model": "mistralai/mistral-7b-instruct",
    "messages": [
        {"role": "user", "content": "Say 'Hello, API is working!' in JSON format: {\"message\": \"...\"}"}
    ]
}

print("Testing OpenRouter API...")
print(f"URL: https://openrouter.ai/api/v1/chat/completions")
print(f"Model: {payload['model']}")
print()

try:
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json=payload,
        timeout=30
    )

    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print()

    if response.status_code == 200:
        result = response.json()
        print("✓ SUCCESS!")
        print(f"Response: {result}")
        print()
        print(f"Content: {result['choices'][0]['message']['content']}")
    else:
        print("✗ FAILED!")
        print(f"Error Response: {response.text}")
        print()

        # Try to parse error details
        try:
            error_json = response.json()
            print(f"Error Details: {error_json}")
        except:
            pass

except Exception as e:
    print(f"✗ EXCEPTION: {type(e).__name__}: {str(e)}")
