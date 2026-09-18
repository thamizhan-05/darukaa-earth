from __future__ import annotations

import os
import time
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import engine, get_db
from app.core.dependencies import CurrentUser

router = APIRouter(prefix="/database", tags=["Database Explorer"])


class QueryRequest(BaseModel):
    query: str = Field(..., description="SQL Query to execute")
    limit: int = Field(100, ge=1, le=500, description="Max rows to return")


@router.get("/overview")
def get_database_overview(current_user: CurrentUser, db: Session = Depends(get_db)):
    """Returns database connection statistics, table names, and row counts."""
    is_sqlite = engine.url.drivername.startswith("sqlite")
    db_file_size_bytes = None
    db_path = str(engine.url.database) if is_sqlite else str(engine.url)

    if is_sqlite and engine.url.database:
        p = Path(engine.url.database)
        if not p.is_absolute():
            p = Path(os.getcwd()) / p
        if p.exists():
            db_file_size_bytes = p.stat().st_size
            db_path = str(p.resolve())

    # Get all application tables
    tables_data = []
    with engine.connect() as conn:
        if is_sqlite:
            query = text("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
            all_tables = [r[0] for r in conn.execute(query).fetchall()]
        else:
            query = text(
                "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"
            )
            all_tables = [r[0] for r in conn.execute(query).fetchall()]

        for tbl in all_tables:
            if tbl.startswith("sqlite_") or tbl == "spatial_ref_sys":
                continue

            # Row count
            cnt = conn.execute(text(f"SELECT COUNT(*) FROM {tbl};")).fetchone()
            count = cnt[0] if cnt else 0

            # Columns
            columns = []
            if is_sqlite:
                col_info = conn.execute(text(f"PRAGMA table_info({tbl});")).fetchall()
                columns = [{"name": c[1], "type": c[2], "pk": bool(c[5])} for c in col_info]
            else:
                col_query = text("""
                    SELECT column_name, data_type, (is_identity = 'YES') as is_pk
                    FROM information_schema.columns
                    WHERE table_name = :tbl AND table_schema = 'public'
                    ORDER BY ordinal_position;
                """)
                col_info = conn.execute(col_query, {"tbl": tbl}).fetchall()
                columns = [{"name": c[0], "type": c[1], "pk": bool(c[2])} for c in col_info]

            tables_data.append(
                {
                    "name": tbl,
                    "row_count": count,
                    "columns": columns,
                }
            )

    return {
        "engine": "SQLite" if is_sqlite else "PostgreSQL/PostGIS",
        "database_path": db_path,
        "file_size_bytes": db_file_size_bytes,
        "connection_url": f"sqlite:///{db_path}" if is_sqlite else "postgresql://.../darukaa",
        "tables": tables_data,
    }


@router.get("/tables/{table_name}")
def get_table_data(
    table_name: str,
    current_user: CurrentUser,
    offset: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Fetch paginated data rows from a specific table."""
    # Whitelist safety: only allow existing application tables
    valid_tables = {
        "users",
        "organizations",
        "organization_members",
        "projects",
        "sites",
        "observations",
        "observation_metrics",
        "audit_logs",
    }
    if table_name not in valid_tables:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or restricted table: {table_name}",
        )

    with engine.connect() as conn:
        count_res = conn.execute(text(f"SELECT COUNT(*) FROM {table_name};")).fetchone()
        total_rows = count_res[0] if count_res else 0

        res = conn.execute(
            text(f"SELECT * FROM {table_name} LIMIT :limit OFFSET :offset;"),
            {
                "limit": limit,
                "offset": offset,
            },
        )
        columns = list(res.keys())
        rows = [
            dict(zip(columns, [str(v) if v is not None else None for v in r], strict=False))
            for r in res.fetchall()
        ]

    return {
        "table": table_name,
        "total_rows": total_rows,
        "offset": offset,
        "limit": limit,
        "columns": columns,
        "rows": rows,
    }


@router.post("/query")
def execute_custom_query(
    payload: QueryRequest,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Execute a custom read/inspection query and return formatted results."""
    sql_trimmed = payload.query.strip()

    # Restrict dangerous write commands in the web console for safety
    restricted_keywords = ["DROP", "TRUNCATE", "ALTER", "GRANT", "REVOKE"]
    for word in restricted_keywords:
        if f" {word} " in f" {sql_trimmed.upper()} ":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Execution of '{word}' is restricted in web console. Use CLI scripts/db_cli.py for DDL operations.",
            )

    start_time = time.time()
    try:
        with engine.connect() as conn:
            res = conn.execute(text(sql_trimmed))
            elapsed_ms = round((time.time() - start_time) * 1000, 2)

            if res.returns_rows:
                columns = list(res.keys())
                raw_rows = res.fetchmany(payload.limit)
                rows = [
                    dict(
                        zip(
                            columns,
                            [str(v) if v is not None else None for v in r],
                            strict=False,
                        )
                    )
                    for r in raw_rows
                ]
                return {
                    "success": True,
                    "columns": columns,
                    "rows": rows,
                    "row_count": len(rows),
                    "execution_time_ms": elapsed_ms,
                }
            else:
                conn.commit()
                return {
                    "success": True,
                    "columns": [],
                    "rows": [],
                    "row_count": res.rowcount,
                    "execution_time_ms": elapsed_ms,
                    "message": f"Query executed successfully. Affected rows: {res.rowcount}",
                }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
