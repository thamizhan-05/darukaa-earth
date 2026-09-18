from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from geoalchemy2.shape import to_shape
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import CurrentUser
from app.integrations.earth_observation import EOData, get_eo_provider
from app.integrations.weather import WeatherData, get_weather_provider
from app.models.site import Site

router = APIRouter(tags=["Environmental Telemetry"])


class EnvironmentalContextOut(BaseModel):
    site_id: UUID
    latitude: float
    longitude: float
    weather: WeatherData
    earth_observation: EOData


@router.get("/sites/{site_id}/environmental-context", response_model=EnvironmentalContextOut)
async def get_environmental_context(
    site_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """
    Fetch real-time microclimate weather and satellite earth observation telemetry
    for the geographical centroid of a site. Employs graceful fallback if external
    providers fail or are not configured.
    """
    site = db.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")

    from app.core.dependencies import require_org_member
    from app.models.organization_member import Role
    from app.models.project import Project

    project = db.get(Project, site.project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    require_org_member(project.organization_id, current_user, db, min_role=Role.VIEWER)

    lat = 15.34
    lon = 74.12
    if site.geometry is not None:
        try:
            shp = to_shape(site.geometry)
            centroid = shp.centroid
            lon = round(float(centroid.x), 5)
            lat = round(float(centroid.y), 5)
        except Exception:
            pass

    weather_provider = get_weather_provider()
    eo_provider = get_eo_provider()

    weather = await weather_provider.get_weather(lat, lon)
    eo = await eo_provider.get_earth_observation(lat, lon)

    return EnvironmentalContextOut(
        site_id=site_id,
        latitude=lat,
        longitude=lon,
        weather=weather,
        earth_observation=eo,
    )
