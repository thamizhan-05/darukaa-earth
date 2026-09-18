from __future__ import annotations

import logging
from typing import Any

import httpx

logger = logging.getLogger("darukaa.eo.stac")

PLANETARY_COMPUTER_STAC_URL = "https://planetarycomputer.microsoft.com/api/stac/v1/search"
PLANETARY_COMPUTER_DATA_URL = "https://planetarycomputer.microsoft.com/api/data/v1"


class CopernicusSTACClient:
    """
    Client for querying Copernicus Sentinel-2 L2A satellite scenes via
    the Microsoft Planetary Computer STAC and dynamic COG Tile APIs.
    """

    def __init__(self, timeout: float = 12.0):
        self.timeout = timeout

    async def search_scenes(
        self,
        bbox: list[float],
        max_cloud_cover: float = 25.0,
        limit: int = 5,
        datetime_range: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Search for cloud-filtered Sentinel-2 L2A scenes covering the given bbox.
        bbox format: [min_lon, min_lat, max_lon, max_lat]
        """
        body: dict[str, Any] = {
            "collections": ["sentinel-2-l2a"],
            "bbox": bbox,
            "query": {"eo:cloud_cover": {"lt": max_cloud_cover}},
            "sortby": [{"field": "properties.datetime", "direction": "desc"}],
            "limit": limit,
        }
        if datetime_range:
            body["datetime"] = datetime_range

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(PLANETARY_COMPUTER_STAC_URL, json=body)
                if res.status_code == 200:
                    data = res.json()
                    features = data.get("features", [])
                    results = []
                    for feat in features:
                        scene_id = feat.get("id")
                        props = feat.get("properties", {})
                        assets = feat.get("assets", {})

                        # Extract preview thumbnail if available
                        thumb = assets.get("rendered_preview", {}).get("href") or assets.get(
                            "thumbnail", {}
                        ).get("href")

                        # Generate TileJSON URL for dynamic Mapbox GL JS raster layer
                        tilejson_url = (
                            f"{PLANETARY_COMPUTER_DATA_URL}/item/tilejson.json"
                            f"?collection=sentinel-2-l2a&item={scene_id}&assets=visual"
                        )

                        # Generate direct XYZ raster tile template
                        tile_url = (
                            f"{PLANETARY_COMPUTER_DATA_URL}/item/tiles/WebMercatorQuad/{{z}}/{{x}}/{{y}}@1x"
                            f"?collection=sentinel-2-l2a&item={scene_id}&assets=visual"
                        )

                        # Generate NDVI color-ramped tile template (NIR B08 + Red B04)
                        ndvi_tile_url = (
                            f"{PLANETARY_COMPUTER_DATA_URL}/item/tiles/WebMercatorQuad/{{z}}/{{x}}/{{y}}@1x"
                            f"?collection=sentinel-2-l2a&item={scene_id}"
                            f"&assets=B08&assets=B04&expression=(asset:B08-asset:B04)/(asset:B08+asset:B04)&colormap_name=viridis"
                        )

                        results.append(
                            {
                                "scene_id": scene_id,
                                "datetime": props.get("datetime"),
                                "cloud_cover_pct": round(
                                    float(props.get("eo:cloud_cover", 0.0)), 1
                                ),
                                "platform": props.get("platform", "Sentinel-2"),
                                "constellation": props.get("constellation", "Copernicus"),
                                "bbox": feat.get("bbox", bbox),
                                "tilejson_url": tilejson_url,
                                "tile_url": tile_url,
                                "ndvi_tile_url": ndvi_tile_url,
                                "thumbnail_url": thumb,
                            }
                        )
                    return results
                else:
                    logger.warning(
                        f"Planetary Computer STAC returned {res.status_code}: {res.text}"
                    )
        except Exception as e:
            logger.error(f"Error querying STAC API for bbox {bbox}: {e}", exc_info=True)

        return []

    async def get_latest_scene_for_geometry(
        self,
        geojson_geometry: dict[str, Any],
        max_cloud_cover: float = 30.0,
    ) -> dict[str, Any] | None:
        """
        Extract bounding box from polygon geometry and retrieve the freshest cloud-free scene.
        """
        bbox = self._extract_bbox(geojson_geometry)
        if not bbox:
            return None

        scenes = await self.search_scenes(bbox=bbox, max_cloud_cover=max_cloud_cover, limit=3)
        if scenes:
            return scenes[0]

        # If strict cloud cover returned nothing, relax to 60%
        relaxed = await self.search_scenes(bbox=bbox, max_cloud_cover=60.0, limit=1)
        return relaxed[0] if relaxed else None

    async def search_sar_scenes(
        self,
        bbox: list[float],
        limit: int = 5,
        polarization: str = "vv",
    ) -> list[dict[str, Any]]:
        """
        Search for all-weather Copernicus Sentinel-1 C-Band Synthetic Aperture Radar (SAR)
        scenes covering the given bbox. Penetrates monsoon cloud cover and smoke.
        """
        body: dict[str, Any] = {
            "collections": ["sentinel-1-grd"],
            "bbox": bbox,
            "sortby": [{"field": "properties.datetime", "direction": "desc"}],
            "limit": limit,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(PLANETARY_COMPUTER_STAC_URL, json=body)
                if res.status_code == 200:
                    data = res.json()
                    features = data.get("features", [])
                    results = []
                    for feat in features:
                        scene_id = feat.get("id")
                        props = feat.get("properties", {})
                        assets = feat.get("assets", {})
                        pols = props.get("sar:polarizations", ["VV", "VH"])

                        active_asset = (
                            polarization.lower() if polarization.lower() in ["vv", "vh"] else "vv"
                        )

                        # TileJSON for SAR backscatter
                        tilejson_url = (
                            f"{PLANETARY_COMPUTER_DATA_URL}/item/tilejson.json"
                            f"?collection=sentinel-1-grd&item={scene_id}&assets={active_asset}&colormap_name=greys"
                        )

                        # Direct XYZ raster tile template for radar amplitude/backscatter
                        tile_url = (
                            f"{PLANETARY_COMPUTER_DATA_URL}/item/tiles/WebMercatorQuad/{{z}}/{{x}}/{{y}}@1x"
                            f"?collection=sentinel-1-grd&item={scene_id}&assets={active_asset}&colormap_name=greys"
                        )

                        # Dual-polarization ratio for canopy volume scattering and biomass structure
                        ratio_tile_url = (
                            f"{PLANETARY_COMPUTER_DATA_URL}/item/tiles/WebMercatorQuad/{{z}}/{{x}}/{{y}}@1x"
                            f"?collection=sentinel-1-grd&item={scene_id}&assets=vv&assets=vh"
                            f"&expression=(asset:vv-asset:vh)/(asset:vv+asset:vh)&colormap_name=magma"
                        )

                        results.append(
                            {
                                "scene_id": scene_id,
                                "datetime": props.get("datetime"),
                                "instrument": "C-Band Synthetic Aperture Radar (SAR)",
                                "platform": props.get("platform", "Sentinel-1"),
                                "constellation": "Copernicus",
                                "polarizations": pols,
                                "active_polarization": active_asset.upper(),
                                "cloud_penetration": "100% All-Weather",
                                "orbit_state": props.get("sat:orbit_state", "descending"),
                                "bbox": feat.get("bbox", bbox),
                                "tilejson_url": tilejson_url,
                                "tile_url": tile_url,
                                "ratio_tile_url": ratio_tile_url,
                                "thumbnail_url": assets.get("rendered_preview", {}).get("href")
                                or assets.get("thumbnail", {}).get("href"),
                            }
                        )
                    return results
        except Exception as e:
            logger.error(f"Error querying Sentinel-1 SAR STAC API: {e}", exc_info=True)

        return []

    async def get_latest_sar_scene_for_geometry(
        self,
        geojson_geometry: dict[str, Any],
        polarization: str = "vv",
    ) -> dict[str, Any] | None:
        """
        Retrieve freshest Sentinel-1 SAR scene for given polygon geometry.
        """
        bbox = self._extract_bbox(geojson_geometry)
        if not bbox:
            return None
        scenes = await self.search_sar_scenes(bbox=bbox, limit=2, polarization=polarization)
        return scenes[0] if scenes else None

    @staticmethod
    def _extract_bbox(geometry: dict[str, Any]) -> list[float] | None:
        try:
            from shapely.geometry import shape

            shp = shape(geometry)
            bounds = shp.bounds  # (minx, miny, maxx, maxy)
            return [bounds[0], bounds[1], bounds[2], bounds[3]]
        except Exception as e:
            logger.warning(f"Failed to extract bbox from geometry: {e}")
            return None


copernicus_stac_client = CopernicusSTACClient()
