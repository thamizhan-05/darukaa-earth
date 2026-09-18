"""Initial database schema with PostGIS support.

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-09-17 12:00:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

import geoalchemy2
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable PostGIS Extension
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    # 2. Enums
    role_enum = postgresql.ENUM("OWNER", "ADMIN", "ANALYST", "VIEWER", name="role_enum", create_type=False)
    role_enum.create(op.get_bind(), checkfirst=True)

    project_type_enum = postgresql.ENUM(
        "CARBON", "BIODIVERSITY", "RESTORATION", "FORESTRY", "CONSERVATION", "CARBON_AND_BIODIVERSITY", "OTHER",
        name="project_type_enum",
        create_type=False,
    )
    project_type_enum.create(op.get_bind(), checkfirst=True)

    project_status_enum = postgresql.ENUM(
        "DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED",
        name="project_status_enum",
        create_type=False,
    )
    project_status_enum.create(op.get_bind(), checkfirst=True)

    site_status_enum = postgresql.ENUM(
        "ACTIVE", "INACTIVE", "UNDER_REVIEW",
        name="site_status_enum",
        create_type=False,
    )
    site_status_enum.create(op.get_bind(), checkfirst=True)

    metric_type_enum = postgresql.ENUM(
        "CARBON_STOCK", "CARBON_SEQUESTRATION", "BIODIVERSITY_INDEX", "SPECIES_RICHNESS", "SPECIES_COUNT",
        "CANOPY_COVER", "NDVI", "SOIL_ORGANIC_CARBON", "SOIL_CARBON", "TREE_DENSITY", "WATER_QUALITY",
        name="metric_type_enum",
        create_type=False,
    )
    metric_type_enum.create(op.get_bind(), checkfirst=True)

    # 3. Users
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"])

    # 4. Organizations
    op.create_table(
        "organizations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=100), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_organizations_slug", "organizations", ["slug"])

    # 5. Organization Members
    op.create_table(
        "organization_members",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", role_enum, nullable=False, server_default="ANALYST"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("organization_id", "user_id", name="uq_org_member"),
    )

    # 6. Projects
    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("project_type", project_type_enum, nullable=False),
        sa.Column("status", project_status_enum, nullable=False, server_default="ACTIVE"),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_projects_organization_id", "projects", ["organization_id"])
    op.create_index("ix_projects_status", "projects", ["status"])

    # 7. Sites
    op.create_table(
        "sites",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("geometry", geoalchemy2.types.Geometry(geometry_type="MULTIPOLYGON", srid=4326, spatial_index=False), nullable=True),
        sa.Column("area_hectares", sa.Numeric(12, 4), nullable=True),
        sa.Column("status", site_status_enum, nullable=False, server_default="ACTIVE"),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_sites_project_id", "sites", ["project_id"])
    op.create_index("ix_sites_status", "sites", ["status"])
    op.execute("CREATE INDEX idx_sites_geometry ON sites USING GIST (geometry)")

    # 8. Observations
    op.create_table(
        "observations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("site_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("sites.id", ondelete="CASCADE"), nullable=False),
        sa.Column("observed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("source", sa.String(length=100), nullable=False),
        sa.Column("source_reference", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_observations_site_id", "observations", ["site_id"])
    op.create_index("ix_observations_observed_at", "observations", ["observed_at"])

    # 9. Observation Metrics
    op.create_table(
        "observation_metrics",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("observation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("observations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("metric_type", metric_type_enum, nullable=False),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("unit", sa.String(length=50), nullable=False),
    )
    op.create_index("ix_obs_metrics_obs_id", "observation_metrics", ["observation_id"])
    op.create_index("ix_obs_metrics_type", "observation_metrics", ["metric_type"])

    # 10. Audit Logs
    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("entity_type", sa.String(length=100), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_audit_logs_org_id", "audit_logs", ["organization_id"])
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"])
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("observation_metrics")
    op.drop_table("observations")
    op.execute("DROP INDEX IF EXISTS idx_sites_geometry")
    op.drop_table("sites")
    op.drop_table("projects")
    op.drop_table("organization_members")
    op.drop_table("organizations")
    op.drop_table("users")

    # Drop enums
    op.execute("DROP TYPE IF EXISTS metric_type_enum")
    op.execute("DROP TYPE IF EXISTS site_status_enum")
    op.execute("DROP TYPE IF EXISTS project_status_enum")
    op.execute("DROP TYPE IF EXISTS project_type_enum")
    op.execute("DROP TYPE IF EXISTS role_enum")
