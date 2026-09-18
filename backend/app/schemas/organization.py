from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.organization_member import Role


class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)


class OrganizationOut(BaseModel):
    id: UUID
    name: str
    slug: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MemberCreate(BaseModel):
    email: str = Field(..., description="Email of the user to invite or add")
    role: Role = Field(default=Role.ANALYST, description="Role within the organization")


class MemberUpdate(BaseModel):
    role: Role = Field(..., description="New role for the organization member")


class MemberOut(BaseModel):
    id: UUID
    user_id: UUID
    organization_id: UUID
    role: Role
    created_at: datetime
    user_email: str | None = None
    user_name: str | None = None

    model_config = {"from_attributes": True}


class AuditLogOut(BaseModel):
    id: UUID
    organization_id: UUID | None
    user_id: UUID | None
    action: str
    entity_type: str | None
    entity_id: UUID | None
    metadata: dict | None = Field(default=None, alias="metadata_")
    created_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}
