"""Tests for database models, relationships, spatial fields, enums, and synthetic seed."""

from __future__ import annotations

from datetime import UTC, datetime

from geoalchemy2.shape import from_shape

from app.models import (
    AuditLog,
    Observation,
    ObservationMetric,
    Organization,
    OrganizationMember,
    Project,
    Site,
    User,
)
from app.models.observation_metric import MetricType
from app.models.organization_member import Role
from app.models.project import ProjectStatus, ProjectType
from app.models.site import SiteStatus
from scripts.seed import make_polygon, seed_database


def test_models_and_relationships(db):
    # 1. User
    user = User(
        email="test_model_user@darukaa.org",
        full_name="Model Test User",
        password_hash="hashed_pw_test",
    )
    db.add(user)
    db.flush()
    assert user.id is not None
    assert user.is_active is True

    # 2. Organization
    org = Organization(
        name="Conservation Corp",
        slug="conservation-corp",
    )
    db.add(org)
    db.flush()
    assert org.id is not None

    # 3. OrganizationMember with Role enum
    membership = OrganizationMember(
        organization_id=org.id,
        user_id=user.id,
        role=Role.OWNER,
    )
    db.add(membership)
    db.flush()
    assert membership.role == Role.OWNER

    # 4. Project
    project = Project(
        organization_id=org.id,
        name="Western Ghats Corridor Alpha",
        project_type=ProjectType.CARBON_AND_BIODIVERSITY,
        status=ProjectStatus.ACTIVE,
        description="High-integrity biodiversity & carbon corridor",
    )
    db.add(project)
    db.flush()
    assert project.id is not None
    assert project.project_type == ProjectType.CARBON_AND_BIODIVERSITY

    # 5. Site with Geometry
    poly = make_polygon((76.5, 11.5), 0.05)
    site = Site(
        project_id=project.id,
        name="Silent Valley Plot 1",
        geometry=from_shape(poly, srid=4326),
        area_hectares=125.4,
        status=SiteStatus.ACTIVE,
        created_by=user.id,
    )
    db.add(site)
    db.flush()
    assert site.id is not None
    assert site.area_hectares == 125.4

    # 6. Observation
    obs = Observation(
        site_id=site.id,
        observed_at=datetime.now(UTC),
        source="Sentinel-2 + GEDI L4A (Synthetic)",
    )
    db.add(obs)
    db.flush()
    assert obs.id is not None

    # 7. ObservationMetric
    metric1 = ObservationMetric(
        observation_id=obs.id,
        metric_type=MetricType.NDVI,
        value=0.784,
        unit="index",
    )
    metric2 = ObservationMetric(
        observation_id=obs.id,
        metric_type=MetricType.CARBON_STOCK,
        value=142.6,
        unit="tC/ha",
    )
    db.add_all([metric1, metric2])
    db.flush()
    assert metric1.id is not None
    assert metric2.metric_type == MetricType.CARBON_STOCK

    # 8. AuditLog with JSON metadata
    audit = AuditLog(
        organization_id=org.id,
        user_id=user.id,
        action="CREATE_SITE",
        entity_type="site",
        entity_id=site.id,
        metadata_={"site_name": site.name, "area_ha": site.area_hectares},
    )
    db.add(audit)
    db.flush()
    assert audit.id is not None
    assert audit.metadata_["site_name"] == "Silent Valley Plot 1"


def test_seed_database_execution(db):
    """Verify that seed_database executes cleanly and populates all 7 domain tables."""
    seed_database(db=db)

    # Check organizations
    orgs = db.query(Organization).all()
    assert len(orgs) >= 3

    # Check users
    users = db.query(User).all()
    assert len(users) >= 3

    # Check projects
    projects = db.query(Project).all()
    assert len(projects) >= 10

    # Check sites
    sites = db.query(Site).all()
    assert len(sites) >= 20

    # Check observations and metrics
    observations = db.query(Observation).all()
    assert len(observations) > 0

    metrics = db.query(ObservationMetric).all()
    assert len(metrics) > 0

    # Check audit logs
    audit_logs = db.query(AuditLog).all()
    assert len(audit_logs) >= 6
