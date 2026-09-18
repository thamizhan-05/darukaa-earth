"""Auth endpoint tests."""

from __future__ import annotations


def test_register_success(client):
    res = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Jane Doe",
            "email": "jane@test.com",
            "password": "password123",
            "organization_name": "Jane's Org",
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_register_duplicate_email(client):
    payload = {
        "full_name": "Duplicate User",
        "email": "dup@test.com",
        "password": "password123",
        "organization_name": "Dup Org",
    }
    client.post("/api/v1/auth/register", json=payload)
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 409


def test_login_success(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Login User",
            "email": "login@test.com",
            "password": "password123",
            "organization_name": "Login Org",
        },
    )
    res = client.post(
        "/api/v1/auth/login",
        json={
            "email": "login@test.com",
            "password": "password123",
        },
    )
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_login_wrong_password(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Wrong Pass",
            "email": "wrong@test.com",
            "password": "correct123",
            "organization_name": "WP Org",
        },
    )
    res = client.post(
        "/api/v1/auth/login",
        json={
            "email": "wrong@test.com",
            "password": "wrongpass",
        },
    )
    assert res.status_code == 401


def test_me_authenticated(client, auth_headers):
    res = client.get("/api/v1/auth/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "email" in data
    assert "full_name" in data


def test_me_unauthenticated(client):
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401
