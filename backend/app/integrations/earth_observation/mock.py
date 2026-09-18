from __future__ import annotations

import random

from app.integrations.earth_observation.base import EarthObservationProvider, EOData


class MockEOProvider(EarthObservationProvider):
    async def get_earth_observation(self, lat: float, lon: float) -> EOData:
        seed = int(abs(lat * 77 + lon * 33))
        rnd = random.Random(seed)

        ndvi = round(min(0.92, max(0.40, 0.72 + rnd.uniform(-0.12, 0.12))), 3)
        canopy = round(min(95.0, max(30.0, 75.0 + rnd.uniform(-15.0, 15.0))), 1)

        # Fire risk calculation based on dryness
        fire_idx = round(max(5.0, min(95.0, (1.0 - ndvi) * 120.0 + rnd.uniform(-10.0, 10.0))), 1)
        if fire_idx > 70:
            risk_level = "HIGH"
        elif fire_idx > 40:
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"

        cloud_cover = round(rnd.uniform(2.0, 18.0), 1)

        return EOData(
            satellite_ndvi=ndvi,
            canopy_cover_pct=canopy,
            fire_risk_level=risk_level,
            fire_risk_index=fire_idx,
            cloud_cover_pct=cloud_cover,
            satellite_source="Copernicus Sentinel-2 L2A Multispectral (Simulated)",
            is_live=False,
        )
