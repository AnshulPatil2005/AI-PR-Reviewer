# File: backend/github_utils.py
"""
Utilities for fetching GitHub Pull Request details (title, body, and diff).

- Loads the GitHub token from the environment at call-time (not import-time).
- Validates repo URLs like:
    https://github.com/owner/repo
    https://github.com/owner/repo/
    https://github.com/owner/repo.git
- Uses PyGithub for metadata and requests for the raw diff (PR.diff_url).
- Provides clear exceptions with actionable messages.
"""

from __future__ import annotations

import os
import re
from typing import Tuple

import requests
from github import Github, GithubException


# --- Constants ---
# Accept header for raw unified diff; see GitHub v3 media types docs
_GH_DIFF_ACCEPT = "application/vnd.github.v3.diff"
# Default network timeout (seconds) for outbound calls
_HTTP_TIMEOUT = 20


def _get_github_token() -> str:
    """Fetch the GitHub token from env or raise a clear error."""
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        raise EnvironmentError(
            "Missing GITHUB_TOKEN in environment variables. "
            "Create a fine-grained PAT and set GITHUB_TOKEN before running."
        )
    return token


def _parse_owner_repo(repo_url: str) -> str:
    """
    Extract 'owner/repo' from a canonical GitHub URL. Accepts optional trailing slash or '.git'.

    Examples:
        https://github.com/openai/openai-python        -> openai/openai-python
        https://github.com/openai/openai-python/       -> openai/openai-python
        https://github.com/openai/openai-python.git    -> openai/openai-python
    """
    # Normalize whitespace
    repo_url = repo_url.strip()

    # Regex captures owner/repo immediately after 'github.com/'
    m = re.search(r"github\.com/([^/\s]+)/([^/\s]+)", repo_url, flags=re.IGNORECASE)
    if not m:
        raise ValueError(
            "Invalid repo_url. Expected format like: https://github.com/<owner>/<repo>"
        )

    owner = m.group(1)
    repo = m.group(2)

    # Drop a trailing ".git" if present in repo
    if repo.lower().endswith(".git"):
        repo = repo[:-4]

    return f"{owner}/{repo}"


def fetch_pr_details(repo_url: str, pr_number: int) -> Tuple[str, str, str]:
    """
    Fetch (title, body, diff) for a GitHub pull request.

    Args:
        repo_url: Full repo URL (e.g., 'https://github.com/owner/repo')
        pr_number: Pull request number (int)

    Returns:
        (title, description, diff) where title/description are empty strings if missing.

    Raises:
        EnvironmentError: if GITHUB_TOKEN is not set.
        ValueError: for invalid repo URL or when PR/repo cannot be accessed.
        requests.HTTPError: if fetching the diff fails with a non-200 response.
    """
    token = _get_github_token()
    owner_repo = _parse_owner_repo(repo_url)

    # Initialize PyGithub lazily
    gh = Github(token)

    # Resolve repository
    try:
        repo = gh.get_repo(owner_repo)
    except GithubException as e:
        # Provide a concise, helpful error
        msg = getattr(e, "data", {}).get("message") if hasattr(e, "data") else None
        raise ValueError(
            f"[GitHub Error] Cannot access repo '{owner_repo}': {msg or str(e)}"
        ) from e

    # Load Pull Request object
    try:
        pr = repo.get_pull(int(pr_number))
    except GithubException as e:
        msg = getattr(e, "data", {}).get("message") if hasattr(e, "data") else None
        raise ValueError(
            f"[GitHub Error] Cannot fetch PR #{pr_number} from '{owner_repo}': {msg or str(e)}"
        ) from e

    # Fetch unified diff using the PR's diff_url with a direct HTTP GET
    headers = {
        "Accept": _GH_DIFF_ACCEPT,
        "Authorization": f"token {token}",
        "User-Agent": "AI-PR-Reviewer/1.0",
    }

    # Use a short-lived session for a single request (keeps code simple & explicit)
    resp = requests.get(pr.diff_url, headers=headers, timeout=_HTTP_TIMEOUT)
    try:
        resp.raise_for_status()
    except requests.HTTPError as e:
        # Surface body snippet to aid debugging (rate limits, permissions, etc.)
        snippet = resp.text[:300].replace("\n", " ")
        raise requests.HTTPError(
            f"Failed to fetch diff from {pr.diff_url} "
            f"(status {resp.status_code}). Body (truncated): {snippet}"
        ) from e

    title = pr.title or ""
    body = pr.body or ""
    diff = resp.text

    return title, body, diff
