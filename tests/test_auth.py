"""Tests for /auth/register, /auth/login, /auth/me."""
import pytest
from tests.conftest import auth_headers, register


class TestRegister:
    def test_success(self, client):
        res = register(client, "new@example.com", "strongpass1")
        assert res.status_code == 201
        body = res.json()
        assert "access_token" in body
        assert body["email"] == "new@example.com"
        assert "user_id" in body

    def test_duplicate_email(self, client):
        register(client, "dup@example.com", "password123")
        res = register(client, "dup@example.com", "password123")
        assert res.status_code == 400
        assert "already registered" in res.json()["detail"].lower()

    def test_short_password(self, client):
        res = register(client, "short@example.com", "abc")
        assert res.status_code == 400
        assert "8 characters" in res.json()["detail"].lower()

    def test_invalid_email(self, client):
        res = client.post("/auth/register", json={"email": "not-an-email", "password": "password123"})
        assert res.status_code == 422  # Pydantic EmailStr validation


class TestLogin:
    def test_success(self, client):
        register(client, "login@example.com", "password123")
        res = client.post("/auth/login", json={"email": "login@example.com", "password": "password123"})
        assert res.status_code == 200
        body = res.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"

    def test_wrong_password(self, client):
        register(client, "wp@example.com", "correctpass")
        res = client.post("/auth/login", json={"email": "wp@example.com", "password": "wrongpass"})
        assert res.status_code == 401
        assert "invalid" in res.json()["detail"].lower()

    def test_unknown_email(self, client):
        res = client.post("/auth/login", json={"email": "nobody@example.com", "password": "password123"})
        assert res.status_code == 401

    def test_invalid_email_format(self, client):
        res = client.post("/auth/login", json={"email": "not-email", "password": "password123"})
        assert res.status_code == 422

    def test_missing_fields(self, client):
        res = client.post("/auth/login", json={"email": "a@b.com"})
        assert res.status_code == 422


class TestMe:
    def test_authenticated(self, client):
        headers = auth_headers(client, "me@example.com", "password123")
        res = client.get("/auth/me", headers=headers)
        assert res.status_code == 200
        body = res.json()
        assert body["email"] == "me@example.com"
        assert "monthly_quota" in body
        assert "analyses_this_month" in body
        assert body["monthly_quota"] == 10
        assert body["analyses_this_month"] == 0

    def test_no_token(self, client):
        res = client.get("/auth/me")
        assert res.status_code == 401

    def test_invalid_token(self, client):
        res = client.get("/auth/me", headers={"Authorization": "Bearer not.a.real.token"})
        assert res.status_code == 401

    def test_malformed_header(self, client):
        res = client.get("/auth/me", headers={"Authorization": "Basic dXNlcjpwYXNz"})
        assert res.status_code == 401
