from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.organization_member import OrganizationMember, Role
from app.models.project import Project
from app.models.site import Site
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate


class ProjectService:
    def list_for_org(self, db: Session, org_id: UUID, user_id: UUID) -> list[ProjectOut]:
        self._assert_member(db, org_id, user_id)
        rows = (
            db.query(
                Project,
                func.count(Site.id).label("site_count"),
                func.coalesce(func.sum(Site.area_hectares), 0).label("total_area"),
            )
            .outerjoin(Site, Site.project_id == Project.id)
            .filter(Project.organization_id == org_id)
            .group_by(Project.id)
            .all()
        )
        result = []
        for project, site_count, total_area in rows:
            out = ProjectOut.model_validate(project)
            out.site_count = site_count
            out.total_area_hectares = float(total_area or 0)
            result.append(out)
        return result

    def get(self, db: Session, project_id: UUID, user_id: UUID) -> ProjectOut:
        project = self._get_or_404(db, project_id)
        self._assert_member(db, project.organization_id, user_id)
        return self._enrich(db, project)

    def create(self, db: Session, data: ProjectCreate, user_id: UUID) -> ProjectOut:
        self._assert_member(db, data.organization_id, user_id, min_role=Role.ANALYST)
        project = Project(
            **data.model_dump(exclude={"organization_id"}),
            organization_id=data.organization_id,
            created_by=user_id,
        )
        db.add(project)
        db.flush()

        from app.core.audit import log_audit

        log_audit(
            db,
            action="CREATE_PROJECT",
            entity_type="project",
            entity_id=project.id,
            user_id=user_id,
            organization_id=project.organization_id,
            metadata={"name": project.name, "project_type": project.project_type.value},
        )
        db.commit()
        db.refresh(project)
        return self._enrich(db, project)

    def update(
        self, db: Session, project_id: UUID, data: ProjectUpdate, user_id: UUID
    ) -> ProjectOut:
        project = self._get_or_404(db, project_id)
        self._assert_member(db, project.organization_id, user_id, min_role=Role.ANALYST)
        for field, val in data.model_dump(exclude_none=True).items():
            setattr(project, field, val)
        db.commit()
        db.refresh(project)
        return self._enrich(db, project)

    def delete(self, db: Session, project_id: UUID, user_id: UUID) -> None:
        project = self._get_or_404(db, project_id)
        self._assert_member(db, project.organization_id, user_id, min_role=Role.ADMIN)
        db.delete(project)
        db.commit()

    def _enrich(self, db: Session, project: Project) -> ProjectOut:
        row = (
            db.query(
                func.count(Site.id).label("site_count"),
                func.coalesce(func.sum(Site.area_hectares), 0).label("total_area"),
            )
            .filter(Site.project_id == project.id)
            .first()
        )
        out = ProjectOut.model_validate(project)
        if row:
            out.site_count = row.site_count
            out.total_area_hectares = float(row.total_area or 0)
        return out

    @staticmethod
    def _get_or_404(db: Session, project_id: UUID) -> Project:
        project = db.get(Project, project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        return project

    @staticmethod
    def _assert_member(
        db: Session, org_id: UUID, user_id: UUID, min_role: Role = Role.VIEWER
    ) -> None:
        member = (
            db.query(OrganizationMember)
            .filter(
                OrganizationMember.organization_id == org_id,
                OrganizationMember.user_id == user_id,
            )
            .first()
        )
        if not member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        role_hierarchy = [Role.VIEWER, Role.ANALYST, Role.ADMIN, Role.OWNER]
        if role_hierarchy.index(member.role) < role_hierarchy.index(min_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions"
            )
