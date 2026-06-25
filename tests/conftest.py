"""Shared fixtures for all tests."""
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base, get_db
from backend.main import app

# ── Fake data used across test modules ──────────────────────────

FAKE_PR_DETAILS = {
    "title": "Add payment processing module",
    "description": "Implements Stripe integration",
    "diff": (
        "diff --git a/payments.py b/payments.py\n"
        "--- a/payments.py\n+++ b/payments.py\n"
        "@@ -0,0 +1,5 @@\n+def process(amount):\n+    return charge(amount)\n"
    ),
    "files_changed": ["payments.py"],
    "pr_number": 42,
    "repo_url": "https://github.com/test/repo",
    "additions": 5,
    "deletions": 0,
    "changed_files": 1,
}

FAKE_ANALYSIS_RESULT = {
    "risk_score": 30,
    "explanation": "Low-risk payment stub.",
    "executive_summary": "Straightforward addition.",
    "suggestions": ["Add error handling"],
    "top_priorities": ["Add tests"],
    "findings": [],
    "file_analyses": [
        {
            "filename": "payments.py",
            "risk_score": 30,
            "explanation": "Simple function.",
            "change_summary": "New file",
            "categories": ["new-code"],
            "why_it_matters": "Core payment path",
            "coverage_status": "reviewed",
            "skipped_reason": "",
            "priority_rank": 1,
            "reviewed_chars": 50,
            "total_chars": 50,
        }
    ],
    "coverage_summary": {
        "reviewed_files": ["payments.py"],
        "skipped_files": [],
        "truncated_files": [],
        "reviewed_count": 1,
        "skipped_count": 0,
        "truncated_count": 0,
    },
    "model_metadata": {"review_mode": "general", "fallback_used": False},
    "review_confidence": 0.85,
    "review_mode": "general",
}

FAKE_REPO_STATS = {
    "repo_name": "test/repo",
    "description": "A test repo",
    "language": "Python",
    "stars": 10,
    "forks": 2,
    "open_issues": 3,
    "open_prs": 1,
    "prs_merged_last_30d": 5,
    "top_contributors": ["alice", "bob"],
    "last_pushed_at": "2026-06-01T00:00:00Z",
}


# ── Core fixture: isolated in-memory DB per test ─────────────────

@pytest.fixture
def client():
    """
    Provide a TestClient backed by a fresh in-memory SQLite database.
    The startup event is patched so it doesn't touch the real app.db.
    """
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=test_engine)
    TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    def override_get_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with (
        patch("backend.main.Base.metadata.create_all"),
        patch("backend.main.ensure_runtime_schema"),
    ):
        with TestClient(app) as c:
            yield c

    app.dependency_overrides.clear()
    test_engine.dispose()


# ── Auth helpers ─────────────────────────────────────────────────

def register(client, email="user@example.com", password="password123"):
    """Register a new user and return the full response."""
    return client.post("/auth/register", json={"email": email, "password": password})


def auth_headers(client, email="user@example.com", password="password123"):
    """Register (or use existing account) and return Bearer headers."""
    register(client, email, password)
    res = client.post("/auth/login", json={"email": email, "password": password})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
