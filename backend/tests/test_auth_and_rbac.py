"""Comprehensive test suite for Authentication, Refresh Tokens, Authorization, RBAC, and Organization Data Isolation."""

from __future__ import annotations


def _register_user(client, email: str, name: str, org_name: str, pw: str = "password123"):
    res = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": name,
            "email": email,
            "password": pw,
            "organization_name": org_name,
        },
    )
    assert res.status_code == 201
    data = res.json()
    token = data["access_token"]
    refresh_token = data["refresh_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get org id from /me
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    org_id = me_data["memberships"][0]["organization_id"]
    user_id = me_data["id"]

    return {
        "user_id": user_id,
        "org_id": org_id,
        "token": token,
        "refresh_token": refresh_token,
        "headers": headers,
        "email": email,
        "password": pw,
    }


def test_auth_registration_and_tokens(client):
    """Test successful registration and token structure."""
    res = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Dr. Aarav Patel",
            "email": "aarav.patel@darukaa.org",
            "password": "SecurePassword123!",
            "organization_name": "Western Ghats Foundation",
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_auth_duplicate_email(client):
    """Test duplicate email rejection."""
    payload = {
        "full_name": "Primary User",
        "email": "unique.check@darukaa.org",
        "password": "password123",
        "organization_name": "Unique Check Org",
    }
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"].lower()


def test_auth_invalid_login(client):
    """Test invalid credentials handling."""
    _register_user(
        client, "login.test@darukaa.org", "Login Test", "Login Test Org", "correct_password"
    )

    # Wrong password
    res1 = client.post(
        "/api/v1/auth/login",
        json={
            "email": "login.test@darukaa.org",
            "password": "wrong_password",
        },
    )
    assert res1.status_code == 401

    # Non-existent email
    res2 = client.post(
        "/api/v1/auth/login",
        json={
            "email": "doesnotexist@darukaa.org",
            "password": "any_password",
        },
    )
    assert res2.status_code == 401


def test_refresh_token_architecture(client):
    """Test refresh token rotation, validation, and rejection of access tokens as refresh tokens."""
    user = _register_user(client, "refresh.user@darukaa.org", "Refresh User", "Refresh Org")

    # Valid refresh
    res = client.post(
        "/api/v1/auth/refresh",
        json={
            "refresh_token": user["refresh_token"],
        },
    )
    assert res.status_code == 200
    new_tokens = res.json()
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens

    # Verify new access token works
    me_res = client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {new_tokens['access_token']}"}
    )
    assert me_res.status_code == 200

    # Test rejection when passing access token to refresh endpoint
    bad_res = client.post(
        "/api/v1/auth/refresh",
        json={
            "refresh_token": user["token"],  # access token, not refresh token
        },
    )
    assert bad_res.status_code == 401

    # Test rejection of invalid token
    bad_res2 = client.post(
        "/api/v1/auth/refresh",
        json={
            "refresh_token": "invalid.jwt.string",
        },
    )
    assert bad_res2.status_code == 401


def test_current_user_endpoint(client):
    """Test /api/v1/auth/me returns complete user profile with organization memberships."""
    user = _register_user(client, "me.test@darukaa.org", "Me Profile Test", "Me Org")
    res = client.get("/api/v1/auth/me", headers=user["headers"])
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "me.test@darukaa.org"
    assert data["full_name"] == "Me Profile Test"
    assert data["is_active"] is True
    assert len(data["memberships"]) >= 1
    membership = data["memberships"][0]
    assert membership["organization_id"] == user["org_id"]
    assert membership["role"] == "OWNER"


def test_protected_endpoints_without_token(client):
    """Verify endpoints reject unauthenticated requests with 401."""
    assert client.get("/api/v1/auth/me").status_code == 401
    assert client.get("/api/v1/organizations").status_code == 401
    assert (
        client.get("/api/v1/projects?org_id=00000000-0000-0000-0000-000000000000").status_code
        == 401
    )


def test_organization_membership_management(client):
    """Test adding, listing, updating role, and removing members in an organization."""
    owner = _register_user(client, "org.owner@darukaa.org", "Org Owner", "Alpha Org")
    colleague = _register_user(client, "colleague@darukaa.org", "Colleague User", "Beta Org")

    # 1. Owner lists members
    list_res = client.get(
        f"/api/v1/organizations/{owner['org_id']}/members", headers=owner["headers"]
    )
    assert list_res.status_code == 200
    members = list_res.json()
    assert len(members) == 1
    assert members[0]["role"] == "OWNER"

    # 2. Owner adds colleague as ANALYST
    add_res = client.post(
        f"/api/v1/organizations/{owner['org_id']}/members",
        json={
            "email": colleague["email"],
            "role": "ANALYST",
        },
        headers=owner["headers"],
    )
    assert add_res.status_code == 201
    added_member = add_res.json()
    assert added_member["role"] == "ANALYST"
    assert added_member["user_email"] == colleague["email"]

    # 3. Owner updates colleague role to ADMIN
    update_res = client.patch(
        f"/api/v1/organizations/{owner['org_id']}/members/{colleague['user_id']}",
        json={"role": "ADMIN"},
        headers=owner["headers"],
    )
    assert update_res.status_code == 200
    assert update_res.json()["role"] == "ADMIN"

    # 4. Cannot demote or remove the last owner
    demote_res = client.patch(
        f"/api/v1/organizations/{owner['org_id']}/members/{owner['user_id']}",
        json={"role": "VIEWER"},
        headers=owner["headers"],
    )
    assert demote_res.status_code == 400
    assert "last organization owner" in demote_res.json()["detail"].lower()

    remove_owner_res = client.delete(
        f"/api/v1/organizations/{owner['org_id']}/members/{owner['user_id']}",
        headers=owner["headers"],
    )
    assert remove_owner_res.status_code == 400

    # 5. Owner removes colleague
    del_res = client.delete(
        f"/api/v1/organizations/{owner['org_id']}/members/{colleague['user_id']}",
        headers=owner["headers"],
    )
    assert del_res.status_code == 204


