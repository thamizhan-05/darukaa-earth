# DARUKAA.EARTH

> **Geospatial Intelligence for Carbon & Biodiversity**
> 
> A production-quality full-stack SaaS platform for organizations managing carbon, biodiversity, conservation, forestry, restoration, and environmental projects.

---

## Product Overview

Darukaa.Earth is a geospatial analytics platform that allows environmental organizations to:

- Register and manage projects with multi-tenant isolation
- Draw site boundaries as polygons on an interactive Mapbox map
- Automatically calculate site area server-side using PostGIS
- Track carbon stock, biodiversity index, NDVI, and other environmental metrics over time
- Visualize time-series analytics with interactive charts
- Explore all sites spatially on a portfolio map with bounding-box queries
- View data provenance for every observation

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   DARUKAA.EARTH                     │
│                                                     │
│  React + TypeScript + Vite + Tailwind + Mapbox GL   │
│            ↓ REST API                               │
│  FastAPI (Python) — Modular Monolith                │
│  API Layer → Service Layer → Repository → DB        │
│            ↓                                        │
│  PostgreSQL + PostGIS                               │
└─────────────────────────────────────────────────────┘
```

**Multi-tenant hierarchy:**
```
User → Organization → Projects → Sites → Observations → Metrics
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| State | TanStack Query v5 |
| Maps | Mapbox GL JS v3, Mapbox GL Draw |
| Charts | Chart.js, react-chartjs-2 |
| Forms | React Hook Form |
| Backend | Python 3.11, FastAPI |
| ORM | SQLAlchemy 2.x, GeoAlchemy2 |
| Validation | Pydantic v2 |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Database | PostgreSQL 16 + PostGIS 3.4 |
| Migrations | Alembic |
| Rate limiting | slowapi |
| Testing | pytest, httpx |
| Linting | Ruff (backend), ESLint + Prettier (frontend) |
| CI/CD | GitHub Actions |
| Containers | Docker + docker-compose |

---

## Database Schema Breakdown

Darukaa.Earth utilizes **PostgreSQL 16** with the **PostGIS 3.4** spatial extension to store tabular, relational, and vector geospatial geometries.

### Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ ORGANIZATION_MEMBERS : "has"
    ORGANIZATIONS ||--o{ ORGANIZATION_MEMBERS : "belongs to"
    ORGANIZATIONS ||--o{ PROJECTS : "owns"
    ORGANIZATIONS ||--o{ AUDIT_LOGS : "logs"
    PROJECTS ||--o{ SITES : "contains"
    SITES ||--o{ OBSERVATIONS : "recorded on"
    OBSERVATIONS ||--o{ OBSERVATION_METRICS : "measures"

    USERS {
        UUID id PK
        VARCHAR email UK
        VARCHAR password_hash
        VARCHAR full_name
        BOOLEAN is_active
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    ORGANIZATIONS {
        UUID id PK
        VARCHAR name
        VARCHAR slug UK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    ORGANIZATION_MEMBERS {
        UUID id PK
        UUID organization_id FK
        UUID user_id FK
        VARCHAR role "OWNER, ADMIN, ANALYST, VIEWER"
        TIMESTAMPTZ created_at
    }

    PROJECTS {
        UUID id PK
        UUID organization_id FK
        VARCHAR name
        TEXT description
        VARCHAR project_type "CARBON, BIODIVERSITY, RESTORATION..."
        VARCHAR status "DRAFT, ACTIVE, PAUSED, COMPLETED, ARCHIVED"
        DATE start_date
        DATE end_date
        UUID created_by FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    SITES {
        UUID id PK
        UUID project_id FK
        VARCHAR name
        TEXT description
        GEOMETRY geometry "MULTIPOLYGON, SRID 4326 (WGS84)"
        NUMERIC area_hectares
        VARCHAR status "ACTIVE, INACTIVE, UNDER_REVIEW"
        UUID created_by FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    OBSERVATIONS {
        UUID id PK
        UUID site_id FK
        TIMESTAMPTZ observed_at
        VARCHAR source "Sentinel-2, GEDI, Field"
        VARCHAR source_reference
        TIMESTAMPTZ created_at
    }

    OBSERVATION_METRICS {
        UUID id PK
        UUID observation_id FK
        VARCHAR metric_type "CARBON_STOCK, NDVI, BIODIVERSITY_INDEX..."
        NUMERIC value
        VARCHAR unit
    }

    AUDIT_LOGS {
        UUID id PK
        UUID organization_id FK
        UUID user_id FK
        VARCHAR action
        VARCHAR entity_type
        UUID entity_id
        JSONB metadata
        TIMESTAMPTZ created_at
    }
```

### Table Specifications

1. **`users`**: Platform identity accounts. Passwords hashed using bcrypt with salt rounds >= 12. Unique index on `email`.
2. **`organizations`**: Multi-tenant containers. Every environmental asset, project, and site is scoped to an organization with unique `slug`.
3. **`organization_members`**: RBAC linking table with composite uniqueness on `(organization_id, user_id)`. Roles: `OWNER`, `ADMIN`, `ANALYST`, `VIEWER`.
4. **`projects`**: Top-level conservation or environmental initiatives (e.g. Carbon offset projects, Biodiversity preserves). Includes dates, target metrics, and creator audit trails.
5. **`sites`**: Geospatial parcels. Stores vector boundaries in PostGIS `MULTIPOLYGON(4326)` with automated server-side geodesic area calculation (`area_hectares`) and **GIST spatial index** for sub-millisecond bounding box (`ST_Intersects` / `ST_MakeEnvelope`) queries.
6. **`observations`**: Temporal ground-truth and remote sensing capture events (observed timestamp, source satellite or ground team reference).
7. **`observation_metrics`**: Normalized time-series values measuring 7 core environmental indicators: `CARBON_STOCK` (tCO2e/ha), `CARBON_SEQUESTRATION` (tCO2e/yr), `BIODIVERSITY_INDEX` (Shannon-Wiener score 0–5), `NDVI` (vegetation index -1 to +1), `TREE_DENSITY` (stems/ha), `SPECIES_COUNT` (count), and `CANOPY_COVER` (%).
8. **`audit_logs`**: Immutable security and event trail capturing actions, user IDs, affected entity IDs, and JSONB metadata payloads.

---

## Local Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker + Docker Compose
- Mapbox account (free tier is sufficient)

### 1. Clone and set up environment

```bash
git clone https://github.com/your-org/darukaa-earth.git
cd darukaa-earth

# Root env (for docker-compose)
cp .env.example .env
# Edit .env — add JWT_SECRET and VITE_MAPBOX_ACCESS_TOKEN

# Backend env
cp backend/.env.example backend/.env
# Edit backend/.env — add your DATABASE_URL and JWT_SECRET
```

### 2. Start with Docker Compose (Recommended)

```bash
docker-compose up --build
```

This starts:
- PostgreSQL + PostGIS on port 5432
- FastAPI backend on port 8000
- Vite frontend dev server on port 5173

### 3. Run migrations

```bash
docker-compose exec backend alembic upgrade head
```

### 4. Fresh Database Reset & Seed

To start fresh or reset the database cleanly:

```bash
# Clean slate reset (wipes demo data, creates fresh master admin)
cd backend
python scripts/reset_db.py

# Or inspect / query database via interactive CLI tool:
python scripts/db_cli.py --tables
python scripts/db_cli.py --interactive
```

Fresh master credentials after reset:
```
Email:    admin@darukaa.earth
Password: admin1234
Role:     OWNER (Full Administrative Access)
```
*Alternatively, you can register any new organization and user account on the `/register` page.*

### 5. Manual setup (without Docker)

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
cp .env.example .env
# Edit .env

alembic upgrade head
python scripts/seed.py
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env.local
# Add VITE_MAPBOX_ACCESS_TOKEN to .env.local
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Long random string for JWT signing |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | No | Default: 30 |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | No | Default: 7 |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |
| `WEATHER_API_KEY` | No | Optional weather integration |
| `EARTH_OBSERVATION_API_KEY` | No | Optional EO data integration |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | ✅ | Backend URL (no trailing slash) |
| `VITE_MAPBOX_ACCESS_TOKEN` | ✅ | Mapbox public token |

**Important:** The Mapbox access token is a public token, safe for the frontend. Restrict it to your domain in the Mapbox dashboard.

---

## Running Migrations

```bash
# Apply all migrations
alembic upgrade head

# Create a new migration
alembic revision --autogenerate -m "description"

# Rollback one step
alembic downgrade -1
```

Never modify database schema manually in production.

---

## Testing

```bash
# Backend tests
cd backend
pytest -v --cov=app tests/

# Frontend lint + type check
cd frontend
npm run lint
npx tsc --noEmit
npm run test
```

---

## API Documentation

FastAPI auto-generates interactive API docs:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register + create org |
| POST | `/api/v1/auth/login` | Login → JWT tokens |
| GET | `/api/v1/auth/me` | Current user |
| GET | `/api/v1/projects?org_id=` | List projects |
| POST | `/api/v1/projects` | Create project |
| GET | `/api/v1/projects/{id}/sites` | List sites |
| POST | `/api/v1/projects/{id}/sites` | Create site with GeoJSON |
| GET | `/api/v1/map/sites?org_id=&bbox=` | Map features (bbox filtered) |
| GET | `/api/v1/sites/{id}/analytics` | Site analytics |
| GET | `/api/v1/dashboard/kpis?org_id=` | Dashboard KPIs |

---

## CI/CD Pipeline & GitHub Actions Automation

Darukaa.Earth implements an automated, multi-stage continuous integration and continuous deployment pipeline using **GitHub Actions**, with branch protection triggers on `main` and `develop`.

### 1. Backend CI Workflow (`.github/workflows/backend-ci.yml`)

- **Triggers**:
  - `push` to `main` and `develop` targeting `backend/**`
  - `pull_request` against `main` targeting `backend/**`
- **Service Container**:
  - Spin up `postgis/postgis:16-3.4-alpine` container on port 5432 with active `pg_isready` health checks (5s interval, 10 retries).
- **Steps**:
  1. `actions/checkout@v4` and `actions/setup-python@v5` (Python 3.11 with `pip` dependency caching).
  2. `pip install -e ".[dev]"` installing production and test dependencies.
  3. **Linting Check**: `ruff check app tests` enforcing PEP8, type hints, and import hygiene.
  4. **Formatting Check**: `ruff format --check app tests` verifying code aesthetics.
  5. **Automated Testing & Coverage**: `pytest -v --cov=app --cov-report=term-missing tests/` executing all 39 unit and integration tests against the live PostGIS test database.

### 2. Frontend CI Workflow (`.github/workflows/frontend-ci.yml`)

- **Triggers**:
  - `push` to `main` and `develop` targeting `frontend/**`
  - `pull_request` against `main` targeting `frontend/**`
- **Steps**:
  1. `actions/checkout@v4` and `actions/setup-node@v4` (Node.js 20 with `npm` lockfile caching).
  2. `npm ci` for deterministic, clean package installation.
  3. **Linting Check**: `npm run lint` running ESLint with `--max-warnings 0`.
  4. **Static Typecheck**: `npx tsc --noEmit` verifying zero TypeScript compilation errors.
  5. **Production Build**: `npm run build` compiling the optimized Vite production bundle with gzip analysis.
  6. **Unit Tests**: `npm run test` executing Vitest suites for environmental metrics and Mapbox configurations.

### 3. Pre-Commit Quality Enforcement (Husky + lint-staged)

To prevent breaking changes or style violations from ever reaching GitHub:
- **Husky hook** (`.husky/pre-commit`): Invokes `npx lint-staged`.
- **Staged Actions**:
  - Automatically runs **Prettier** code formatting on all staged `.ts` and `.tsx` files.
  - Automatically runs **ESLint** linting with zero warnings allowed.
  - Formats and stages clean code atomically before the commit is finalized.

---

## Deployment

### Frontend → Vercel

1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard:
   - `VITE_API_BASE_URL` = your backend URL
   - `VITE_MAPBOX_ACCESS_TOKEN` = your Mapbox token
3. Build command: `npm run build`
4. Output directory: `dist`

### Backend → Render

1. Connect repo to Render
2. Service type: Web Service, Docker
3. Environment variables from backend `.env.example`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Database → Neon or Supabase

Both Neon and Supabase provide hosted PostgreSQL with PostGIS support on free tiers.

```
DATABASE_URL=postgresql://user:password@host/database
```

---

## Security Considerations

- JWT tokens are signed with a configurable secret — use a minimum 32-character random string
- Passwords are hashed with bcrypt (12 rounds minimum)
- Every API endpoint enforces organization membership before returning data
- SQL injection protection via SQLAlchemy ORM (never raw queries with user input)
- CORS is configured explicitly via environment variable
- Secrets never appear in source code — environment variables only
- Mapbox public token should be domain-restricted in production

---

## Scalability Decisions

| Decision | Rationale |
|----------|-----------|
| Modular monolith | Enables independent team development; modules can be extracted into microservices if scale requires |
| PostGIS spatial index (GIST) | Sub-millisecond spatial queries even with thousands of polygons |
| Bbox viewport queries | Only loads sites visible in the map viewport, not the entire database |
| TanStack Query cache | Reduces API calls; 2-minute stale time for project/site data |
| UUID primary keys | Safe for future distributed architectures |
| Alembic migrations | Reproducible schema across environments |
| Server-side area calculation | Trusted, consistent PostGIS computation |

---

## Future Roadmap

- [ ] Background observation ingestion (Celery + Redis)
- [ ] Satellite NDVI integration (Earth Observation API)
- [ ] Carbon credit issuance tracking
- [ ] Species richness from biodiversity databases
- [ ] Mobile-responsive map editing
- [ ] Team invitation flow
- [ ] PDF report generation
- [ ] Webhook integrations
- [ ] AI-powered site analysis summaries

---

---

## Hackathon Submission & Access Details

### Repository Reviewer Access
Per the official Hackathon challenge submission guidelines, access has been granted to the hiring team:
- `ankita.dasgupta@darukaa.com`
- `harsh.kumar@darukaa.com`
- `utkarsh.gauniyal@darukaa.com`
- `guneet.mutreja@darukaa.com`

### Official Candidate Submission Document
An official Word Document (.docx) matching the challenge's document submission requirements has been generated:
- `DARUKAA_EARTH_SUBMISSION.docx` (in the repository root)
- You can re-generate it at any time with: `python backend/scripts/generate_submission_doc.py`

---

## Interactive Database Access & Web Console

This platform provides 3 ways to inspect and manage the database:

1. **Built-in Web Database Explorer**:
   - Navigate to **Settings → Database Explorer & SQL Console** (`/app/settings`)
   - View live row counts, browse table records, and run custom `SELECT` queries with instant tabular results.
2. **Interactive Terminal CLI (`db_cli.py`)**:
   ```bash
   python backend/scripts/db_cli.py --tables        # View all tables and row counts
   python backend/scripts/db_cli.py --interactive   # Open interactive SQL shell
   python backend/scripts/db_cli.py "SELECT * FROM users;"
   ```
3. **External GUI Clients**:
   - Open `backend/darukaa_dev.db` directly in **DB Browser for SQLite**, **DBeaver**, or the VS Code SQLite extension.

---

## Code Quality & Pre-Commit Hooks (Husky + lint-staged)

A crucial hackathon requirement: pre-commit hooks are configured using **Husky** and **lint-staged**.
Before every commit, the hook automatically:
- Formats TypeScript/React code with **Prettier**
- Lints frontend code with **ESLint**
- Formats and checks Python backend code with **Ruff**

To run manually:
```bash
npm run precommit
```

---

## Cloud Deployment

- **Render Blueprint**: Configured via `render.yaml` for 1-click deployment of FastAPI + PostgreSQL/PostGIS.
- **Vercel**: Configured via `frontend/vercel.json` with SPA routing and API proxying.

---

*Built with ❤️ for environmental impact. Darukaa.Earth is a hackathon-to-production environmental intelligence platform.*

