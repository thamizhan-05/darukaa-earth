from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.models.organization_member import Role


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    organization_name: str = Field(..., min_length=2, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserMembershipOut(BaseModel):
    id: UUID
    organization_id: UUID
    role: Role
    created_at: datetime

    model_config = {"from_attributes": True}


class UserOut(BaseModel):
    id: UUID
    email: str
    full_name: str
    is_active: bool
    created_at: datetime
    memberships: list[UserMembershipOut] = Field(default_factory=list)

    model_config = {"from_attributes": True}
