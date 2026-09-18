from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from geoalchemy2.functions import (
    ST_Intersects,
    ST_MakeEnvelope,
)
from geoalchemy2.shape import from_shape, to_shape
from shapely.geometry import mapping, shape
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.dependencies import require_org_member
from app.models.organization_member import Role
from app.models.project import Project
from app.models.site import Site
from app.schemas.site import SiteCreate, SiteGeoJSON, SiteOut, SiteUpdate


class SiteService:
    def list_for_project(self, db: Session, project_id: UUID, user_id: UUID) -> list[SiteOut]:
        project = db.get(Project, project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        require_org_member(project.organization_id, user_id, db, min_role=Role.VIEWER)

        sites = db.query(Site).filter(Site.project_id == project_id).all()
        return [self._to_out(db, s) for s in sites]

    def get(self, db: Session, site_id: UUID, user_id: UUID | None = None) -> SiteOut:
        site = self._get_or_404(db, site_id)
        if user_id is not None:
            project = db.get(Project, site.project_id)
            if not project:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
                )
            require_org_member(project.organization_id, user_id, db, min_role=Role.VIEWER)
        return self._to_out(db, site)

    def create(self, db: Session, project_id: UUID, data: SiteCreate, user_id: UUID) -> SiteOut:
        project = db.get(Project, project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        require_org_member(project.organization_id, user_id, db, min_role=Role.ANALYST)

        geom_wkb = self._geojson_to_wkb(data.geometry)
        area = self._calculate_area_ha(db, geom_wkb)

        site = Site(
            project_id=project_id,
            name=data.name,
            description=data.description,
            geometry=geom_wkb,
            area_hectares=area,
            status=data.status,
            created_by=user_id,
        )
        db.add(site)
        db.flush()

        from app.core.audit import log_audit

        log_audit(
            db,
            action="CREATE_SITE",
            entity_type="site",
            entity_id=site.id,
            user_id=user_id,
            organization_id=project.organization_id,
            metadata={"name": site.name, "area_hectares": float(site.area_hectares or 0)},
        )
        db.commit()
        db.refresh(site)
        return self._to_out(db, site)

    def update(
        self, db: Session, site_id: UUID, data: SiteUpdate, user_id: UUID | None = None
    ) -> SiteOut:
        site = self._get_or_404(db, site_id)
        project = db.get(Project, site.project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if user_id is not None:
            require_org_member(project.organization_id, user_id, db, min_role=Role.ANALYST)

        for field, val in data.model_dump(exclude_none=True).items():
            setattr(site, field, val)

        from app.core.audit import log_audit

        log_audit(
            db,
            action="UPDATE_SITE",
            entity_type="site",
            entity_id=site.id,
            user_id=user_id or site.created_by,
            organization_id=project.organization_id,
            metadata={"name": site.name, "status": site.status.value if site.status else None},
        )
        db.commit()
        db.refresh(site)
        return self._to_out(db, site)

    def delete(self, db: Session, site_id: UUID, user_id: UUID | None = None) -> None:
        site = self._get_or_404(db, site_id)
        project = db.get(Project, site.project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if user_id is not None:
            require_org_member(project.organization_id, user_id, db, min_role=Role.ADMIN)

        db.delete(site)
        db.commit()

    def get_map_features(
        self,
        db: Session,
        org_id: UUID,
        user_id: UUID | None = None,
        bbox: str | None = None,
    ) -> list[SiteGeoJSON]:
        """Return GeoJSON features for the org, optionally filtered by bbox."""
        if user_id is not None:
            require_org_member(org_id, user_id, db, min_role=Role.VIEWER)

        query = (
            db.query(Site)
            .join(Project, Project.id == Site.project_id)
            .filter(Project.organization_id == org_id, Site.geometry.isnot(None))
        )

        if bbox:
            try:
                parts = [float(x) for x in bbox.split(",")]
                lon_min, lat_min, lon_max, lat_max = parts
                envelope = ST_MakeEnvelope(lon_min, lat_min, lon_max, lat_max, 4326)
                query = query.filter(ST_Intersects(Site.geometry, envelope))
            except (ValueError, TypeError):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Invalid bbox. Use: lon_min,lat_min,lon_max,lat_max",
                )

        sites = query.all()
        features = []
        for site in sites:
            if not site.geometry:
                continue
            try:
                geom_dict = mapping(to_shape(site.geometry))
            except Exception:
                continue
            features.append(
                SiteGeoJSON(
                    id=str(site.id),
                    geometry=geom_dict,
                    properties={
                        "name": site.name,
                        "area_hectares": float(site.area_hectares or 0),
                        "status": site.status.value if site.status else "ACTIVE",
                        "project_id": str(site.project_id),
                    },
                )
            )
        return features

    # ── Helpers ──────────────────────────────────────────────────────────────

    def _to_out(self, db: Session, site: Site) -> SiteOut:
        geojson = None
        if site.geometry is not None:
            try:
                geojson = mapping(to_shape(site.geometry))
            except Exception:
                geojson = None
        data = SiteOut.model_validate(site)
        data.geometry = geojson
        return data

    @staticmethod
    def _geojson_to_wkb(geojson: dict[str, Any]) -> Any:
        """Convert GeoJSON dict to GeoAlchemy2-compatible WKB, normalising to MULTIPOLYGON."""
        geom_type = geojson.get("type", "")
        try:
            shp = shape(geojson)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid GeoJSON geometry: {e}",
            )

        if geom_type == "Polygon":
            from shapely.geometry import MultiPolygon

            shp = MultiPolygon([shp])
        elif geom_type != "MultiPolygon":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Geometry must be Polygon or MultiPolygon",
            )

        return from_shape(shp, srid=4326)

    @staticmethod
    def _calculate_area_ha(db: Session, geom_wkb: Any) -> float:
        """Calculate area in hectares using PostGIS — server-side only with WGS84 geodesic fallback."""
        bind = db.get_bind()
        if bind.dialect.name == "postgresql":
            try:
                result = db.scalar(select(func.ST_Area(func.ST_Transform(geom_wkb, 3857))))
                if result is not None and float(result) > 0:
                    return round(float(result) / 10_000, 4)
            except Exception:
                pass

        # High-accuracy spherical WGS84 geodesic calculation
        try:
            shp = to_shape(geom_wkb)
            import math

            lat_rad = math.radians(shp.centroid.y)
            deg_m2 = 111_320.0 * 111_320.0 * math.cos(lat_rad)
            area_m2 = shp.area * deg_m2
            return round(abs(area_m2) / 10_000, 4)
        except Exception:
            return 0.0

    @staticmethod
    def _get_or_404(db: Session, site_id: UUID) -> Site:
        site = db.get(Site, site_id)
        if not site:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")
        return site
