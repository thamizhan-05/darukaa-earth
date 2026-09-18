from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import CurrentUser
from app.integrations.alerts.firms import nasa_firms_client
from app.integrations.earth_observation.stac import copernicus_stac_client
from app.schemas.site import SiteGeoJSON
from app.services.site_service import SiteService

logger = logging.getLogger("darukaa.map")
router = APIRouter(prefix="/map", tags=["Map"])
_service = SiteService()


class SatelliteSearchRequest(BaseModel):
    geometry: dict[str, Any] | None = Field(
        None,
        description="GeoJSON Polygon or MultiPolygon geometry",
    )
    bbox: list[float] | None = Field(
        None,
        description="[min_lon, min_lat, max_lon, max_lat] bounding box",
    )
    max_cloud_cover: float = Field(25.0, ge=0.0, le=100.0)
    limit: int = Field(5, ge=1, le=20)


class SARSearchRequest(BaseModel):
    geometry: dict[str, Any] | None = Field(
        None,
        description="GeoJSON Polygon or MultiPolygon geometry",
    )
    bbox: list[float] | None = Field(
        None,
        description="[min_lon, min_lat, max_lon, max_lat] bounding box",
    )
    polarization: str = Field("vv", description="Polarization channel: 'vv' or 'vh'")
    limit: int = Field(5, ge=1, le=20)


@router.get("/sites", response_model=list[SiteGeoJSON])
def map_sites(
    org_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    bbox: str | None = Query(
        None,
        description="Bounding box filter: lon_min,lat_min,lon_max,lat_max",
    ),
):
    """
    Return GeoJSON features for all org sites, optionally filtered by
    viewport bounding box. Uses PostGIS ST_Intersects for spatial filtering.
    """
    return _service.get_map_features(db, org_id, current_user.id, bbox)


# ── Sentinel-2 Optical STAC ──────────────────────────────────────────────────


@router.post("/satellite/search")
async def search_satellite_scenes(
    data: SatelliteSearchRequest,
    current_user: CurrentUser,
):
    """
    Query Copernicus Sentinel-2 L2A satellite scenes via Microsoft Planetary Computer STAC
    for the provided polygon geometry or bounding box.
    """
    bbox = data.bbox
    if not bbox and data.geometry:
        bbox = copernicus_stac_client._extract_bbox(data.geometry)

    if not bbox or len(bbox) != 4:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Must provide valid geometry or [min_lon, min_lat, max_lon, max_lat] bbox",
        )

    scenes = await copernicus_stac_client.search_scenes(
        bbox=bbox,
        max_cloud_cover=data.max_cloud_cover,
        limit=data.limit,
    )
    return {
        "count": len(scenes),
        "bbox": bbox,
        "scenes": scenes,
    }


@router.get("/sites/{site_id}/satellite")
async def get_site_satellite_scene(
    site_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    max_cloud_cover: float = Query(30.0, ge=0.0, le=100.0),
):
    """
    Fetch the latest cloud-filtered Copernicus Sentinel-2 scene and dynamic
    tile stream URL intersecting this specific conservation site.
    """
    site = _service.get(db, site_id, current_user.id)
    if not site.geometry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site has no spatial boundary geometry",
        )

    scene = await copernicus_stac_client.get_latest_scene_for_geometry(
        site.geometry,
        max_cloud_cover=max_cloud_cover,
    )
    if not scene:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No cloud-free Sentinel-2 scene found for site coordinates",
        )

    return {
        "site_id": str(site_id),
        "site_name": site.name,
        "scene": scene,
    }


# ── Sentinel-1 SAR (Radar) ───────────────────────────────────────────────────


@router.post("/satellite/sar/search")
async def search_sar_scenes(
    data: SARSearchRequest,
    current_user: CurrentUser,
):
    """
    Query all-weather Copernicus Sentinel-1 C-Band Synthetic Aperture Radar (SAR)
    scenes from Microsoft Planetary Computer STAC. Penetrates cloud cover & smoke.
    """
    bbox = data.bbox
    if not bbox and data.geometry:
        bbox = copernicus_stac_client._extract_bbox(data.geometry)

    if not bbox or len(bbox) != 4:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Must provide valid geometry or [min_lon, min_lat, max_lon, max_lat] bbox",
        )

    scenes = await copernicus_stac_client.search_sar_scenes(
        bbox=bbox,
        limit=data.limit,
        polarization=data.polarization,
    )
    return {
        "count": len(scenes),
        "bbox": bbox,
        "polarization": data.polarization.upper(),
        "scenes": scenes,
    }


@router.get("/sites/{site_id}/sar")
async def get_site_sar_scene(
    site_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    polarization: str = Query("vv", description="Polarization channel: 'vv' or 'vh'"),
):
    """
    Fetch the latest all-weather Sentinel-1 SAR radar scene and dynamic
    backscatter tile URL intersecting this conservation site.
    """
    site = _service.get(db, site_id, current_user.id)
    if not site.geometry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site has no spatial boundary geometry",
        )

    scene = await copernicus_stac_client.get_latest_sar_scene_for_geometry(
        site.geometry,
        polarization=polarization,
    )
    if not scene:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Sentinel-1 SAR radar scene found for site coordinates",
        )

    return {
        "site_id": str(site_id),
        "site_name": site.name,
        "scene": scene,
    }


# ── NASA FIRMS Active Wildfire Alerts ────────────────────────────────────────


@router.get("/sites/{site_id}/wildfires")
async def get_site_wildfires(
    site_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    buffer_km: float = Query(25.0, ge=1.0, le=100.0, description="Proximity search radius in km"),
):
    """
    Retrieve live NASA FIRMS (VIIRS/MODIS) thermal anomalies intersecting
    or within `buffer_km` radius of the site boundary.
    """
    site = _service.get(db, site_id, current_user.id)
    if not site.geometry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site has no spatial boundary geometry",
        )

    fires = await nasa_firms_client.get_fires_for_site(site.geometry, buffer_km=buffer_km)

    inside_count = sum(1 for f in fires if f.get("is_inside_reserve"))
    highest_threat = "NONE"
    if inside_count > 0:
        highest_threat = "CRITICAL"
    elif any(f.get("threat_level") == "HIGH_PROXIMITY" for f in fires):
        highest_threat = "HIGH"
    elif any(f.get("threat_level") == "MODERATE_PROXIMITY" for f in fires):
        highest_threat = "MODERATE"
    elif len(fires) > 0:
        highest_threat = "ADVISORY"

    return {
        "site_id": str(site_id),
        "site_name": site.name,
        "threat_level": highest_threat,
        "active_fire_count": len(fires),
        "fires_inside_reserve": inside_count,
        "buffer_km": buffer_km,
        "fires": fires,
    }


@router.get("/wildfires")
async def get_viewport_wildfires(
    current_user: CurrentUser,
    bbox: str | None = Query(
        None,
        description="Bounding box filter: lon_min,lat_min,lon_max,lat_max",
    ),
):
    """
    Retrieve live NASA FIRMS thermal anomalies for the entire viewport bounding box.
    """
    if bbox:
        try:
            parts = [float(x) for x in bbox.split(",")]
            if len(parts) == 4:
                fires = await nasa_firms_client.get_fires_in_bbox(parts)
                return {
                    "count": len(fires),
                    "bbox": parts,
                    "fires": fires,
                }
        except Exception:
            pass

    all_fires = await nasa_firms_client.fetch_active_fires()
    return {
        "count": len(all_fires),
        "fires": all_fires[:150],  # Return top 150 regional anomalies
    }
