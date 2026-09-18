from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class MetricSummary(BaseModel):
    current: float | None = None
    previous: float | None = None
    change_pct: float | None = None
    unit: str | None = None
    trend_direction: str | None = None  # "up" | "down" | "flat"
    min_value: float | None = None
    max_value: float | None = None
    avg_value: float | None = None


class TimeSeriesPoint(BaseModel):
    date: datetime
    value: float


class SiteComparisonItem(BaseModel):
    site_id: UUID
    site_name: str
    area_hectares: float | None = None
    metrics: dict[str, float | None] = {}


class SiteAnalytics(BaseModel):
    site_id: UUID
    site_name: str
    area_hectares: float | None = None
    metrics: dict[str, MetricSummary]
    time_series: dict[str, list[TimeSeriesPoint]]
    observation_count: int
    is_synthetic: bool = True
    data_source_note: str = "Synthetic Demo Dataset — Calibrated for Hackathon Demonstration"


class ProjectAnalytics(BaseModel):
    project_id: UUID
    project_name: str
    site_count: int
    total_area_hectares: float
    metrics: dict[str, MetricSummary]
    time_series: dict[str, list[TimeSeriesPoint]] = {}
    site_breakdown: list[SiteComparisonItem] = []
    is_synthetic: bool = True
    data_source_note: str = "Synthetic Demo Dataset — Calibrated for Hackathon Demonstration"


class DashboardKPIs(BaseModel):
    total_projects: int
    active_projects: int
    total_sites: int
    total_area_hectares: float
    avg_carbon_stock: float | None = None
    avg_biodiversity_index: float | None = None
