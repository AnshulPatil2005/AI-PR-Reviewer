import os
from datetime import datetime, timedelta, timezone

from github import Github, GithubException


def _parse_owner_repo(repo_url: str) -> str:
    url = repo_url.rstrip("/").replace(".git", "")
    parts = url.split("github.com/")
    if len(parts) < 2 or not parts[1].strip("/"):
        raise ValueError("Invalid GitHub URL. Expected https://github.com/<owner>/<repo>")
    return parts[1].strip("/")


def get_repo_stats(repo_url: str) -> dict:
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        raise EnvironmentError("GITHUB_TOKEN is not set.")

    g = Github(token)
    owner_repo = _parse_owner_repo(repo_url)

    try:
        repo = g.get_repo(owner_repo)
    except GithubException as e:
        raise ValueError(f"Could not fetch repo '{owner_repo}': {e.data.get('message', str(e))}")

    # Language
    languages = repo.get_languages()
    primary_language = max(languages, key=lambda k: languages[k]) if languages else "Unknown"

    # Open PR count
    try:
        open_prs = repo.get_pulls(state="open").totalCount
    except Exception:
        open_prs = 0

    # PRs merged in last 30 days — iterate recent closed PRs, stop when too old
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    prs_merged_last_30d = 0
    try:
        for pr in repo.get_pulls(state="closed", sort="updated", direction="desc"):
            if pr.updated_at and pr.updated_at.replace(tzinfo=timezone.utc) < cutoff:
                break
            if pr.merged_at:
                merged_at = pr.merged_at
                if merged_at.tzinfo is None:
                    merged_at = merged_at.replace(tzinfo=timezone.utc)
                if merged_at > cutoff:
                    prs_merged_last_30d += 1
    except Exception:
        pass

    # Top contributors (up to 5)
    top_contributors: list[str] = []
    try:
        for contributor in repo.get_contributors():
            top_contributors.append(contributor.login)
            if len(top_contributors) >= 5:
                break
    except Exception:
        pass

    pushed_at = repo.pushed_at
    if pushed_at and pushed_at.tzinfo is None:
        pushed_at = pushed_at.replace(tzinfo=timezone.utc)

    return {
        "repo_name": repo.full_name,
        "description": repo.description or "",
        "language": primary_language,
        "stars": repo.stargazers_count,
        "forks": repo.forks_count,
        "open_issues": repo.open_issues_count - open_prs,  # GitHub open_issues includes PRs
        "open_prs": open_prs,
        "prs_merged_last_30d": prs_merged_last_30d,
        "top_contributors": top_contributors,
        "last_pushed_at": pushed_at.isoformat() if pushed_at else None,
    }
