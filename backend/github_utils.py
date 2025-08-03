# File: github_utils.py

from github import Github, GithubException
from typing import Tuple
import os
import re
import requests

# Load GitHub token
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
if not GITHUB_TOKEN:
    raise EnvironmentError("Missing GITHUB_TOKEN in environment variables.")

# Initialize GitHub client
g = Github(GITHUB_TOKEN)

def fetch_pr_details(repo_url: str, pr_number: int) -> Tuple[str, str, str]:
    """
    Fetch title, body, and diff for a GitHub pull request.

    Args:
        repo_url (str): Full repo URL (e.g., https://github.com/owner/repo)
        pr_number (int): Pull request number

    Returns:
        Tuple[str, str, str]: (title, description, diff)
    """
    # Validate and extract "owner/repo" from URL
    match = re.search(r"github\.com/([^/]+/[^/]+)", repo_url)
    if not match:
        raise ValueError("Invalid repo_url. Use format: https://github.com/owner/repo")

    owner_repo = match.group(1)
    print(f"[INFO] Parsed repository: {owner_repo}")

    try:
        repo = g.get_repo(owner_repo)
    except GithubException as e:
        raise ValueError(f"[GitHub Error] Cannot access repo '{owner_repo}': {e.data.get('message', e)}")

    try:
        pr = repo.get_pull(pr_number)
    except GithubException as e:
        raise ValueError(f"[GitHub Error] Cannot fetch PR #{pr_number}: {e.data.get('message', e)}")

    # Fetch diff content manually via diff_url
    headers = {
        "Accept": "application/vnd.github.v3.diff",
        "Authorization": f"token {GITHUB_TOKEN}"
    }
    diff_response = requests.get(pr.diff_url, headers=headers)

    if diff_response.status_code != 200:
        raise ValueError(f"Failed to fetch diff. Status {diff_response.status_code}: {diff_response.text}")

    return pr.title or "", pr.body or "", diff_response.text
