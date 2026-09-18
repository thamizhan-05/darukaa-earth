from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.site import SiteStatus


class SiteCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    geometry: dict[str, Any]  # GeoJSON (Polygon or MultiPolygon)
    status: SiteStatus = SiteStatus.ACTIVE


class SiteUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    status: SiteStatus | None = None


class SiteOut(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    description: str | None
    geometry: dict[str, Any] | None = None
    area_hectares: float | None
    status: SiteStatus
    created_by: UUID | None
    created_at: datetime
    updated_at: datetime

    @field_validator("geometry", mode="before")
    @classmethod
    def convert_geometry(cls, v: Any) -> dict[str, Any] | None:
        if v is None:
            return None
        if isinstance(v, dict):
            return v
        try:
            from geoalchemy2.shape import to_shape
            from shapely.geometry import mapping

            return mapping(to_shape(v))
        except Exception:
            return None

    model_config = {"from_attributes": True}


class SiteGeoJSON(BaseModel):
    """Lightweight GeoJSON Feature for map endpoints."""

    type: str = "Feature"
    id: str
    geometry: dict[str, Any]
    properties: dict[str, Any]
