from __future__ import annotations

from collections.abc import Generator
from typing import Annotated, Any

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

engine_kwargs: dict[str, Any] = {
    "echo": settings.APP_ENV == "development",
}
connect_args: dict[str, Any] = {}

if not settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs.update(
        {
            "pool_pre_ping": True,
            "pool_size": 10,
            "max_overflow": 20,
        }
    )
else:
    connect_args["check_same_thread"] = False
    from geoalchemy2 import Geometry
    from sqlalchemy.ext.compiler import compiles

    @compiles(Geometry, "sqlite")
    def compile_geometry_sqlite(type_, compiler, **kw):
        return "BLOB"

    class DummyDialect:
        before_create = after_create = before_drop = after_drop = staticmethod(lambda *a, **k: None)

    import geoalchemy2.admin

    geoalchemy2.admin.select_dialect = lambda name: DummyDialect()

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs,
)

if settings.DATABASE_URL.startswith("sqlite"):
    import re

    import shapely
    import shapely.wkt

    def _to_ewkb(val):
        if val is None:
            return None
        if isinstance(val, (bytes, memoryview)):
            return bytes(val)
        if isinstance(val, str):
            srid = 4326
            wkt_str = val
            if ";" in val:
                srid_part, wkt_str = val.split(";", 1)
                m = re.search(r"\d+", srid_part)
                if m:
                    srid = int(m.group())
            try:
                g = shapely.wkt.loads(wkt_str)
                g = shapely.set_srid(g, srid)
                return shapely.to_wkb(g, include_srid=True)
            except Exception:
                return val.encode("utf-8")
        return val

    @event.listens_for(engine, "connect")
    def register_sqlite_functions(dbapi_connection, connection_record):
        for fn_name in [
            "AsEWKB",
            "ST_AsBinary",
            "ST_GeomFromWKB",
            "ST_GeomFromEWKB",
            "GeomFromEWKB",
            "GeomFromWKB",
            "GeomFromEWKT",
            "GeomFromText",
            "ST_GeomFromEWKT",
            "ST_GeomFromText",
        ]:
            dbapi_connection.create_function(
                fn_name, -1, lambda *args: _to_ewkb(args[0]) if args else None
            )
        dbapi_connection.create_function("ST_AsGeoJSON", -1, lambda *args: "{}" if args else None)
        dbapi_connection.create_function(
            "ST_Transform", -1, lambda *args: args[0] if args else None
        )
        dbapi_connection.create_function("ST_Area", -1, lambda *args: 100.0)
        dbapi_connection.create_function("ST_MakeEnvelope", -1, lambda *args: None)
        dbapi_connection.create_function("ST_Intersects", -1, lambda *args: 1)


SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


DbSession = Annotated[Session, "db"]
