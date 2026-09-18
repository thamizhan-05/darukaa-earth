from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import require_org_member
from app.models.observation import Observation
from app.models.observation_metric import MetricType, ObservationMetric
from app.models.organization_member import Role
from app.models.project import Project, ProjectStatus
from app.models.site import Site
from app.schemas.analytics import (
    DashboardKPIs,
    MetricSummary,
    ProjectAnalytics,
    SiteAnalytics,
    SiteComparisonItem,
    TimeSeriesPoint,
)


class AnalyticsService:
    def site_analytics(
        self,
        db: Session,
        site_id: UUID,
        user_id: UUID | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> SiteAnalytics:
        site = db.get(Site, site_id)
        if not site:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")

        if user_id is not None:
            project = db.get(Project, site.project_id)
            if not project:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
                )
            require_org_member(project.organization_id, user_id, db, min_role=Role.VIEWER)

        query = db.query(Observation).filter(Observation.site_id == site_id)
        if start_date:
            query = query.filter(Observation.observed_at >= start_date)
        if end_date:
            query = query.filter(Observation.observed_at <= end_date)

        observations = query.order_by(Observation.observed_at.asc()).all()

        # Build time series per metric type
        time_series: dict[str, list[TimeSeriesPoint]] = defaultdict(list)
        sources = set()
        for obs in observations:
            sources.add(obs.source)
            for metric in obs.metrics:
                time_series[metric.metric_type.value].append(
                    TimeSeriesPoint(date=obs.observed_at, value=round(float(metric.value), 4))
                )

        # Build metric summaries with trend calculations
        metrics: dict[str, MetricSummary] = {}
        for mtype, points in time_series.items():
            if not points:
                continue
            values = [p.value for p in points]
            current = values[-1]
            previous = values[-2] if len(values) >= 2 else None
            change_pct = (
                round(((current - previous) / previous) * 100, 2)
                if (previous is not None and previous != 0)
                else None
            )

            trend_direction = "flat"
            if change_pct is not None:
                if change_pct > 0.5:
                    trend_direction = "up"
                elif change_pct < -0.5:
                    trend_direction = "down"

            metrics[mtype] = MetricSummary(
                current=round(current, 4),
                previous=round(previous, 4) if previous is not None else None,
                change_pct=change_pct,
                unit=self._default_unit(mtype),
                trend_direction=trend_direction,
                min_value=round(min(values), 4),
                max_value=round(max(values), 4),
                avg_value=round(sum(values) / len(values), 4),
            )

        is_synthetic = (
            any("Demo" in s or "Synthetic" in s or "Simulation" in s for s in sources)
            if observations
            else False
        )

        return SiteAnalytics(
            site_id=site_id,
            site_name=site.name,
            area_hectares=float(site.area_hectares) if site.area_hectares else None,
            metrics=metrics,
            time_series=dict(time_series),
            observation_count=len(observations),
            is_synthetic=is_synthetic,
            data_source_note=(
                "Synthetic Demo Dataset — Calibrated for Hackathon Demonstration"
                if is_synthetic
                else "Verified Field & Satellite Remote Sensing Observations"
            ),
        )

    def project_analytics(
        self,
        db: Session,
        project_id: UUID,
        user_id: UUID | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> ProjectAnalytics:
        project = db.get(Project, project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

        if user_id is not None:
            require_org_member(project.organization_id, user_id, db, min_role=Role.VIEWER)

        sites = db.query(Site).filter(Site.project_id == project_id).all()
        site_ids = [s.id for s in sites]
        total_area = sum(float(s.area_hectares or 0) for s in sites)

        project_time_series: dict[str, list[TimeSeriesPoint]] = defaultdict(list)
        metrics: dict[str, MetricSummary] = {}
        site_breakdown: list[SiteComparisonItem] = []
        is_synthetic = True

        if site_ids:
            obs_query = db.query(Observation).filter(Observation.site_id.in_(site_ids))
            if start_date:
                obs_query = obs_query.filter(Observation.observed_at >= start_date)
            if end_date:
                obs_query = obs_query.filter(Observation.observed_at <= end_date)

            observations = obs_query.order_by(Observation.observed_at.asc()).all()

            # Group observation metric values by date (day resolution) for aggregated time series
            date_metric_map: dict[str, dict[datetime, list[float]]] = defaultdict(
                lambda: defaultdict(list)
            )
            site_latest_metrics: dict[UUID, dict[str, float]] = defaultdict(dict)
            site_latest_dates: dict[UUID, dict[str, datetime]] = defaultdict(dict)

            sources = set()
            for obs in observations:
                sources.add(obs.source)
                day = obs.observed_at
                for metric in obs.metrics:
                    mtype_val = metric.metric_type.value
                    mval = float(metric.value)
                    date_metric_map[mtype_val][day].append(mval)

                    # Track latest metric per site
                    prev_date = site_latest_dates[obs.site_id].get(mtype_val)
                    if prev_date is None or obs.observed_at >= prev_date:
                        site_latest_dates[obs.site_id][mtype_val] = obs.observed_at
                        site_latest_metrics[obs.site_id][mtype_val] = round(mval, 4)

            # Build project-wide time series (mean of all observed sites per date)
            for mtype_val, date_map in date_metric_map.items():
                sorted_dates = sorted(date_map.keys())
                points = [
                    TimeSeriesPoint(
                        date=d,
                        value=round(sum(date_map[d]) / len(date_map[d]), 4),
                    )
                    for d in sorted_dates
                ]
                project_time_series[mtype_val] = points

                if points:
                    vals = [p.value for p in points]
                    current = vals[-1]
                    previous = vals[-2] if len(vals) >= 2 else None
                    change_pct = (
                        round(((current - previous) / previous) * 100, 2)
                        if (previous is not None and previous != 0)
                        else None
                    )
                    trend_dir = "flat"
                    if change_pct is not None:
                        if change_pct > 0.5:
                            trend_dir = "up"
                        elif change_pct < -0.5:
                            trend_dir = "down"

                    metrics[mtype_val] = MetricSummary(
                        current=round(current, 4),
                        previous=round(previous, 4) if previous is not None else None,
                        change_pct=change_pct,
                        unit=self._default_unit(mtype_val),
                        trend_direction=trend_dir,
                        min_value=round(min(vals), 4),
                        max_value=round(max(vals), 4),
                        avg_value=round(sum(vals) / len(vals), 4),
                    )

            # Build site breakdown comparison
            for s in sites:
                site_breakdown.append(
                    SiteComparisonItem(
                        site_id=s.id,
                        site_name=s.name,
                        area_hectares=float(s.area_hectares) if s.area_hectares else None,
                        metrics=site_latest_metrics.get(s.id, {}),
                    )
                )

            is_synthetic = (
                any("Demo" in s or "Synthetic" in s or "Simulation" in s for s in sources)
                if observations
                else False
            )

        return ProjectAnalytics(
            project_id=project_id,
            project_name=project.name,
            site_count=len(sites),
            total_area_hectares=round(total_area, 2),
            metrics=metrics,
            time_series=dict(project_time_series),
            site_breakdown=site_breakdown,
            is_synthetic=is_synthetic,
            data_source_note=(
                "Synthetic Demo Dataset — Calibrated for Hackathon Demonstration"
                if is_synthetic
                else "Verified Project Field & Satellite Remote Sensing Observations"
            ),
        )

    def dashboard_kpis(
        self, db: Session, org_id: UUID, user_id: UUID | None = None
    ) -> DashboardKPIs:
        if user_id is not None:
            require_org_member(org_id, user_id, db, min_role=Role.VIEWER)

        projects = db.query(Project).filter(Project.organization_id == org_id).all()
        project_ids = [p.id for p in projects]

        total_projects = len(projects)
        active_projects = sum(1 for p in projects if p.status == ProjectStatus.ACTIVE)

        sites = db.query(Site).filter(Site.project_id.in_(project_ids)).all() if project_ids else []
        total_sites = len(sites)
        total_area = sum(float(s.area_hectares or 0) for s in sites)
        site_ids = [s.id for s in sites]

        def _avg_metric(metric_type: MetricType) -> float | None:
            if not site_ids:
                return None
            result = (
                db.query(func.avg(ObservationMetric.value))
                .join(Observation, Observation.id == ObservationMetric.observation_id)
                .filter(
                    Observation.site_id.in_(site_ids),
                    ObservationMetric.metric_type == metric_type,
                )
                .scalar()
            )
            return round(float(result), 4) if result else None

        return DashboardKPIs(
            total_projects=total_projects,
            active_projects=active_projects,
            total_sites=total_sites,
            total_area_hectares=round(total_area, 2),
            avg_carbon_stock=_avg_metric(MetricType.CARBON_STOCK),
            avg_biodiversity_index=_avg_metric(MetricType.BIODIVERSITY_INDEX),
        )

    @staticmethod
    def _default_unit(metric_type: str) -> str | None:
        units = {
            "CARBON_STOCK": "tCO₂e/ha",
            "CARBON_SEQUESTRATION": "tCO₂e/ha/yr",
            "BIODIVERSITY_INDEX": "index",
            "NDVI": "index",
            "TREE_DENSITY": "trees/ha",
            "SPECIES_COUNT": "species",
            "CANOPY_COVER": "%",
            "SOIL_CARBON": "tC/ha",
            "WATER_QUALITY": "index",
        }
        return units.get(metric_type)
