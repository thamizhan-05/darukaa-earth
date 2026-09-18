import contextlib

from app.integrations.earth_observation.base import EarthObservationProvider, EOData
from app.integrations.earth_observation.mock import MockEOProvider


class SentinelHubProvider(EarthObservationProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.fallback = MockEOProvider()

    async def get_earth_observation(self, lat: float, lon: float) -> EOData:
        # If external EO provider fails or rate-limits, degrade gracefully
        with contextlib.suppress(Exception):
            # Example Sentinel Hub / Copernicus statistical API endpoint hook
            pass

        return await self.fallback.get_earth_observation(lat, lon)
