from __future__ import annotations

from abc import ABC, abstractmethod

from pydantic import BaseModel


class EOData(BaseModel):
    satellite_ndvi: float
    canopy_cover_pct: float
    fire_risk_level: str  # LOW, MODERATE, HIGH, EXTREME
    fire_risk_index: float  # 0 - 100
    cloud_cover_pct: float
    satellite_source: str
    is_live: bool


class EarthObservationProvider(ABC):
    @abstractmethod
    async def get_earth_observation(self, lat: float, lon: float) -> EOData:
        """Fetch earth observation telemetry for geographic coordinates."""
        pass
