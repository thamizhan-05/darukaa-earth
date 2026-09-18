from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def log_audit(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: UUID | None = None,
    user_id: UUID | None = None,
    organization_id: UUID | None = None,
    metadata: dict[str, Any] | None = None,
) -> AuditLog:
    """Record an action in the system audit log."""
    log_entry = AuditLog(
        organization_id=organization_id,
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        metadata_=metadata or {},
    )
    db.add(log_entry)
    # Note: caller or request commits the session
    return log_entry
