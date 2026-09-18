from __future__ import annotations

import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ProjectType(str, enum.Enum):
    CARBON = "CARBON"
    BIODIVERSITY = "BIODIVERSITY"
    CARBON_AND_BIODIVERSITY = "CARBON_AND_BIODIVERSITY"
    CONSERVATION = "CONSERVATION"
    RESTORATION = "RESTORATION"
    FORESTRY = "FORESTRY"
    OTHER = "OTHER"


class ProjectStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    project_type: Mapped[ProjectType] = mapped_column(
        Enum(ProjectType, name="project_type_enum"), nullable=False
    )
    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus, name="project_status_enum"),
        nullable=False,
        default=ProjectStatus.DRAFT,
        index=True,
    )
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
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
    organization: Mapped[Organization] = relationship(  # noqa: F821
        "Organization", back_populates="projects"
    )
    sites: Mapped[list[Site]] = relationship(  # noqa: F821
        "Site", back_populates="project", lazy="select"
    )
    creator: Mapped[User | None] = relationship("User", foreign_keys=[created_by])  # noqa: F821
