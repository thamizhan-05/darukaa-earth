from __future__ import annotations

from app.core.config import get_settings
from app.integrations.earth_observation.base import EarthObservationProvider, EOData
from app.integrations.earth_observation.copernicus import CopernicusEOProvider
from app.integrations.earth_observation.mock import MockEOProvider
from app.integrations.earth_observation.sentinel import SentinelHubProvider


def get_eo_provider() -> EarthObservationProvider:
    settings = get_settings()
    if settings.EARTH_OBSERVATION_API_KEY:
        return SentinelHubProvider(api_key=settings.EARTH_OBSERVATION_API_KEY)
    return CopernicusEOProvider()


__all__ = [
    "EarthObservationProvider",
    "EOData",
    "CopernicusEOProvider",
    "MockEOProvider",
    "SentinelHubProvider",
    "get_eo_provider",
]
