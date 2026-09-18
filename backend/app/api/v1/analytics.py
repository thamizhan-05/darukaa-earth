from __future__ import annotations

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import CurrentUser
from app.schemas.analytics import DashboardKPIs, ProjectAnalytics, SiteAnalytics
from app.services.analytics_service import AnalyticsService

router = APIRouter(tags=["Analytics"])
_service = AnalyticsService()


@router.get("/sites/{site_id}/analytics", response_model=SiteAnalytics)
def site_analytics(
    site_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    start_date: datetime | None = None,
    end_date: datetime | None = None,
):
    """Full analytics for a site: time-series, metric summaries, and statistical trends."""
    return _service.site_analytics(
        db,
        site_id,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/projects/{project_id}/analytics", response_model=ProjectAnalytics)
def project_analytics(
    project_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    start_date: datetime | None = None,
    end_date: datetime | None = None,
):
    """Aggregated analytics across all sites in a project with time-series and site breakdown."""
    return _service.project_analytics(
        db,
        project_id,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/dashboard/kpis", response_model=DashboardKPIs)
def dashboard_kpis(
    org_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Dashboard KPI cards for an organization."""
    return _service.dashboard_kpis(db, org_id, user_id=current_user.id)
