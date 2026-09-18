from __future__ import annotations

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.audit import log_audit
from app.core.database import get_db
from app.core.dependencies import CurrentUser, require_org_member
from app.models.observation import Observation
from app.models.observation_metric import MetricType, ObservationMetric
from app.models.organization_member import Role
from app.models.project import Project
from app.models.site import Site
from app.schemas.observation import ObservationCreate, ObservationOut

router = APIRouter(tags=["Observations"])


@router.get("/sites/{site_id}/observations", response_model=list[ObservationOut])
def list_observations(
    site_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    metric_type: MetricType | None = None,
    source: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """List observations for a site with date filtering and metric filtering (requires VIEWER)."""
    site = db.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")
    proj = db.get(Project, site.project_id)
    if not proj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    require_org_member(proj.organization_id, current_user, db, min_role=Role.VIEWER)

    query = db.query(Observation).filter(Observation.site_id == site_id)

    if start_date:
        query = query.filter(Observation.observed_at >= start_date)
    if end_date:
        query = query.filter(Observation.observed_at <= end_date)
    if source:
        query = query.filter(Observation.source.ilike(f"%{source}%"))
    if metric_type:
        query = (
            query.join(ObservationMetric)
            .filter(ObservationMetric.metric_type == metric_type)
            .distinct()
        )

    return query.order_by(Observation.observed_at.desc()).offset(skip).limit(limit).all()


@router.post("/sites/{site_id}/observations", response_model=ObservationOut, status_code=201)
def create_observation(
    site_id: UUID,
    data: ObservationCreate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Record a new environmental observation with metrics (requires ANALYST)."""
    site = db.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")
    proj = db.get(Project, site.project_id)
    if not proj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    require_org_member(proj.organization_id, current_user, db, min_role=Role.ANALYST)

    obs = Observation(
        site_id=site_id,
        observed_at=data.observed_at,
        source=data.source,
        source_reference=data.source_reference,
    )
    db.add(obs)
    db.flush()

    for m in data.metrics:
        metric = ObservationMetric(
            observation_id=obs.id,
            metric_type=m.metric_type,
            value=m.value,
            unit=m.unit,
        )
        db.add(metric)

    log_audit(
        db,
        action="CREATE_OBSERVATION",
        entity_type="observation",
        entity_id=obs.id,
        user_id=current_user.id,
        organization_id=proj.organization_id,
        metadata={
            "site_id": str(site_id),
            "source": obs.source,
            "metrics_count": len(data.metrics),
        },
    )

    db.commit()
    db.refresh(obs)
    return obs


@router.get("/observations/{observation_id}", response_model=ObservationOut)
def get_observation(
    observation_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Get single observation by ID (requires VIEWER)."""
    obs = db.get(Observation, observation_id)
    if not obs:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Observation not found")
    site = db.get(Site, obs.site_id)
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")
    proj = db.get(Project, site.project_id)
    if not proj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    require_org_member(proj.organization_id, current_user, db, min_role=Role.VIEWER)

    return obs
