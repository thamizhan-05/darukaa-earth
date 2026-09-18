from __future__ import annotations

import csv
import io
import logging
import math
import time
from typing import Any

import httpx
from shapely.geometry import Point, shape

logger = logging.getLogger("darukaa.alerts.firms")

NASA_FIRMS_VIIRS_URL = "https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_South_Asia_24h.csv"
NASA_FIRMS_MODIS_URL = "https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/csv/MODIS_C6_1_South_Asia_24h.csv"


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great circle distance between two points in km."""
    radius_km = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(radius_km * c, 2)


class NASAFIRMSClient:
    """
    Client for NASA FIRMS (Fire Information for Resource Management System)
    providing real-time thermal anomaly and wildfire outbreak monitoring.
    """

    def __init__(self, cache_ttl_seconds: int = 600, timeout: float = 8.0):
        self.cache_ttl = cache_ttl_seconds
        self.timeout = timeout
        self._cached_fires: list[dict[str, Any]] = []
        self._last_fetch_time: float = 0.0

    async def fetch_active_fires(self, force_refresh: bool = False) -> list[dict[str, Any]]:
        """
        Fetch near-real-time thermal anomaly records from NASA FIRMS.
        Caches in-memory to prevent rate-limiting and ensure sub-second response times.
        """
        now = time.time()
        if (
            not force_refresh
            and self._cached_fires
            and (now - self._last_fetch_time < self.cache_ttl)
        ):
            return self._cached_fires

        fires: list[dict[str, Any]] = []
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(NASA_FIRMS_VIIRS_URL)
                if res.status_code == 200:
                    reader = csv.DictReader(io.StringIO(res.text))
                    for row in reader:
                        try:
                            lat = float(row.get("latitude", 0.0))
                            lon = float(row.get("longitude", 0.0))
                            frp = float(row.get("frp", 0.0) or 0.0)
                            bright = float(
                                row.get("bright_ti4", row.get("brightness", 300.0)) or 300.0
                            )
                            acq_date = row.get("acq_date", "")
                            acq_time = row.get("acq_time", "")
                            satellite = row.get("satellite", "N")
                            conf = row.get("confidence", "nominal")

                            fires.append(
                                {
                                    "latitude": lat,
                                    "longitude": lon,
                                    "frp_mw": round(frp, 1),
                                    "brightness_kelvin": round(bright, 1),
                                    "acquisition_date": acq_date,
                                    "acquisition_time": acq_time,
                                    "sensor": "VIIRS 375m (Suomi-NPP)"
                                    if satellite == "N"
                                    else "MODIS 1km",
                                    "confidence": conf,
                                    "daynight": row.get("daynight", "D"),
                                }
                            )
                        except (ValueError, TypeError):
                            continue

                    self._cached_fires = fires
                    self._last_fetch_time = now
                    logger.info(f"Loaded {len(fires)} active thermal anomalies from NASA FIRMS")
                    return fires
        except Exception as e:
            logger.warning(f"Failed to fetch live NASA FIRMS feed: {e}")

        # Return cached if available, else empty
        return self._cached_fires

    async def get_fires_for_site(
        self,
        site_geometry: dict[str, Any],
        buffer_km: float = 25.0,
    ) -> list[dict[str, Any]]:
        """
        Filter active fires intersecting or within `buffer_km` radius of a site polygon.
        Calculates distance from fire point to polygon boundary and threat level.
        """
        all_fires = await self.fetch_active_fires()
        if not all_fires:
            return []

        try:
            poly = shape(site_geometry)
            bounds = poly.bounds  # (minx, miny, maxx, maxy)

            # Degree approximation for coarse spatial index filtering (~1 deg = 111 km)
            deg_buf = (buffer_km + 5.0) / 111.0
            min_lon, min_lat = bounds[0] - deg_buf, bounds[1] - deg_buf
            max_lon, max_lat = bounds[2] + deg_buf, bounds[3] + deg_buf

            results: list[dict[str, Any]] = []
            centroid_lat, centroid_lon = poly.centroid.y, poly.centroid.x

            for f in all_fires:
                lat, lon = f["latitude"], f["longitude"]
                if not (min_lon <= lon <= max_lon and min_lat <= lat <= max_lat):
                    continue

                pt = Point(lon, lat)
                inside = poly.contains(pt)

                # Distance calculation
                if inside:
                    dist_km = 0.0
                    threat = "CRITICAL_INSIDE_RESERVE"
                else:
                    dist_km = haversine_km(lat, lon, centroid_lat, centroid_lon)
                    if dist_km <= 5.0:
                        threat = "HIGH_PROXIMITY"
                    elif dist_km <= 15.0:
                        threat = "MODERATE_PROXIMITY"
                    elif dist_km <= buffer_km:
                        threat = "ADVISORY"
                    else:
                        continue

                results.append(
                    {
                        **f,
                        "distance_km": dist_km,
                        "threat_level": threat,
                        "is_inside_reserve": inside,
                    }
                )

            # Sort by distance
            results.sort(key=lambda x: x["distance_km"])
            return results
        except Exception as e:
            logger.error(f"Error filtering fires for site geometry: {e}")
            return []

    async def get_fires_in_bbox(
        self,
        bbox: list[float],
    ) -> list[dict[str, Any]]:
        """
        Filter active fires within viewport bbox [min_lon, min_lat, max_lon, max_lat].
        """
        all_fires = await self.fetch_active_fires()
        if not all_fires or len(bbox) != 4:
            return []

        min_lon, min_lat, max_lon, max_lat = bbox
        results = []
        for f in all_fires:
            lat, lon = f["latitude"], f["longitude"]
            if min_lon <= lon <= max_lon and min_lat <= lat <= max_lat:
                results.append(f)

        return results


nasa_firms_client = NASAFIRMSClient()
