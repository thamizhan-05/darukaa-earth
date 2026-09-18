from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    members: Mapped[list[OrganizationMember]] = relationship(  # noqa: F821
        "OrganizationMember", back_populates="organization", lazy="select"
    )
    projects: Mapped[list[Project]] = relationship(  # noqa: F821
        "Project", back_populates="organization", lazy="select"
    )
    audit_logs: Mapped[list[AuditLog]] = relationship(  # noqa: F821
        "AuditLog", back_populates="organization", lazy="select"
    )
