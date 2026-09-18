"""Projects endpoint tests."""


def _get_org_id(client, headers):
    res = client.get("/api/v1/organizations", headers=headers)
    assert res.status_code == 200
    return res.json()[0]["id"]


def test_create_project(client, auth_headers):
    org_id = _get_org_id(client, auth_headers)
    res = client.post(
        "/api/v1/projects",
        json={
            "name": "Test Project",
            "project_type": "CARBON",
            "organization_id": org_id,
        },
        headers=auth_headers,
    )
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Test Project"
    assert data["project_type"] == "CARBON"


def test_list_projects(client, auth_headers):
    org_id = _get_org_id(client, auth_headers)
    # Create one
    client.post(
        "/api/v1/projects",
        json={
            "name": "List Test Project",
            "project_type": "BIODIVERSITY",
            "organization_id": org_id,
        },
        headers=auth_headers,
    )

    res = client.get("/api/v1/projects", params={"org_id": org_id}, headers=auth_headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1


def test_get_project(client, auth_headers):
    org_id = _get_org_id(client, auth_headers)
    create_res = client.post(
        "/api/v1/projects",
        json={
            "name": "Get Test",
            "project_type": "RESTORATION",
            "organization_id": org_id,
        },
        headers=auth_headers,
    )
    pid = create_res.json()["id"]

    res = client.get(f"/api/v1/projects/{pid}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["id"] == pid


def test_update_project(client, auth_headers):
    org_id = _get_org_id(client, auth_headers)
    create_res = client.post(
        "/api/v1/projects",
        json={
            "name": "Update Test",
            "project_type": "CARBON",
            "organization_id": org_id,
        },
        headers=auth_headers,
    )
    pid = create_res.json()["id"]

    res = client.patch(
        f"/api/v1/projects/{pid}", json={"name": "Updated Name"}, headers=auth_headers
    )
    assert res.status_code == 200
    assert res.json()["name"] == "Updated Name"


def test_delete_project(client, auth_headers):
    org_id = _get_org_id(client, auth_headers)
    create_res = client.post(
        "/api/v1/projects",
        json={
            "name": "Delete Test",
            "project_type": "CARBON",
            "organization_id": org_id,
        },
        headers=auth_headers,
    )
    pid = create_res.json()["id"]

    res = client.delete(f"/api/v1/projects/{pid}", headers=auth_headers)
    assert res.status_code == 204

    res2 = client.get(f"/api/v1/projects/{pid}", headers=auth_headers)
    assert res2.status_code == 404
