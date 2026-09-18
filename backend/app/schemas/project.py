from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.project import ProjectStatus, ProjectType


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    project_type: ProjectType
    status: ProjectStatus = ProjectStatus.DRAFT
    start_date: date | None = None
    end_date: date | None = None
    organization_id: UUID


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    project_type: ProjectType | None = None
    status: ProjectStatus | None = None
    start_date: date | None = None
    end_date: date | None = None


class ProjectOut(BaseModel):
    id: UUID
    organization_id: UUID
    name: str
    description: str | None
    project_type: ProjectType
    status: ProjectStatus
    start_date: date | None
    end_date: date | None
    created_by: UUID | None
    created_at: datetime
    updated_at: datetime
    site_count: int = 0
    total_area_hectares: float = 0.0

    model_config = {"from_attributes": True}
