from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.observation_metric import MetricType


class MetricIn(BaseModel):
    metric_type: MetricType
    value: float
    unit: str | None = None

    @field_validator("value")
    @classmethod
    def validate_metric_value(cls, v: float, info) -> float:
        mtype = info.data.get("metric_type")
        if mtype == MetricType.NDVI and not (-1.0 <= v <= 1.0):
            raise ValueError("NDVI value must be between -1.0 and 1.0")
        if mtype == MetricType.BIODIVERSITY_INDEX and not (0.0 <= v <= 1.0):
            raise ValueError("Biodiversity Index must be between 0.0 and 1.0")
        if mtype == MetricType.CANOPY_COVER and not (0.0 <= v <= 100.0):
            raise ValueError("Canopy Cover percentage must be between 0.0 and 100.0")
        if (
            mtype
            in (
                MetricType.CARBON_STOCK,
                MetricType.CARBON_SEQUESTRATION,
                MetricType.TREE_DENSITY,
                MetricType.SPECIES_COUNT,
            )
            and v < 0
        ):
            raise ValueError(f"{mtype.value} cannot be negative")
        return v


class ObservationCreate(BaseModel):
    observed_at: datetime
    source: str = Field(..., min_length=2, max_length=255)
    source_reference: str | None = Field(None, max_length=500)
    metrics: list[MetricIn] = Field(default_factory=list)


class MetricOut(BaseModel):
    id: UUID
    metric_type: MetricType
    value: float
    unit: str | None

    model_config = {"from_attributes": True}


class ObservationOut(BaseModel):
    id: UUID
    site_id: UUID
    observed_at: datetime
    source: str
    source_reference: str | None
    created_at: datetime
    metrics: list[MetricOut] = []

    model_config = {"from_attributes": True}


class ObservationListResponse(BaseModel):
    items: list[ObservationOut]
    total: int
    skip: int
    limit: int
