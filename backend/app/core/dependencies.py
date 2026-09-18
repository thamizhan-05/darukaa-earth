from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.organization_member import OrganizationMember, Role
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id: str | None = payload.get("sub")
        token_type: str | None = payload.get("type")
        if user_id is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.get(User, UUID(user_id))
    if user is None or not user.is_active:
        raise credentials_exception
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_org_member(
    org_id: UUID,
    user: User | UUID,
    db: Session,
    min_role: Role = Role.VIEWER,
) -> OrganizationMember:
    """Assert user is a member of org with at least min_role. Raises 403 otherwise."""
    user_id = user.id if hasattr(user, "id") else user
    member = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == user_id,
        )
        .first()
    )
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this organization",
        )

    role_hierarchy = [Role.VIEWER, Role.ANALYST, Role.ADMIN, Role.OWNER]
    if role_hierarchy.index(member.role) < role_hierarchy.index(min_role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )
    return member


class RequireRole:
    """FastAPI dependency to enforce RBAC permissions on organization routes."""

    def __init__(self, min_role: Role = Role.VIEWER):
        self.min_role = min_role

    def __call__(
        self,
        org_id: UUID,
        current_user: CurrentUser,
        db: Session = Depends(get_db),
    ) -> OrganizationMember:
        return require_org_member(org_id, current_user, db, self.min_role)
