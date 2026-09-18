"""Test configuration and fixtures."""

from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app

DEFAULT_PG_URL = os.environ.get(
    "TEST_DATABASE_URL",
    os.environ.get("DATABASE_URL", "postgresql://test_user:test_pass@localhost:5432/darukaa_test"),
)


@pytest.fixture(scope="session")
def engine():
    # Attempt to connect to PostgreSQL if available
    try:
        e = create_engine(DEFAULT_PG_URL, connect_args={"connect_timeout": 1})
        with e.connect() as conn:
            conn.execute(text("SELECT 1"))
        Base.metadata.create_all(e)
        yield e
        Base.metadata.drop_all(e)
        return
    except Exception:
        pass

    # Fallback to SQLite in-memory for environments without a live PostgreSQL daemon
    from geoalchemy2 import Geometry
    from sqlalchemy.ext.compiler import compiles

    compiles(Geometry, "sqlite")(lambda type_, compiler, **kw: "BLOB")

    class DummyDialect:
        before_create = after_create = before_drop = after_drop = staticmethod(lambda *a, **k: None)

    import geoalchemy2.admin

    geoalchemy2.admin.select_dialect = lambda name: DummyDialect()

    from sqlalchemy import event

    e = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

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

    @event.listens_for(e, "connect")
    def register_sqlite_functions(dbapi_connection, connection_record):
        for fn_name in [
            "AsEWKB",
            "ST_AsBinary",
            "ST_GeomFromWKB",
            "ST_GeomFromEWKB",
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

    Base.metadata.create_all(e)
    yield e
    Base.metadata.drop_all(e)


@pytest.fixture
def db(engine):
    connection = engine.connect()
    transaction = connection.begin()
    session_factory = sessionmaker(
        bind=connection,
        expire_on_commit=False,
        join_transaction_mode="create_savepoint",
    )
    session = session_factory()

    yield session

    session.close()
    if transaction.is_active:
        transaction.rollback()
    connection.close()


@pytest.fixture
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client):
    """Register a test user and return auth headers."""
    res = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Test User",
            "email": f"test-{os.urandom(4).hex()}@darukaa.org",
            "password": "testpass123",
            "organization_name": "Test Org",
        },
    )
    assert res.status_code == 201
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
