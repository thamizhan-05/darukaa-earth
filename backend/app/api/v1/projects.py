from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import CurrentUser
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate
from app.services.project_service import ProjectService

router = APIRouter(tags=["Projects"])
_service = ProjectService()


@router.get("/projects", response_model=list[ProjectOut])
def list_projects(
    org_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """List all projects in an organization."""
    return _service.list_for_org(db, org_id, current_user.id)


@router.post("/projects", response_model=ProjectOut, status_code=201)
def create_project(
    data: ProjectCreate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Create a new project."""
    return _service.create(db, data, current_user.id)


@router.get("/projects/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    return _service.get(db, project_id, current_user.id)


@router.patch("/projects/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: UUID,
    data: ProjectUpdate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    return _service.update(db, project_id, data, current_user.id)


@router.delete("/projects/{project_id}", status_code=204)
def delete_project(
    project_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    _service.delete(db, project_id, current_user.id)
