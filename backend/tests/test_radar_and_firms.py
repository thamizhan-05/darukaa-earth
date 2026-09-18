from __future__ import annotations

from unittest.mock import AsyncMock, patch

from app.integrations.alerts.firms import nasa_firms_client
from app.integrations.earth_observation.stac import copernicus_stac_client


def test_sar_search_endpoint(client, auth_headers):
    mock_sar_scenes = [
        {
            "scene_id": "S1D_IW_GRDH_TEST_001",
            "datetime": "2026-09-15T00:40:10Z",
            "instrument": "C-Band Synthetic Aperture Radar (SAR)",
            "platform": "Sentinel-1",
            "constellation": "Copernicus",
            "polarizations": ["VV", "VH"],
            "active_polarization": "VV",
            "cloud_penetration": "100% All-Weather",
            "orbit_state": "descending",
            "bbox": [76.4, 11.0, 76.6, 11.2],
            "tilejson_url": "https://planetarycomputer.microsoft.com/api/data/v1/item/tilejson.json?item=S1_TEST",
            "tile_url": "https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?item=S1_TEST",
            "ratio_tile_url": "https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?item=S1_TEST&ratio=true",
        }
    ]

    with patch.object(
        copernicus_stac_client, "search_sar_scenes", new=AsyncMock(return_value=mock_sar_scenes)
    ):
        res = client.post(
            "/api/v1/map/satellite/sar/search",
            json={
                "bbox": [76.4, 11.0, 76.6, 11.2],
                "polarization": "vv",
                "limit": 2,
            },
            headers=auth_headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["count"] == 1
        assert data["polarization"] == "VV"
        assert data["scenes"][0]["scene_id"] == "S1D_IW_GRDH_TEST_001"
        assert data["scenes"][0]["cloud_penetration"] == "100% All-Weather"


def test_site_sar_and_wildfire_endpoints(client, auth_headers):
    # 1. Create project & site
    orgs = client.get("/api/v1/organizations", headers=auth_headers).json()
    org_id = orgs[0]["id"]

    proj_res = client.post(
        "/api/v1/projects",
        json={
            "name": "SAR & Wildfire Test Project",
            "description": "Validation reserve",
            "project_type": "CONSERVATION",
            "organization_id": org_id,
        },
        headers=auth_headers,
    )
    assert proj_res.status_code == 201
    proj_id = proj_res.json()["id"]

    site_res = client.post(
        f"/api/v1/projects/{proj_id}/sites",
        json={
            "name": "Wildfire Alert Station",
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [76.40, 11.00],
                        [76.50, 11.00],
                        [76.50, 11.10],
                        [76.40, 11.10],
                        [76.40, 11.00],
                    ]
                ],
            },
        },
        headers=auth_headers,
    )
    assert site_res.status_code == 201
    site_id = site_res.json()["id"]

    # 2. Test Site SAR endpoint with mock
    mock_sar = {
        "scene_id": "S1D_SITE_SAR_001",
        "datetime": "2026-09-15T00:40:10Z",
        "instrument": "C-Band Synthetic Aperture Radar (SAR)",
        "platform": "Sentinel-1",
        "polarizations": ["VV", "VH"],
        "active_polarization": "VV",
        "tile_url": "https://planetarycomputer.microsoft.com/tiles/s1",
    }
    with patch.object(
        copernicus_stac_client,
        "get_latest_sar_scene_for_geometry",
        new=AsyncMock(return_value=mock_sar),
    ):
        sar_res = client.get(
            f"/api/v1/map/sites/{site_id}/sar?polarization=vv", headers=auth_headers
        )
        assert sar_res.status_code == 200
        assert sar_res.json()["scene"]["scene_id"] == "S1D_SITE_SAR_001"

    # 3. Test Site NASA FIRMS Wildfire endpoint
    mock_fires = [
        {
            "latitude": 11.02,
            "longitude": 76.45,
            "frp_mw": 14.5,
            "brightness_kelvin": 332.0,
            "acquisition_date": "2026-09-16",
            "acquisition_time": "0807",
            "sensor": "VIIRS 375m (Suomi-NPP)",
            "confidence": "nominal",
            "daynight": "D",
            "distance_km": 0.0,
            "threat_level": "CRITICAL_INSIDE_RESERVE",
            "is_inside_reserve": True,
        }
    ]
    with patch.object(
        nasa_firms_client, "get_fires_for_site", new=AsyncMock(return_value=mock_fires)
    ):
        fire_res = client.get(
            f"/api/v1/map/sites/{site_id}/wildfires?buffer_km=25", headers=auth_headers
        )
        assert fire_res.status_code == 200
        fire_data = fire_res.json()
        assert fire_data["threat_level"] == "CRITICAL"
        assert fire_data["active_fire_count"] == 1
        assert fire_data["fires_inside_reserve"] == 1
        assert fire_data["fires"][0]["frp_mw"] == 14.5


def test_viewport_wildfires_endpoint(client, auth_headers):
    mock_all_fires = [
        {
            "latitude": 11.02,
            "longitude": 76.45,
            "frp_mw": 8.2,
            "brightness_kelvin": 320.0,
            "acquisition_date": "2026-09-16",
            "acquisition_time": "0807",
            "sensor": "VIIRS 375m (Suomi-NPP)",
            "confidence": "nominal",
            "daynight": "D",
        }
    ]
    with patch.object(
        nasa_firms_client, "get_fires_in_bbox", new=AsyncMock(return_value=mock_all_fires)
    ):
        res = client.get("/api/v1/map/wildfires?bbox=76.0,10.5,77.0,11.5", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["count"] == 1
        assert data["fires"][0]["frp_mw"] == 8.2
