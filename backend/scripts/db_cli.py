"""
Darukaa.Earth — Interactive Database CLI Utility
Enables direct querying, table inspection, schema dumping,
and interactive SQL shell for developers and reviewers.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import engine
from sqlalchemy import text


def format_table(headers: list[str], rows: list[tuple]) -> str:
    if not rows:
        return "  (No rows returned)"

    col_widths = [len(h) for h in headers]
    str_rows = []
    for r in rows:
        str_r = [str(val) if val is not None else "NULL" for val in r]
        str_rows.append(str_r)
        for i, val in enumerate(str_r):
            if len(val) > col_widths[i]:
                col_widths[i] = min(len(val), 50)  # cap at 50 chars for formatting

    # Header line
    header_line = " | ".join(h.ljust(col_widths[i]) for i, h in enumerate(headers))
    separator = "-+-".join("-" * col_widths[i] for i in range(len(headers)))
    
    lines = [header_line, separator]
    for str_r in str_rows:
        row_line = " | ".join(str_r[i][:50].ljust(col_widths[i]) for i in range(len(headers)))
        lines.append(row_line)
    return "\n".join(lines)


def list_tables():
    print("\nDatabase Engine :", engine.url)
    print("-" * 60)
    with engine.connect() as conn:
        if engine.url.drivername.startswith("sqlite"):
            query = text("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
            tables = [r[0] for r in conn.execute(query).fetchall()]
        else:
            query = text("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;")
            tables = [r[0] for r in conn.execute(query).fetchall()]

        table_data = []
        for t in tables:
            if t.startswith("sqlite_") or t == "spatial_ref_sys":
                continue
            count_res = conn.execute(text(f"SELECT COUNT(*) FROM {t};")).fetchone()
            count = count_res[0] if count_res else 0
            table_data.append((t, count))

        print(format_table(["Table Name", "Row Count"], table_data))
        print()


def show_schema(table_name: str | None = None):
    with engine.connect() as conn:
        if engine.url.drivername.startswith("sqlite"):
            if table_name:
                query = text("SELECT sql FROM sqlite_master WHERE type='table' AND name = :tbl;")
                res = conn.execute(query, {"tbl": table_name}).fetchone()
                if res and res[0]:
                    print(f"\nSchema for '{table_name}':\n{res[0]}\n")
                else:
                    print(f"Table '{table_name}' not found.")
            else:
                query = text("SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name;")
                for r in conn.execute(query).fetchall():
                    if r[0].startswith("sqlite_") or r[0] == "spatial_ref_sys":
                        continue
                    print(f"\n--- Table: {r[0]} ---\n{r[1]}")
        else:
            print("PostgreSQL schema inspection:")
            # Information schema columns
            q = text("""
                SELECT table_name, column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public'
                ORDER BY table_name, ordinal_position;
            """)
            rows = conn.execute(q).fetchall()
            print(format_table(["Table", "Column", "Data Type", "Nullable"], rows))


def execute_query(sql: str):
    print(f"\nExecuting: {sql}\n")
    with engine.connect() as conn:
        res = conn.execute(text(sql))
        if res.returns_rows:
            headers = list(res.keys())
            rows = res.fetchall()
            print(format_table(headers, rows))
            print(f"\n({len(rows)} rows returned)\n")
        else:
            conn.commit()
            print(f"Query executed successfully. Affected rows: {res.rowcount}\n")


def interactive_shell():
    print("=" * 60)
    print(" DARUKAA.EARTH — INTERACTIVE DATABASE SHELL")
    print(f" Connected to: {engine.url}")
    print(" Type your SQL query and hit Enter. Type 'exit' or 'quit' to exit.")
    print("=" * 60)

    while True:
        try:
            query = input("darukaa-db> ").strip()
            if not query:
                continue
            if query.lower() in ("exit", "quit", "q"):
                print("Exiting database shell. Goodbye!")
                break
            if query.lower() == "\\dt" or query.lower() == "tables":
                list_tables()
                continue
            execute_query(query)
        except (KeyboardInterrupt, EOFError):
            print("\nExiting database shell.")
            break
        except Exception as e:
            print(f"Error: {e}\n")


def main():
    parser = argparse.ArgumentParser(description="Darukaa.Earth Database CLI")
    parser.add_argument("query", nargs="?", help="SQL query to execute directly")
    parser.add_argument("--tables", "-t", action="store_true", help="List all tables and row counts")
    parser.add_argument("--schema", "-s", nargs="?", const="ALL", help="Show CREATE TABLE schema")
    parser.add_argument("--interactive", "-i", action="store_true", help="Launch interactive SQL shell")

    args = parser.parse_args()

    if args.tables:
        list_tables()
    elif args.schema:
        show_schema(None if args.schema == "ALL" else args.schema)
    elif args.interactive or (not args.query and not args.tables and not args.schema):
        if len(sys.argv) == 1:
            list_tables()
            print("\nTip: Run with --interactive for an interactive SQL prompt, or pass a query:")
            print("     python scripts/db_cli.py \"SELECT * FROM users;\"\n")
        else:
            interactive_shell()
    elif args.query:
        execute_query(args.query)


if __name__ == "__main__":
    main()
