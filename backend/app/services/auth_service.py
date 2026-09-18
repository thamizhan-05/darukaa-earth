from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from slugify import slugify
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember, Role
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse


class AuthService:
    def register(self, db: Session, data: RegisterRequest) -> TokenResponse:
        # Check email uniqueness
        if db.query(User).filter(User.email == data.email).first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists",
            )

        # Create user
        user = User(
            email=data.email,
            full_name=data.full_name,
            password_hash=hash_password(data.password),
        )
        db.add(user)
        db.flush()  # get user.id

        # Create organization
        slug = self._unique_slug(db, data.organization_name)
        org = Organization(name=data.organization_name, slug=slug)
        db.add(org)
        db.flush()

        # Add user as OWNER
        member = OrganizationMember(organization_id=org.id, user_id=user.id, role=Role.OWNER)
        db.add(member)
        db.commit()
        db.refresh(user)

        return self._issue_tokens(str(user.id))

    def login(self, db: Session, data: LoginRequest) -> TokenResponse:
        user = db.query(User).filter(User.email == data.email).first()
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive",
            )
        # Record audit log
        org_id = user.memberships[0].organization_id if user.memberships else None
        from app.core.audit import log_audit

        log_audit(
            db,
            action="LOGIN",
            entity_type="user",
            entity_id=user.id,
            user_id=user.id,
            organization_id=org_id,
            metadata={"email": user.email},
        )
        db.commit()
        return self._issue_tokens(str(user.id))

    def refresh(self, db: Session, refresh_token: str) -> TokenResponse:
        from jose import JWTError

        from app.core.security import decode_token

        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise ValueError
            user_id = payload["sub"]
        except (JWTError, ValueError, KeyError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )
        user = db.get(User, UUID(user_id))
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        return self._issue_tokens(str(user.id))

    @staticmethod
    def _issue_tokens(user_id: str) -> TokenResponse:
        return TokenResponse(
            access_token=create_access_token(user_id),
            refresh_token=create_refresh_token(user_id),
        )

    @staticmethod
    def _unique_slug(db: Session, name: str) -> str:
        base = slugify(name)
        slug = base
        counter = 1
        while db.query(Organization).filter(Organization.slug == slug).first():
            slug = f"{base}-{counter}"
            counter += 1
        return slug
