"""Tests for /analyses, /repos/analytics, quota enforcement, and misc endpoints."""
import json
import pytest
from datetime import datetime
from unittest.mock import patch
from tests.conftest import auth_headers, FAKE_REPO_STATS, FAKE_ANALYSIS_RESULT


# ── Helpers ──────────────────────────────────────────────────────

def _seed_completed_analysis(client, headers, repo_url="https://github.com/test/repo", pr_number=1):
    """
    Directly insert a completed Analysis row so tests don't depend on the
    background job runner.  Returns the analysis dict.
    """
    from backend.database import get_db
    from backend.models import Analysis, User

    # Retrieve the db session from the overridden dependency
    db_gen = client.app.dependency_overrides[get_db]()
    db = next(db_gen)

    user = db.query(User).first()
    analysis = Analysis(
        user_id=user.id,
        repo_url=repo_url,
        pr_number=pr_number,
        pr_title="Test PR",
        risk_score=42,
        explanation="Test explanation",
        suggestions=json.dumps(["Fix this"]),
        top_priorities=json.dumps(["High priority fix"]),
        status="completed",
        review_mode="general",
        review_confidence=0.9,
        coverage_summary=json.dumps(FAKE_ANALYSIS_RESULT["coverage_summary"]),
        model_metadata=json.dumps(FAKE_ANALYSIS_RESULT["model_metadata"]),
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis.id


class TestListAnalyses:
    def test_empty(self, client):
        headers = auth_headers(client)
        res = client.get("/analyses", headers=headers)
        assert res.status_code == 200
        assert res.json() == []

    def test_unauthenticated(self, client):
        res = client.get("/analyses")
        assert res.status_code == 401

    def test_lists_own_analyses_only(self, client):
        headers_a = auth_headers(client, "a@example.com")
        headers_b = auth_headers(client, "b@example.com")

        _seed_completed_analysis(client, headers_a)

        res_a = client.get("/analyses", headers=headers_a)
        res_b = client.get("/analyses", headers=headers_b)

        assert len(res_a.json()) == 1
        assert len(res_b.json()) == 0

    def test_pagination_params_accepted(self, client):
        headers = auth_headers(client)
        res = client.get("/analyses?page=1&limit=5", headers=headers)
        assert res.status_code == 200


class TestGetAnalysis:
    def test_not_found(self, client):
        headers = auth_headers(client)
        res = client.get("/analyses/99999", headers=headers)
        assert res.status_code == 404

    def test_returns_own_analysis(self, client):
        headers = auth_headers(client)
        aid = _seed_completed_analysis(client, headers)
        res = client.get(f"/analyses/{aid}", headers=headers)
        assert res.status_code == 200
        body = res.json()
        assert body["id"] == aid
        assert body["risk_score"] == 42
        assert body["status"] == "completed"

    def test_cannot_access_other_users_analysis(self, client):
        headers_a = auth_headers(client, "a@example.com")
        headers_b = auth_headers(client, "b@example.com")
        aid = _seed_completed_analysis(client, headers_a)
        res = client.get(f"/analyses/{aid}", headers=headers_b)
        assert res.status_code == 404

    def test_unauthenticated(self, client):
        res = client.get("/analyses/1")
        assert res.status_code == 401


class TestDeleteAnalysis:
    def test_soft_delete(self, client):
        headers = auth_headers(client)
        aid = _seed_completed_analysis(client, headers)

        del_res = client.delete(f"/analyses/{aid}", headers=headers)
        assert del_res.status_code == 204

        # Soft-deleted: no longer visible in list
        res = client.get("/analyses", headers=headers)
        ids = [a["id"] for a in res.json()]
        assert aid not in ids

    def test_delete_nonexistent(self, client):
        headers = auth_headers(client)
        res = client.delete("/analyses/99999", headers=headers)
        assert res.status_code == 404

    def test_cannot_delete_other_users_analysis(self, client):
        headers_a = auth_headers(client, "a@example.com")
        headers_b = auth_headers(client, "b@example.com")
        aid = _seed_completed_analysis(client, headers_a)
        res = client.delete(f"/analyses/{aid}", headers=headers_b)
        assert res.status_code == 404


class TestInsights:
    def test_empty_insights(self, client):
        headers = auth_headers(client)
        res = client.get("/analyses/insights", headers=headers)
        assert res.status_code == 200
        body = res.json()
        assert "most_analyzed_repos" in body
        assert "average_risk_by_repo" in body
        assert "recent_high_risk_prs" in body

    def test_unauthenticated(self, client):
        res = client.get("/analyses/insights")
        assert res.status_code == 401

    def test_insights_with_data(self, client):
        headers = auth_headers(client)
        _seed_completed_analysis(client, headers, pr_number=1)
        _seed_completed_analysis(client, headers, pr_number=2)
        res = client.get("/analyses/insights", headers=headers)
        assert res.status_code == 200
        body = res.json()
        assert len(body["most_analyzed_repos"]) >= 1


class TestExport:
    def test_json_export(self, client):
        headers = auth_headers(client)
        aid = _seed_completed_analysis(client, headers)
        res = client.get(f"/analyses/{aid}/export?format=json", headers=headers)
        assert res.status_code == 200

    def test_markdown_export(self, client):
        headers = auth_headers(client)
        aid = _seed_completed_analysis(client, headers)
        res = client.get(f"/analyses/{aid}/export?format=markdown", headers=headers)
        assert res.status_code == 200

    def test_invalid_format(self, client):
        headers = auth_headers(client)
        aid = _seed_completed_analysis(client, headers)
        res = client.get(f"/analyses/{aid}/export?format=xlsx", headers=headers)
        assert res.status_code in (400, 422)

    def test_export_not_found(self, client):
        headers = auth_headers(client)
        res = client.get("/analyses/99999/export?format=json", headers=headers)
        assert res.status_code == 404


class TestCompare:
    def test_compare_no_baseline(self, client):
        headers = auth_headers(client)
        aid = _seed_completed_analysis(client, headers)
        res = client.get(f"/analyses/{aid}/compare", headers=headers)
        assert res.status_code == 200
        body = res.json()
        assert "risk_delta" in body
        assert "findings_added" in body

    def test_compare_not_found(self, client):
        headers = auth_headers(client)
        res = client.get("/analyses/99999/compare", headers=headers)
        assert res.status_code == 404


class TestRepoAnalytics:
    def test_unauthenticated(self, client):
        res = client.get("/repos/analytics?repo_url=https://github.com/test/repo")
        assert res.status_code == 401

    def test_missing_repo_url(self, client):
        headers = auth_headers(client)
        res = client.get("/repos/analytics", headers=headers)
        assert res.status_code == 422

    def test_success(self, client):
        headers = auth_headers(client)
        with patch("backend.main.get_repo_stats", return_value=FAKE_REPO_STATS):
            res = client.get(
                "/repos/analytics?repo_url=https://github.com/test/repo",
                headers=headers,
            )
        assert res.status_code == 200
        body = res.json()
        assert body["repo_name"] == "test/repo"
        assert body["language"] == "Python"
        assert body["stars"] == 10

    def test_invalid_repo_url(self, client):
        headers = auth_headers(client)
        with patch("backend.main.get_repo_stats", side_effect=ValueError("bad url")):
            res = client.get(
                "/repos/analytics?repo_url=not-a-url",
                headers=headers,
            )
        assert res.status_code in (400, 422, 500)


class TestQuota:
    def test_quota_enforced_after_limit(self, client):
        """After monthly_quota analyses, the next job creation returns 429."""
        headers = auth_headers(client, "quota@example.com")

        # Set quota to 2 for this user directly via the DB
        from backend.database import get_db
        from backend.models import User
        db_gen = client.app.dependency_overrides[get_db]()
        db = next(db_gen)
        user = db.query(User).filter(User.email == "quota@example.com").first()
        user.monthly_quota = 2
        user.analyses_this_month = 2  # already at limit
        # Set quota_reset_date so _check_and_increment_quota doesn't reset the counter
        now = datetime.utcnow()
        user.quota_reset_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        db.commit()

        with patch("backend.main.threading.Thread") as mock_thread:
            mock_thread.return_value.start.return_value = None
            res = client.post(
                "/analysis-jobs",
                json={"repo_url": "https://github.com/test/repo", "pr_number": 99, "review_mode": "general"},
                headers=headers,
            )

        assert res.status_code == 429
        assert "quota" in res.json()["detail"].lower()

    def test_quota_shows_in_me(self, client):
        headers = auth_headers(client, "me2@example.com")
        res = client.get("/auth/me", headers=headers)
        assert res.status_code == 200
        body = res.json()
        assert body["monthly_quota"] == 10
        assert body["analyses_this_month"] == 0
        assert "quota_resets_on" in body


class TestHealthCheck:
    def test_get(self, client):
        res = client.get("/")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"

    def test_head(self, client):
        res = client.head("/")
        assert res.status_code == 200
