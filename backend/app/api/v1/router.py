from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import (
    analytics,
    auth,
    database,
    environmental,
    map,
    observations,
    organizations,
    projects,
    sites,
    tiles,
)

router = APIRouter(prefix="/api/v1")

router.include_router(auth.router)
router.include_router(organizations.router)
router.include_router(projects.router)
router.include_router(sites.router)
router.include_router(observations.router)
router.include_router(analytics.router)
router.include_router(environmental.router)
router.include_router(map.router)
router.include_router(tiles.router)
router.include_router(database.router)
