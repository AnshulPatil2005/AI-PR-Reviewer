from huggingface_llm import call_llm

def generate_suggestions(title, description, diff):
    prompt = f"""You are an experienced GitHub reviewer.
Title: {title}
Description: {description}
Diff: {diff}

Give 2-3 suggestions to improve the PR in a JSON list:
{{"suggestions": ["tip1", "tip2"]}}
"""
    return call_llm(prompt)
