from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import CurrentUser
from app.schemas.site import SiteCreate, SiteOut, SiteUpdate
from app.services.site_service import SiteService

router = APIRouter(tags=["Sites"])
_service = SiteService()


@router.get("/projects/{project_id}/sites", response_model=list[SiteOut])
def list_sites(
    project_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """List all sites in a project."""
    return _service.list_for_project(db, project_id, current_user.id)


@router.post("/projects/{project_id}/sites", response_model=SiteOut, status_code=201)
def create_site(
    project_id: UUID,
    data: SiteCreate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Create a site with a GeoJSON polygon. Area is computed server-side."""
    return _service.create(db, project_id, data, current_user.id)


@router.get("/sites/{site_id}", response_model=SiteOut)
def get_site(
    site_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    return _service.get(db, site_id, current_user.id)


@router.patch("/sites/{site_id}", response_model=SiteOut)
def update_site(
    site_id: UUID,
    data: SiteUpdate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    return _service.update(db, site_id, data, current_user.id)


@router.delete("/sites/{site_id}", status_code=204)
def delete_site(
    site_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    _service.delete(db, site_id, current_user.id)
