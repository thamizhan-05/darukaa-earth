from __future__ import annotations

import math
from unittest.mock import AsyncMock, patch

from app.integrations.earth_observation.stac import copernicus_stac_client


def test_tilejson_endpoint(client, auth_headers):
    # Fetch org
    orgs = client.get("/api/v1/organizations", headers=auth_headers).json()
    org_id = orgs[0]["id"]

    res = client.get(f"/api/v1/tiles/{org_id}/tilejson.json", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["tilejson"] == "2.2.0"
    assert f"darukaa-sites-{org_id}" == data["name"]
    assert "vector_layers" in data
    assert data["vector_layers"][0]["id"] == "sites"


def test_vector_tile_pbf_generation(client, auth_headers):
    # Create project and site
    orgs = client.get("/api/v1/organizations", headers=auth_headers).json()
    org_id = orgs[0]["id"]

    proj_res = client.post(
        "/api/v1/projects",
        json={
            "name": "Tile Test Project",
            "description": "Project for vector tile testing",
            "project_type": "CONSERVATION",
            "organization_id": org_id,
        },
        headers=auth_headers,
    )
    assert proj_res.status_code == 201
    proj_id = proj_res.json()["id"]

    # Create site with polygon around (76.5, 11.1)
    site_res = client.post(
        f"/api/v1/projects/{proj_id}/sites",
        json={
            "name": "Vector Tile Reserve",
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [76.45, 11.05],
                        [76.55, 11.05],
                        [76.55, 11.15],
                        [76.45, 11.15],
                        [76.45, 11.05],
                    ]
                ],
            },
        },
        headers=auth_headers,
    )
    assert site_res.status_code == 201

    # Tile coordinate at zoom 10 covering (76.5, 11.1)
    z = 10
    lat_rad = math.radians(11.1)
    n = 2.0**z
    xtile = int((76.5 + 180.0) / 360.0 * n)
    ytile = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)

    # Request vector tile
    pbf_res = client.get(
        f"/api/v1/tiles/{org_id}/{z}/{xtile}/{ytile}.pbf",
        headers=auth_headers,
    )
    assert pbf_res.status_code == 200
    assert pbf_res.headers["content-type"] == "application/vnd.mapbox-vector-tile"
    assert len(pbf_res.content) > 0


def test_satellite_search_endpoint(client, auth_headers):
    # Mock STAC response to guarantee fast deterministic test without external network reliance
    mock_scenes = [
        {
            "scene_id": "S2B_MSIL2A_TEST_001",
            "datetime": "2026-09-09T05:06:49Z",
            "cloud_cover_pct": 12.4,
            "platform": "Sentinel-2B",
            "constellation": "Copernicus",
            "bbox": [76.4, 11.0, 76.6, 11.2],
            "tilejson_url": "https://planetarycomputer.microsoft.com/api/data/v1/item/tilejson.json?item=S2B_TEST",
            "tile_url": "https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?item=S2B_TEST",
            "ndvi_tile_url": "https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?item=S2B_TEST&ndvi=true",
            "thumbnail_url": "https://planetarycomputer.microsoft.com/thumb.jpg",
        }
    ]

    with patch.object(
        copernicus_stac_client, "search_scenes", new=AsyncMock(return_value=mock_scenes)
    ):
        res = client.post(
            "/api/v1/map/satellite/search",
            json={
                "bbox": [76.4, 11.0, 76.6, 11.2],
                "max_cloud_cover": 25.0,
                "limit": 3,
            },
            headers=auth_headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["count"] == 1
        assert data["scenes"][0]["scene_id"] == "S2B_MSIL2A_TEST_001"
        assert data["scenes"][0]["cloud_cover_pct"] == 12.4
