"""
Generates the official Word Document (.docx) required for the Darukaa.Earth
Full-Stack Developer Hackathon submission as per the evaluation guidelines.
"""
from __future__ import annotations

import os
from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn


def set_cell_background(cell, hex_color: str):
    tcPr = cell._element.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    tcPr.append(shd)


def generate_submission_docx():
    doc = Document()

    # Page setup - Standard 1 inch margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Style definitions
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Segoe UI'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(36, 41, 47)

    # Document Header / Brand
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(2)
    run_brand = title_p.add_run("DARUKAA.EARTH")
    run_brand.font.size = Pt(13)
    run_brand.font.bold = True
    run_brand.font.color.rgb = RGBColor(16, 185, 129)  # Emerald green

    run_sub = title_p.add_run("  |  Full-Stack Developer Hackathon Submission")
    run_sub.font.size = Pt(11)
    run_sub.font.color.rgb = RGBColor(100, 116, 139)

    # Main Title
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(6)
    h1.paragraph_format.space_after = Pt(14)
    run_h1 = h1.add_run("Geospatial Intelligence Platform for Carbon & Biodiversity")
    run_h1.font.size = Pt(20)
    run_h1.font.bold = True
    run_h1.font.color.rgb = RGBColor(15, 23, 42)

    # Callout Box / Summary Card
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    tbl.columns[0].width = Inches(6.5)
    c = tbl.cell(0, 0)
    set_cell_background(c, "F1F5F9")
    cp = c.paragraphs[0]
    cp.paragraph_format.space_before = Pt(6)
    cp.paragraph_format.space_after = Pt(6)
    c_run = cp.add_run(
        "Candidate Submission Document as per the official Darukaa.Earth Hackathon Challenge guidelines.\n"
        "This platform delivers full-stack multi-tenant geospatial analytics, interactive Mapbox GL polygon boundary "
        "drawing with geodetic area calculations, Chart.js time-series metrics, JWT authentication, automated pre-commit "
        "hooks (Husky + lint-staged), GitHub Actions CI/CD, and a built-in Web Database Explorer."
    )
    c_run.font.size = Pt(9.5)
    c_run.font.italic = True
    c_run.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # -------------------------------------------------------------
    # 1. Submission Deliverables & Links
    # -------------------------------------------------------------
    sec1 = doc.add_paragraph()
    r = sec1.add_run("1. Submission Links & Access Details")
    r.font.size = Pt(14)
    r.font.bold = True
    r.font.color.rgb = RGBColor(15, 23, 42)
    sec1.paragraph_format.space_before = Pt(12)
    sec1.paragraph_format.space_after = Pt(6)

    deliverables = [
        ("GitHub Repository Link", "https://github.com/selva/darukaa-earth (or your submitted repository URL)"),
        ("Live Demo URL", "http://localhost:5173 (Local) / Ready for 1-click deploy via render.yaml and vercel.json"),
        ("Documentation", "README.md and ARCHITECTURE.md in repository root"),
        ("API Documentation", "http://localhost:8000/docs (Interactive OpenAPI / Swagger UI)"),
    ]

    for label, val in deliverables:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        lbl_run = p.add_run(f"{label}: ")
        lbl_run.font.bold = True
        val_run = p.add_run(val)
        val_run.font.color.rgb = RGBColor(2, 132, 199)

    # -------------------------------------------------------------
    # Reviewer Access Grants
    # -------------------------------------------------------------
    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    p_access = doc.add_paragraph()
    p_access.paragraph_format.space_before = Pt(4)
    p_access.paragraph_format.space_after = Pt(4)
    r_acc = p_access.add_run("Repository Access Grants (Hiring Reviewers):")
    r_acc.font.bold = True

    reviewers = [
        "ankita.dasgupta@darukaa.com",
        "harsh.kumar@darukaa.com",
        "utkarsh.gauniyal@darukaa.com",
        "guneet.mutreja@darukaa.com",
    ]
    for rev in reviewers:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(f"• {rev} (Read & Review Access Granted)")
        r.font.color.rgb = RGBColor(71, 85, 105)

    # -------------------------------------------------------------
    # 2. Test Credentials & Clean State
    # -------------------------------------------------------------
    sec2 = doc.add_paragraph()
    r = sec2.add_run("2. Reviewer Test Credentials")
    r.font.size = Pt(14)
    r.font.bold = True
    r.font.color.rgb = RGBColor(15, 23, 42)
    sec2.paragraph_format.space_before = Pt(14)
    sec2.paragraph_format.space_after = Pt(6)

    p_cred = doc.add_paragraph()
    p_cred.paragraph_format.space_after = Pt(6)
    p_cred.add_run(
        "The application has been reset to a fresh state with a primary Administrator account. "
        "Reviewers can also self-register a new organization and user account on the /register screen."
    )

    cred_table = doc.add_table(rows=3, cols=3)
    cred_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cred_table.autofit = False

    col_widths = [Inches(1.8), Inches(2.5), Inches(2.2)]
    for row in cred_table.rows:
        for i, w in enumerate(col_widths):
            row.cells[i].width = w

    headers = ["Role", "Email", "Password"]
    for i, h in enumerate(headers):
        cell = cred_table.cell(0, i)
        set_cell_background(cell, "0F172A")
        p = cell.paragraphs[0]
        run = p.add_run(h)
        run.font.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)
        run.font.size = Pt(9.5)

    rows_data = [
        ("Primary Administrator", "admin@darukaa.earth", "admin1234"),
        ("Custom Registration", "Self-register via /register", "Any password"),
    ]

    for r_idx, (role, email, pwd) in enumerate(rows_data, start=1):
        row = cred_table.rows[r_idx]
        for c_idx, val in enumerate([role, email, pwd]):
            cell = row.cells[c_idx]
            if r_idx % 2 == 1:
                set_cell_background(cell, "F8FAFC")
            p = cell.paragraphs[0]
            run = p.add_run(val)
            run.font.size = Pt(9.5)

    # -------------------------------------------------------------
    # 3. High-Level Architecture Overview
    # -------------------------------------------------------------
    sec3 = doc.add_paragraph()
    r = sec3.add_run("3. High-Level System Architecture")
    r.font.size = Pt(14)
    r.font.bold = True
    r.font.color.rgb = RGBColor(15, 23, 42)
    sec3.paragraph_format.space_before = Pt(14)
    sec3.paragraph_format.space_after = Pt(6)

    arch_text = (
        "Darukaa.Earth follows a clean Modular Monolith architecture adhering to separation of concerns:\n"
        "• Frontend Layer: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query v5 for asynchronous server state, "
        "Mapbox GL JS v3 with custom Esri World Imagery high-resolution satellite tiles, and Chart.js v4 for time-series analytics.\n"
        "• API & Domain Layer: FastAPI (Python 3.11) with strictly typed Pydantic v2 schemas, JWT authentication (python-jose), "
        "and SlowAPI rate limiting.\n"
        "• Service & Repository Layer: Domain business logic handles spherical polygon validation, geodetic area calculations, "
        "Copernicus Sentinel STAC remote sensing feeds, and NASA FIRMS thermal wildfire telemetry.\n"
        "• Persistence Layer: PostgreSQL 16 + PostGIS 3.4 (with full SQLite compatibility for local zero-dependency testing) "
        "managed via SQLAlchemy 2.0 ORM and Alembic schema migrations."
    )
    p_arch = doc.add_paragraph()
    p_arch.paragraph_format.space_after = Pt(8)
    p_arch.add_run(arch_text)

    # -------------------------------------------------------------
    # 4. Database Schema Breakdown
    # -------------------------------------------------------------
    sec4 = doc.add_paragraph()
    r = sec4.add_run("4. Database Schema Breakdown")
    r.font.size = Pt(14)
    r.font.bold = True
    r.font.color.rgb = RGBColor(15, 23, 42)
    sec4.paragraph_format.space_before = Pt(12)
    sec4.paragraph_format.space_after = Pt(6)

    schema_tables = [
        ("organizations", "Multi-tenant tenant root. Contains UUID id, name, unique slug, timestamps."),
        ("users", "User credentials. Contains UUID id, email, bcrypt password_hash, full_name, is_active flag."),
        ("organization_members", "Tenancy junction. Maps user_id to organization_id with Role (OWNER, ADMIN, ANALYST, VIEWER)."),
        ("projects", "Conservation projects. Belongs to organization_id. Tracks project_type, status, date ranges."),
        ("sites", "Geographical sites. Belongs to project_id. Stores PostGIS MultiPolygon SRID 4326 geometry and area_hectares."),
        ("observations", "Temporal sampling points. Belongs to site_id with observed_at datetime, data source, and audit trail."),
        ("observation_metrics", "Ecological values. Metric type (CARBON_STOCK, BIODIVERSITY_INDEX, NDVI, etc.), value, unit."),
        ("audit_logs", "Security and operational event log with user, organization, action, and JSON metadata."),
    ]

    for tbl_name, desc in schema_tables:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        r_t = p.add_run(f"{tbl_name}: ")
        r_t.font.bold = True
        r_d = p.add_run(desc)
        r_d.font.size = Pt(9.5)

    # -------------------------------------------------------------
    # 5. Pre-Commit Hooks & CI/CD Pipeline
    # -------------------------------------------------------------
    sec5 = doc.add_paragraph()
    r = sec5.add_run("5. Code Quality & CI/CD Pipeline (Crucial Requirement)")
    r.font.size = Pt(14)
    r.font.bold = True
    r.font.color.rgb = RGBColor(15, 23, 42)
    sec5.paragraph_format.space_before = Pt(12)
    sec5.paragraph_format.space_after = Pt(6)

    p_cicd = doc.add_paragraph()
    p_cicd.paragraph_format.space_after = Pt(6)
    p_cicd.add_run(
        "To ensure uncompromising code standards across the full stack:\n"
        "• Pre-Commit Hooks: Configured using Husky and lint-staged in the repository root. Before every commit, "
        "lint-staged automatically formats TypeScript and React code using Prettier, validates lint rules with ESLint, "
        "and formats/lints Python code using Ruff.\n"
        "• Backend GitHub Actions (backend-ci.yml): Spins up a live postgis/postgis:16-3.4 Docker container service, runs Ruff "
        "format and check validation, and executes full pytest test suites with coverage reporting.\n"
        "• Frontend GitHub Actions (frontend-ci.yml): Installs dependencies with npm ci, runs ESLint across all files, performs "
        "strict TypeScript compilation (tsc --noEmit), builds production Vite bundles, and executes Vitest component tests."
    )

    # -------------------------------------------------------------
    # 6. Local Setup Instructions
    # -------------------------------------------------------------
    sec6 = doc.add_paragraph()
    r = sec6.add_run("6. Local Environment Setup")
    r.font.size = Pt(14)
    r.font.bold = True
    r.font.color.rgb = RGBColor(15, 23, 42)
    sec6.paragraph_format.space_before = Pt(12)
    sec6.paragraph_format.space_after = Pt(6)

    setup_p = doc.add_paragraph()
    setup_p.add_run(
        "Option A: Quick Native Run\n"
        "1. Backend: cd backend && py -3.11 -m uvicorn app.main:app --port 8000\n"
        "2. Frontend: cd frontend && npm run dev (Access at http://localhost:5173)\n\n"
        "Option B: Docker Compose (PostGIS + FastAPI + React)\n"
        "1. docker-compose up --build\n"
        "2. Database CLI Tool: py -3.11 backend/scripts/db_cli.py --interactive\n"
        "3. Database Reset Tool: py -3.11 backend/scripts/reset_db.py\n"
    )
    setup_p.paragraph_format.space_after = Pt(12)

    # Output path
    output_path = Path(__file__).parent.parent.parent / "DARUKAA_EARTH_SUBMISSION.docx"
    doc.save(str(output_path))
    print(f"Generated submission document successfully: {output_path}")
    return output_path


if __name__ == "__main__":
    generate_submission_docx()
