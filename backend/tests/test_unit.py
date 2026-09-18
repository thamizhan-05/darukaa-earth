"""Unit tests for security, external providers, and domain logic."""

from __future__ import annotations

import uuid

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.integrations.earth_observation.mock import MockEOProvider
from app.integrations.weather.mock import MockWeatherProvider
from app.models.project import ProjectType
from app.schemas.project import ProjectCreate
from app.services.site_service import SiteService


def test_password_hashing():
    pw = "SecretEnvIntelligence2026!"
    hashed = hash_password(pw)
    assert hashed != pw
    assert verify_password(pw, hashed) is True
    assert verify_password("wrong-password", hashed) is False


def test_jwt_tokens():
    user_id = str(uuid.uuid4())
    access = create_access_token(user_id)
    refresh = create_refresh_token(user_id)

    decoded_access = decode_token(access)
    assert decoded_access["sub"] == user_id
    assert decoded_access["type"] == "access"

    decoded_refresh = decode_token(refresh)
    assert decoded_refresh["sub"] == user_id
    assert decoded_refresh["type"] == "refresh"


def test_mock_weather_provider():
    import asyncio

    provider = MockWeatherProvider()
    data = asyncio.run(provider.get_weather(lat=15.34, lon=74.12))
    assert 15.0 <= data.temperature_celsius <= 45.0
    assert 0.0 <= data.humidity_pct <= 100.0
    assert data.soil_moisture_pct >= 0.0
    assert data.condition != ""
    assert data.is_live is False


def test_mock_eo_provider():
    import asyncio

    provider = MockEOProvider()
    data = asyncio.run(provider.get_earth_observation(lat=15.34, lon=74.12))
    assert 0.0 <= data.satellite_ndvi <= 1.0
    assert 0.0 <= data.canopy_cover_pct <= 100.0
    assert data.fire_risk_level in ["LOW", "MODERATE", "HIGH", "EXTREME"]
    assert 0.0 <= data.fire_risk_index <= 100.0


def test_project_create_schema():
    org_id = uuid.uuid4()
    p = ProjectCreate(
        organization_id=org_id,
        name="Western Ghats Agroforestry",
        description="Agroforestry carbon sequestration project",
        project_type=ProjectType.CARBON_AND_BIODIVERSITY,
    )
    assert p.name == "Western Ghats Agroforestry"
    assert p.project_type == ProjectType.CARBON_AND_BIODIVERSITY


def test_geojson_to_wkb_normalization():
    # Polygon GeoJSON should be accepted and converted
    poly_geojson = {
        "type": "Polygon",
        "coordinates": [
            [
                [74.1, 15.3],
                [74.2, 15.3],
                [74.2, 15.4],
                [74.1, 15.4],
                [74.1, 15.3],
            ]
        ],
    }
    wkb = SiteService._geojson_to_wkb(poly_geojson)
    assert wkb is not None
