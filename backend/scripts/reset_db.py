"""
Darukaa.Earth — Clean Slate Database Reset Script
Wipes all demo data, resets table sequences, vacua SQLite database,
and seeds an initial clean Administrator account and workspace.
"""
from __future__ import annotations

import argparse
import sys
import os
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal, engine, Base
from app.core.security import hash_password
from app.models.organization import Organization
from app.models.user import User
from app.models.organization_member import OrganizationMember, Role
from app.models.project import Project
from app.models.site import Site
from app.models.observation import Observation
from app.models.observation_metric import ObservationMetric
from app.models.audit_log import AuditLog
from sqlalchemy import text


def reset_database(create_admin: bool = True):
    print("=" * 60)
    print(" DARUKAA.EARTH — DATABASE CLEAN RESET")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Disable foreign keys in SQLite for clean truncation
        is_sqlite = engine.url.drivername.startswith("sqlite")
        if is_sqlite:
            db.execute(text("PRAGMA foreign_keys = OFF;"))

        # Truncate tables in reverse topological order
        tables_to_clear = [
            ("observation_metrics", ObservationMetric),
            ("observations", Observation),
            ("sites", Site),
            ("projects", Project),
            ("audit_logs", AuditLog),
            ("organization_members", OrganizationMember),
            ("users", User),
            ("organizations", Organization),
        ]

        print("\n--> Purging all existing records...")
        for table_name, model in tables_to_clear:
            count = db.query(model).delete()
            print(f"    [CLEARED] {table_name}: {count} records removed")

        db.commit()

        if is_sqlite:
            db.execute(text("PRAGMA foreign_keys = ON;"))
            db.commit()
            print("--> Running VACUUM...")
            # Note: VACUUM cannot run in a transaction block
            raw_conn = engine.raw_connection()
            raw_conn.execute("VACUUM;")
            raw_conn.close()

        if create_admin:
            print("\n--> Initializing Clean Master Administrator Account...")
            # Create primary organization
            org = Organization(
                name="Darukaa Earth Global Workspace",
                slug="darukaa-global",
            )
            db.add(org)
            db.flush()

            # Create master admin user
            admin_user = User(
                email="admin@darukaa.earth",
                full_name="Darukaa Administrator",
                password_hash=hash_password("admin1234"),
                is_active=True,
            )
            db.add(admin_user)
            db.flush()

            # Link user as OWNER
            member = OrganizationMember(
                organization_id=org.id,
                user_id=admin_user.id,
                role=Role.OWNER,
            )
            db.add(member)
            db.commit()

            print("    [CREATED] Organization : Darukaa Earth Global Workspace")
            print("    [CREATED] Admin Email  : admin@darukaa.earth")
            print("    [CREATED] Password     : admin1234")
            print("    [CREATED] Role         : OWNER (Full Administrative Access)")
        else:
            print("\n--> Database left 100% empty. Register new account on /register")

        print("\n--> Database successfully reset! Ready for fresh real data.\n")
    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Database reset failed: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reset Darukaa.Earth database to a clean slate.")
    parser.add_argument("--empty", action="store_true", help="Leave completely empty without admin account")
    args = parser.parse_args()
    reset_database(create_admin=not args.empty)
