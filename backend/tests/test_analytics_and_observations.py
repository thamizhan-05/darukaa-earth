import uuid
from datetime import UTC, datetime, timedelta

import pytest

from app.core.security import create_access_token, hash_password
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember, Role
from app.models.project import Project, ProjectStatus, ProjectType
from app.models.site import Site, SiteStatus
from app.models.user import User


@pytest.fixture
def analytics_setup(db):
    # Create test user and org
    user = User(
        email=f"analyst_{uuid.uuid4().hex[:6]}@darukaa.earth",
        password_hash=hash_password("Pass123!"),
        full_name="Environmental Analyst",
        is_active=True,
    )
    db.add(user)
    db.flush()

    org = Organization(name="Analytics Corp", slug=f"analytics-{uuid.uuid4().hex[:6]}")
    db.add(org)
    db.flush()

    member = OrganizationMember(
        organization_id=org.id,
        user_id=user.id,
        role=Role.ANALYST,
    )
    db.add(member)

    # Create project and two sites
    proj = Project(
        organization_id=org.id,
        name="Western Ghats Corridor",
        project_type=ProjectType.RESTORATION,
        status=ProjectStatus.ACTIVE,
    )
    db.add(proj)
    db.flush()

    site1 = Site(
        project_id=proj.id,
        name="Zone A - Canopy Restoration",
        status=SiteStatus.ACTIVE,
        area_hectares=145.2,
    )
    site2 = Site(
        project_id=proj.id,
        name="Zone B - Riparian Buffer",
        status=SiteStatus.ACTIVE,
        area_hectares=89.5,
    )
    db.add_all([site1, site2])
    db.commit()

    token = create_access_token(subject=str(user.id))
    headers = {"Authorization": f"Bearer {token}"}

    return {
        "user": user,
        "org": org,
        "project": proj,
        "site1": site1,
        "site2": site2,
        "headers": headers,
    }


def test_create_observation_with_all_seven_metrics(client, analytics_setup):
    site_id = analytics_setup["site1"].id
    headers = analytics_setup["headers"]

    payload = {
        "observed_at": datetime.now(UTC).isoformat(),
        "source": "Demo / Synthetic Ground Truth Sensor Network",
        "source_reference": "SN-IND-042",
        "metrics": [
            {"metric_type": "CARBON_STOCK", "value": 124.5, "unit": "tCO₂e/ha"},
            {"metric_type": "CARBON_SEQUESTRATION", "value": 5.8, "unit": "tCO₂e/ha/yr"},
            {"metric_type": "BIODIVERSITY_INDEX", "value": 0.812, "unit": "index"},
            {"metric_type": "NDVI", "value": 0.745, "unit": "index"},
            {"metric_type": "TREE_DENSITY", "value": 310.0, "unit": "trees/ha"},
            {"metric_type": "SPECIES_COUNT", "value": 84.0, "unit": "species"},
            {"metric_type": "CANOPY_COVER", "value": 82.5, "unit": "%"},
        ],
    }

    res = client.post(f"/api/v1/sites/{site_id}/observations", json=payload, headers=headers)
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["source"] == "Demo / Synthetic Ground Truth Sensor Network"
    assert len(data["metrics"]) == 7

    mtypes = {m["metric_type"] for m in data["metrics"]}
    assert mtypes == {
        "CARBON_STOCK",
        "CARBON_SEQUESTRATION",
        "BIODIVERSITY_INDEX",
        "NDVI",
        "TREE_DENSITY",
        "SPECIES_COUNT",
        "CANOPY_COVER",
    }


def test_observation_validation_bounds(client, analytics_setup):
    site_id = analytics_setup["site1"].id
    headers = analytics_setup["headers"]

    # NDVI > 1.0 should fail
    payload_bad_ndvi = {
        "observed_at": datetime.now(UTC).isoformat(),
        "source": "Satellite Feed",
        "metrics": [{"metric_type": "NDVI", "value": 1.5}],
    }
    res = client.post(
        f"/api/v1/sites/{site_id}/observations", json=payload_bad_ndvi, headers=headers
    )
    assert res.status_code == 422

    # Canopy cover > 100% should fail
    payload_bad_canopy = {
        "observed_at": datetime.now(UTC).isoformat(),
        "source": "LiDAR",
        "metrics": [{"metric_type": "CANOPY_COVER", "value": 115.0}],
    }
    res = client.post(
        f"/api/v1/sites/{site_id}/observations", json=payload_bad_canopy, headers=headers
    )
    assert res.status_code == 422


