from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.audit import log_audit
from app.core.database import get_db
from app.core.dependencies import CurrentUser, require_org_member
from app.models.audit_log import AuditLog
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember, Role
from app.models.user import User
from app.schemas.organization import (
    AuditLogOut,
    MemberCreate,
    MemberOut,
    MemberUpdate,
    OrganizationCreate,
    OrganizationOut,
)

router = APIRouter(prefix="/organizations", tags=["Organizations"])


@router.get("", response_model=list[OrganizationOut])
def list_organizations(current_user: CurrentUser, db: Session = Depends(get_db)):
    """List all organizations the current user belongs to."""
    memberships = (
        db.query(OrganizationMember).filter(OrganizationMember.user_id == current_user.id).all()
    )
    org_ids = [m.organization_id for m in memberships]
    return db.query(Organization).filter(Organization.id.in_(org_ids)).all()


@router.post("", response_model=OrganizationOut, status_code=201)
def create_organization(
    data: OrganizationCreate, current_user: CurrentUser, db: Session = Depends(get_db)
):
    """Create a new organization (current user becomes OWNER)."""
    from slugify import slugify

    base_slug = slugify(data.name)
    slug = base_slug
    counter = 1
    while db.query(Organization).filter(Organization.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    org = Organization(name=data.name, slug=slug)
    db.add(org)
    db.flush()
    member = OrganizationMember(organization_id=org.id, user_id=current_user.id, role=Role.OWNER)
    db.add(member)
    db.commit()
    db.refresh(org)
    return org


@router.get("/{org_id}", response_model=OrganizationOut)
def get_organization(org_id: UUID, current_user: CurrentUser, db: Session = Depends(get_db)):
    """Get a single organization (must be a member)."""
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    require_org_member(org_id, current_user, db, min_role=Role.VIEWER)
    return org


@router.get("/{org_id}/members", response_model=list[MemberOut])
def list_organization_members(
    org_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """List all members of an organization (requires at least VIEWER)."""
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    require_org_member(org_id, current_user, db, min_role=Role.VIEWER)

    members = (
        db.query(OrganizationMember).filter(OrganizationMember.organization_id == org_id).all()
    )
    result = []
    for m in members:
        user = m.user
        result.append(
            MemberOut(
                id=m.id,
                user_id=m.user_id,
                organization_id=m.organization_id,
                role=m.role,
                created_at=m.created_at,
                user_email=user.email if user else None,
                user_name=user.full_name if user else None,
            )
        )
    return result


@router.post("/{org_id}/members", response_model=MemberOut, status_code=201)
def add_organization_member(
    org_id: UUID,
    data: MemberCreate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Add a member to an organization (requires at least ADMIN)."""
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    require_org_member(org_id, current_user, db, min_role=Role.ADMIN)

    target_user = db.query(User).filter(User.email == data.email).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    existing = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == target_user.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already a member of this organization",
        )

    member = OrganizationMember(
        organization_id=org_id,
        user_id=target_user.id,
        role=data.role,
    )
    db.add(member)
    db.flush()

    log_audit(
        db,
        action="ADD_MEMBER",
        entity_type="organization_member",
        entity_id=member.id,
        user_id=current_user.id,
        organization_id=org_id,
        metadata={
            "target_user_id": str(target_user.id),
            "email": target_user.email,
            "role": data.role.value,
        },
    )
    db.commit()
    db.refresh(member)

    return MemberOut(
        id=member.id,
        user_id=member.user_id,
        organization_id=member.organization_id,
        role=member.role,
        created_at=member.created_at,
        user_email=target_user.email,
        user_name=target_user.full_name,
    )


@router.patch("/{org_id}/members/{target_user_id}", response_model=MemberOut)
def update_organization_member(
    org_id: UUID,
    target_user_id: UUID,
    data: MemberUpdate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Update role of an organization member (requires ADMIN or OWNER)."""
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    require_org_member(org_id, current_user, db, min_role=Role.ADMIN)

    member = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == target_user_id,
        )
        .first()
    )
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    if member.role == Role.OWNER and data.role != Role.OWNER:
        owner_count = (
            db.query(OrganizationMember)
            .filter(
                OrganizationMember.organization_id == org_id,
                OrganizationMember.role == Role.OWNER,
            )
            .count()
        )
        if owner_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot demote the last organization OWNER",
            )

    member.role = data.role

    log_audit(
        db,
        action="UPDATE_MEMBER_ROLE",
        entity_type="organization_member",
        entity_id=member.id,
        user_id=current_user.id,
        organization_id=org_id,
        metadata={"target_user_id": str(target_user_id), "new_role": data.role.value},
    )
    db.commit()
    db.refresh(member)

    return MemberOut(
        id=member.id,
        user_id=member.user_id,
        organization_id=member.organization_id,
        role=member.role,
        created_at=member.created_at,
        user_email=member.user.email if member.user else None,
        user_name=member.user.full_name if member.user else None,
    )


@router.delete("/{org_id}/members/{target_user_id}", status_code=204)
def remove_organization_member(
    org_id: UUID,
    target_user_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Remove a member from an organization (requires ADMIN or OWNER)."""
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    require_org_member(org_id, current_user, db, min_role=Role.ADMIN)

    member = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == target_user_id,
        )
        .first()
    )
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    if member.role == Role.OWNER:
        owner_count = (
            db.query(OrganizationMember)
            .filter(
                OrganizationMember.organization_id == org_id,
                OrganizationMember.role == Role.OWNER,
            )
            .count()
        )
        if owner_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the last organization OWNER",
            )

    db.delete(member)
    log_audit(
        db,
        action="REMOVE_MEMBER",
        entity_type="organization_member",
        entity_id=member.id,
        user_id=current_user.id,
        organization_id=org_id,
        metadata={"target_user_id": str(target_user_id)},
    )
    db.commit()


@router.get("/{org_id}/audit-logs", response_model=list[AuditLogOut])
def list_audit_logs(
    org_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
):
    """Retrieve audit trail for an organization."""
    require_org_member(org_id, current_user, db, min_role=Role.VIEWER)

    logs = (
        db.query(AuditLog)
        .filter(AuditLog.organization_id == org_id)
        .order_by(AuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return logs
