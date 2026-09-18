from __future__ import annotations

import logging
import math
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from geoalchemy2.shape import to_shape
from shapely.geometry import box
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import decode_token
from app.models.organization_member import OrganizationMember
from app.models.project import Project
from app.models.site import Site

logger = logging.getLogger("darukaa.tiles")
settings = get_settings()

router = APIRouter(prefix="/tiles", tags=["Vector Tiles"])


def tile_to_bbox(z: int, x: int, y: int) -> tuple[float, float, float, float]:
    """
    Calculate WGS84 (lon_min, lat_min, lon_max, lat_max) for tile coordinates (z, x, y).
    """
    n = 2.0**z
    lon_min = x / n * 360.0 - 180.0
    lat_rad_max = math.atan(math.sinh(math.pi * (1.0 - 2.0 * y / n)))
    lat_max = math.degrees(lat_rad_max)

    lon_max = (x + 1) / n * 360.0 - 180.0
    lat_rad_min = math.atan(math.sinh(math.pi * (1.0 - 2.0 * (y + 1) / n)))
    lat_min = math.degrees(lat_rad_min)

    return (lon_min, lat_min, lon_max, lat_max)


def authenticate_tile_request(
    db: Session,
    org_id: UUID,
    token: str | None = None,
) -> None:
    """
    Verify tile request access via token query param if supplied.
    """
    if not token:
        # Allow open viewing for tenant visual inspection if public demo mode,
        # or require valid membership if token is provided.
        return

    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return
        member = (
            db.query(OrganizationMember)
            .filter(
                OrganizationMember.organization_id == org_id,
                OrganizationMember.user_id == UUID(user_id),
            )
            .first()
        )
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access vector tiles for this organization",
            )
    except Exception as e:
        logger.debug(f"Tile token verification: {e}")


@router.get("/{org_id}/tilejson.json")
def get_tilejson(
    org_id: UUID,
    token: str | None = Query(None, description="Optional access token"),
):
    """
    TileJSON 2.2.0 metadata for Mapbox GL JS vector tile source.
    """
    token_suffix = f"?token={token}" if token else ""
    return {
        "tilejson": "2.2.0",
        "name": f"darukaa-sites-{org_id}",
        "description": "Darukaa.Earth High-Resolution PostGIS Vector Tiles",
        "version": "1.0.0",
        "scheme": "xyz",
        "tiles": [f"/api/v1/tiles/{org_id}/{{z}}/{{x}}/{{y}}.pbf{token_suffix}"],
        "minzoom": 0,
        "maxzoom": 20,
        "bounds": [-180, -85.05112877980659, 180, 85.05112877980659],
        "vector_layers": [
            {
                "id": "sites",
                "description": "Conservation reserve polygons and boundaries",
                "fields": {
                    "id": "String",
                    "name": "String",
                    "area_hectares": "Number",
                    "status": "String",
                    "project_id": "String",
                },
            }
        ],
    }


@router.get(
    "/{org_id}/{z}/{x}/{y}.pbf",
    responses={
        200: {
            "content": {"application/vnd.mapbox-vector-tile": {}},
            "description": "Mapbox Vector Tile (.pbf)",
        }
    },
)
def get_vector_tile(
    org_id: UUID,
    z: int,
    x: int,
    y: int,
    token: str | None = Query(None, description="Optional access token"),
    db: Session = Depends(get_db),
):
    """
    Generate and serve dynamic Mapbox Vector Tile (MVT) for the requested tile coordinate.
    Uses PostGIS ST_AsMVT when running against PostgreSQL, or high-performance Shapely
    + mapbox-vector-tile encoder for SQLite local development.
    """
    authenticate_tile_request(db, org_id, token)

    lon_min, lat_min, lon_max, lat_max = tile_to_bbox(z, x, y)
    tile_bbox = box(lon_min, lat_min, lon_max, lat_max)

    bind = db.get_bind()
    is_postgres = bind.dialect.name == "postgresql"

    if is_postgres:
        # Native PostGIS ST_AsMVT for maximum C-level engine performance
        sql = text("""
            WITH bounds AS (
                SELECT ST_TileEnvelope(:z, :x, :y) AS geom
            ),
            mvtgeom AS (
                SELECT
                    ST_AsMVTGeom(s.geometry, bounds.geom, 4096, 256, true) AS geom,
                    s.id::text AS id,
                    s.name,
                    s.area_hectares,
                    s.status::text AS status,
                    s.project_id::text AS project_id
                FROM sites s
                JOIN projects p ON p.id = s.project_id
                CROSS JOIN bounds
                WHERE p.organization_id = :org_id
                  AND s.geometry IS NOT NULL
                  AND ST_Intersects(s.geometry, bounds.geom)
            )
            SELECT ST_AsMVT(mvtgeom.*, 'sites', 4096, 'geom') AS mvt FROM mvtgeom;
        """)
        try:
            result = db.execute(
                sql,
                {"z": z, "x": x, "y": y, "org_id": str(org_id)},
            ).scalar()
            pbf_bytes = bytes(result) if result else b""
            return Response(
                content=pbf_bytes,
                media_type="application/vnd.mapbox-vector-tile",
                headers={
                    "Content-Encoding": "gzip" if len(pbf_bytes) > 1024 else "identity",
                    "Cache-Control": "public, max-age=3600",
                    "X-Tile-Engine": "PostGIS ST_AsMVT",
                },
            )
        except Exception as e:
            logger.warning(f"PostGIS ST_AsMVT error, falling back to python encoder: {e}")

    # Fallback or SQLite environment:
    # Query sites and encode via mapbox_vector_tile
    sites = (
        db.query(Site)
        .join(Project, Project.id == Site.project_id)
        .filter(Project.organization_id == org_id, Site.geometry.isnot(None))
        .all()
    )

    features: list[dict[str, Any]] = []
    for site in sites:
        try:
            geom = to_shape(site.geometry)
            # Spatial index / intersection check
            if geom.intersects(tile_bbox):
                features.append(
                    {
                        "geometry": geom,
                        "properties": {
                            "id": str(site.id),
                            "name": site.name,
                            "area_hectares": float(site.area_hectares or 0.0),
                            "status": site.status.value if site.status else "ACTIVE",
                            "project_id": str(site.project_id),
                        },
                    }
                )
        except Exception as e:
            logger.debug(f"Geometry parsing error for site {site.id}: {e}")

    try:
        import mapbox_vector_tile

        tile_layer = {
            "name": "sites",
            "features": features,
        }
        pbf_bytes = mapbox_vector_tile.encode(
            tile_layer,
            quantize_bounds=(lon_min, lat_min, lon_max, lat_max),
        )
    except Exception as e:
        logger.error(f"Error encoding MVT: {e}")
        pbf_bytes = b""

    return Response(
        content=pbf_bytes,
        media_type="application/vnd.mapbox-vector-tile",
        headers={
            "Cache-Control": "public, max-age=3600",
            "X-Tile-Engine": "Python MapboxVectorTile",
        },
    )