def test_list_observations_with_time_range_and_filtering(client, analytics_setup):
    site_id = analytics_setup["site1"].id
    headers = analytics_setup["headers"]

    # Ingest 3 observations over time
    for i, days_ago in enumerate([40, 20, 5]):
        obs_payload = {
            "observed_at": (datetime.now(UTC) - timedelta(days=days_ago)).isoformat(),
            "source": f"Field Survey {i + 1}",
            "metrics": [
                {"metric_type": "CARBON_STOCK", "value": 100.0 + (i * 10)},
                {"metric_type": "NDVI", "value": 0.60 + (i * 0.05)},
            ],
        }
        r = client.post(f"/api/v1/sites/{site_id}/observations", json=obs_payload, headers=headers)
        assert r.status_code == 201

    # Filter with start_date (last 15 days only)
    start_date = (datetime.now(UTC) - timedelta(days=15)).isoformat()
    res = client.get(
        f"/api/v1/sites/{site_id}/observations",
        params={"start_date": start_date},
        headers=headers,
    )
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 1
    assert items[0]["source"] == "Field Survey 3"


def test_site_analytics_trends_and_synthetic_labeling(client, analytics_setup):
    site_id = analytics_setup["site1"].id
    headers = analytics_setup["headers"]

    # Seed 3 observation time-series points
    t0 = datetime.now(UTC) - timedelta(days=90)
    t1 = datetime.now(UTC) - timedelta(days=45)
    t2 = datetime.now(UTC) - timedelta(days=5)

    for t, stock, ndvi in [(t0, 100.0, 0.65), (t1, 110.0, 0.70), (t2, 125.0, 0.78)]:
        r = client.post(
            f"/api/v1/sites/{site_id}/observations",
            json={
                "observed_at": t.isoformat(),
                "source": "Synthetic Demo Multi-Spectral Feed",
                "metrics": [
                    {"metric_type": "CARBON_STOCK", "value": stock, "unit": "tCO₂e/ha"},
                    {"metric_type": "NDVI", "value": ndvi, "unit": "index"},
                ],
            },
            headers=headers,
        )
        assert r.status_code == 201

    res = client.get(f"/api/v1/sites/{site_id}/analytics", headers=headers)
    assert res.status_code == 200
    data = res.json()

    # Verify synthetic demo labeling
    assert data["is_synthetic"] is True
    assert "Synthetic Demo Dataset" in data["data_source_note"]

    # Verify metric summaries and trends
    cs = data["metrics"]["CARBON_STOCK"]
    assert cs["current"] == 125.0
    assert cs["previous"] == 110.0
    assert cs["change_pct"] > 0
    assert cs["trend_direction"] == "up"
    assert cs["min_value"] == 100.0
    assert cs["max_value"] == 125.0
    assert cs["avg_value"] == pytest.approx(111.6667, 0.01)

    # Verify time-series array
    assert len(data["time_series"]["CARBON_STOCK"]) == 3


def test_project_analytics_aggregation_and_site_breakdown(client, analytics_setup):
    proj_id = analytics_setup["project"].id
    site1_id = analytics_setup["site1"].id
    site2_id = analytics_setup["site2"].id
    headers = analytics_setup["headers"]

    now = datetime.now(UTC)
    r1 = client.post(
        f"/api/v1/sites/{site1_id}/observations",
        json={
            "observed_at": now.isoformat(),
            "source": "Demo Telemetry",
            "metrics": [{"metric_type": "CARBON_STOCK", "value": 120.0}],
        },
        headers=headers,
    )
    assert r1.status_code == 201

    r2 = client.post(
        f"/api/v1/sites/{site2_id}/observations",
        json={
            "observed_at": now.isoformat(),
            "source": "Demo Telemetry",
            "metrics": [{"metric_type": "CARBON_STOCK", "value": 80.0}],
        },
        headers=headers,
    )
    assert r2.status_code == 201

    res = client.get(f"/api/v1/projects/{proj_id}/analytics", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["site_count"] == 2
    assert data["total_area_hectares"] == pytest.approx(234.7, 0.1)

    # Aggregated Carbon Stock should average (120 + 80) / 2 = 100.0
    cs = data["metrics"]["CARBON_STOCK"]
    assert cs["current"] == 100.0

    # Verify site breakdown
    assert len(data["site_breakdown"]) == 2
    b_map = {item["site_name"]: item["metrics"]["CARBON_STOCK"] for item in data["site_breakdown"]}
    assert b_map["Zone A - Canopy Restoration"] == 120.0
    assert b_map["Zone B - Riparian Buffer"] == 80.0