def test_unauthorized_organization_access_isolation(client):
    """Test strict tenant data isolation: User A cannot read, modify, or delete Org B resources."""
    user_a = _register_user(client, "tenant.a@darukaa.org", "Tenant A", "Tenant A Org")
    user_b = _register_user(client, "tenant.b@darukaa.org", "Tenant B", "Tenant B Org")

    # User B creates a project in Org B
    proj_res = client.post(
        "/api/v1/projects",
        json={
            "name": "Org B Secret Corridor",
            "organization_id": user_b["org_id"],
            "project_type": "CARBON",
        },
        headers=user_b["headers"],
    )
    assert proj_res.status_code == 201
    proj_b_id = proj_res.json()["id"]

    # 1. User A tries to list Org B projects
    res1 = client.get(f"/api/v1/projects?org_id={user_b['org_id']}", headers=user_a["headers"])
    assert res1.status_code == 403

    # 2. User A tries to view Org B project details
    res2 = client.get(f"/api/v1/projects/{proj_b_id}", headers=user_a["headers"])
    assert res2.status_code == 403

    # 3. User A tries to view Org B details
    res3 = client.get(f"/api/v1/organizations/{user_b['org_id']}", headers=user_a["headers"])
    assert res3.status_code == 403

    # 4. User A tries to view Org B audit logs
    res4 = client.get(
        f"/api/v1/organizations/{user_b['org_id']}/audit-logs", headers=user_a["headers"]
    )
    assert res4.status_code == 403

    # 5. User A tries to view Org B dashboard KPIs
    res5 = client.get(
        f"/api/v1/dashboard/kpis?org_id={user_b['org_id']}", headers=user_a["headers"]
    )
    assert res5.status_code == 403

    # 6. User A tries to view Org B map features
    res6 = client.get(f"/api/v1/map/sites?org_id={user_b['org_id']}", headers=user_a["headers"])
    assert res6.status_code == 403


def test_role_restrictions_rbac(client):
    """Test RBAC role hierarchy: VIEWER vs ANALYST vs ADMIN vs OWNER."""
    owner = _register_user(client, "rbac.owner@darukaa.org", "RBAC Owner", "RBAC Org")
    viewer = _register_user(client, "rbac.viewer@darukaa.org", "RBAC Viewer", "External Org 1")
    analyst = _register_user(client, "rbac.analyst@darukaa.org", "RBAC Analyst", "External Org 2")

    # Add viewer and analyst to RBAC Org
    client.post(
        f"/api/v1/organizations/{owner['org_id']}/members",
        json={
            "email": viewer["email"],
            "role": "VIEWER",
        },
        headers=owner["headers"],
    )

    client.post(
        f"/api/v1/organizations/{owner['org_id']}/members",
        json={
            "email": analyst["email"],
            "role": "ANALYST",
        },
        headers=owner["headers"],
    )

    # --- VIEWER PERMISSIONS ---
    # 1. Viewer CAN read projects
    read_res = client.get(f"/api/v1/projects?org_id={owner['org_id']}", headers=viewer["headers"])
    assert read_res.status_code == 200

    # 2. Viewer CANNOT create a project (requires ANALYST)
    create_proj_res = client.post(
        "/api/v1/projects",
        json={
            "name": "Viewer Forbidden Project",
            "organization_id": owner["org_id"],
            "project_type": "BIODIVERSITY",
        },
        headers=viewer["headers"],
    )
    assert create_proj_res.status_code == 403

    # 3. Viewer CANNOT add members (requires ADMIN)
    add_mem_res = client.post(
        f"/api/v1/organizations/{owner['org_id']}/members",
        json={
            "email": "someone@darukaa.org",
            "role": "VIEWER",
        },
        headers=viewer["headers"],
    )
    assert add_mem_res.status_code == 403

    # --- ANALYST PERMISSIONS ---
    # 4. Analyst CAN create a project
    analyst_proj_res = client.post(
        "/api/v1/projects",
        json={
            "name": "Analyst Allowed Project",
            "organization_id": owner["org_id"],
            "project_type": "RESTORATION",
        },
        headers=analyst["headers"],
    )
    assert analyst_proj_res.status_code == 201
    proj_id = analyst_proj_res.json()["id"]

    # 5. Analyst CAN update project
    update_proj_res = client.patch(
        f"/api/v1/projects/{proj_id}",
        json={
            "description": "Updated by analyst",
        },
        headers=analyst["headers"],
    )
    assert update_proj_res.status_code == 200

    # 6. Analyst CANNOT delete project (requires ADMIN)
    del_proj_res = client.delete(f"/api/v1/projects/{proj_id}", headers=analyst["headers"])
    assert del_proj_res.status_code == 403

    # 7. Analyst CANNOT add members
    analyst_add_mem = client.post(
        f"/api/v1/organizations/{owner['org_id']}/members",
        json={
            "email": "someone.else@darukaa.org",
            "role": "VIEWER",
        },
        headers=analyst["headers"],
    )
    assert analyst_add_mem.status_code == 403

    # --- OWNER / ADMIN PERMISSIONS ---
    # 8. Owner CAN delete project
    owner_del_res = client.delete(f"/api/v1/projects/{proj_id}", headers=owner["headers"])
    assert owner_del_res.status_code == 204
