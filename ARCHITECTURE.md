# DARUKAA.EARTH — Technical Architecture Document

> **Platform:** Geospatial Intelligence for Carbon & Biodiversity  
> **System Architecture:** Modular Monolith (FastAPI + PostgreSQL/PostGIS + React/Vite/Mapbox)  
> **Target Audience:** Conservation NGOs, Carbon Project Developers, Forestry Trusts, Verification Bodies

---

## 1. System Architecture

```
                               ┌────────────────────────────────────────┐
                               │             Client Tier                │
                               │  React 18 + Vite + TypeScript          │
                               │  Tailwind CSS + Lucide Icons           │
                               │  Mapbox GL JS v3 + Mapbox GL Draw      │
                               │  Chart.js / react-chartjs-2            │
                               │  TanStack Query v5 + Context API       │
                               └──────────────────┬─────────────────────┘
                                                  │
                                                  │ HTTPS / REST (JSON)
                                                  │ JWT Bearer Auth
                                                  ▼
                               ┌────────────────────────────────────────┐
                               │           Application Tier             │
                               │  FastAPI (Python 3.11)                 │
                               │                                        │
                               │  ┌──────────────────────────────────┐  │
                               │  │ API Routing & Auth Middleware    │  │
                               │  │ Rate Limiter (SlowAPI)           │  │
                               │  └─────────────────┬────────────────┘  │
                               │                    │                   │
                               │  ┌─────────────────▼────────────────┐  │
                               │  │ Business Service Layer           │  │
                               │  │ (Auth, Project, Site,            │  │
                               │  │  Analytics, Audit, Spatial Ops)  │  │
                               │  └─────────────────┬────────────────┘  │
                               │                    │                   │
                               │  ┌─────────────────▼────────────────┐  │
                               │  │ External Integrations Layer      │  │
                               │  │ (WeatherProvider, EOProvider)    │  │
                               │  │ * Adapter Pattern with Fallback  │  │
                               │  └─────────────────┬────────────────┘  │
                               │                    │                   │
                               │  ┌─────────────────▼────────────────┐  │
                               │  │ Data Access Layer (SQLAlchemy)   │  │
                               │  │ GeoAlchemy2 Spatial Extensions   │  │
                               │  └─────────────────┬────────────────┘  │
                               └────────────────────┼───────────────────┘
                                                    │
                                                    │ SQL (TCP 5432)
                                                    ▼
                               ┌────────────────────────────────────────┐
                               │             Data Tier                  │
                               │  PostgreSQL 16 + PostGIS 3.4           │
                               │                                        │
                               │  - Organizations & Users (Tenancy)     │
                               │  - Projects & Sites (Spatial Table)    │
                               │  - Observations & ObservationMetrics   │
                               │  - Audit Logs (JSONB Metadata)         │
                               │  - GiST Spatial Index on Geometries    │
                               └────────────────────────────────────────┘
```

### Multi-Tenancy Design
- **Tenant Scope:** Every project, site, and observation belongs to an `Organization`.
- **User Roles:** `OWNER`, `ADMIN`, `MEMBER`, `VIEWER` configured via `OrganizationMember`.
- **Query Isolation:** All spatial and analytical queries strictly filter by `organization_id` or join through parent project to enforce strict tenant boundary security.

---

## 2. Folder Structure

```
darukaa-earth/
├── .env.example                     # Root environment configuration
├── .gitignore                       # Repository-wide ignore rules
├── docker-compose.yml               # Production & local multi-container stack
├── README.md                        # Documentation & setup guide
├── ARCHITECTURE.md                  # This technical specification
│
├── backend/                         # FastAPI Application
│   ├── Dockerfile                   # Python 3.11-slim container
│   ├── pyproject.toml               # Poetry/pip dependencies & tool configs
│   ├── alembic.ini                  # Migration configuration
│   ├── alembic/
│   │   ├── env.py                   # Migration environment harness
│   │   └── versions/
│   │       └── 0001_initial_schema.py # Complete database schema DDL
│   ├── app/
│   │   ├── main.py                  # ASGI entrypoint, CORS, exception handlers
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic Settings & env parsing
│   │   │   ├── database.py          # SQLAlchemy engine, sessionmaker, Base
│   │   │   ├── dependencies.py      # FastAPI auth & session dependencies
│   │   │   ├── security.py          # JWT creation/verification & bcrypt
│   │   │   └── audit.py             # Global audit logging helper
│   │   ├── models/                  # SQLAlchemy declarative models
│   │   │   ├── user.py              # User entity
│   │   │   ├── organization.py      # Organization entity
│   │   │   ├── organization_member.py # Role mapping
│   │   │   ├── project.py           # Project entity
│   │   │   ├── site.py              # Site entity with PostGIS MULTIPOLYGON
│   │   │   ├── observation.py       # Environmental observation records
│   │   │   ├── observation_metric.py# Metrics (Carbon, Bio, NDVI, etc.)
│   │   │   └── audit_log.py         # System audit trail
│   │   ├── schemas/                 # Pydantic v2 request/response schemas
│   │   ├── services/                # Encapsulated business domain services
│   │   │   ├── auth_service.py
│   │   │   ├── project_service.py
│   │   │   ├── site_service.py      # Spatial transforms & area calculation
│   │   │   └── analytics_service.py # Time-series aggregation & KPIs
│   │   ├── integrations/            # External data providers (Adapter Pattern)
│   │   │   ├── weather/             # WeatherProvider, Mock & OpenWeather
│   │   │   └── earth_observation/   # EOProvider, Mock & Sentinel-Hub
│   │   └── api/v1/                  # REST API Endpoints
│   │       ├── router.py            # Master v1 API aggregator
│   │       ├── auth.py              # Registration, Login, Token Refresh
│   │       ├── organizations.py     # Organization management & members
│   │       ├── projects.py          # Project CRUD
│   │       ├── sites.py             # Site polygon management & area
│   │       ├── observations.py      # Observation ingestion & listing
│   │       ├── analytics.py         # Site, Project, & Dashboard KPIs
│   │       ├── environmental.py     # Weather & EO satellite telemetry
│   │       └── map.py               # Spatial bounding-box queries
│   ├── scripts/
│   │   └── seed.py                  # Realistic demo seeder (Western Ghats, etc.)
│   └── tests/                       # Unit & integration test suite
│
└── frontend/                        # React Single Page Application
    ├── package.json                 # Dependencies & scripts
    ├── vite.config.ts               # Vite bundler configuration
    ├── tailwind.config.ts           # Design tokens, color palette, glassmorphism
    ├── tsconfig.json                # TypeScript compiler configuration
    └── src/
        ├── main.tsx                 # Root DOM mount & QueryClientProvider
        ├── App.tsx                  # Router provider & AuthProvider wrapper
        ├── index.css                # Global Tailwind CSS, custom utilities, fonts
        ├── context/
        │   └── AuthContext.tsx      # Auth state, login/logout, active org
        ├── routes/
        │   ├── index.tsx            # Route declarations & lazy-loading
        │   └── ProtectedRoute.tsx   # Auth guard with redirect
        ├── services/                # Axios API communication clients
        │   ├── api.ts               # Interceptors, token injection, error handling
        │   ├── auth.ts              # Auth API calls
        │   ├── projects.ts          # Project API calls
        │   ├── sites.ts             # Site & spatial API calls
        │   └── analytics.ts         # Analytics & observation API calls
        ├── types/                   # TypeScript interfaces & enums
        ├── components/
        │   ├── layout/              # AppShell, Sidebar, TopBar
        │   ├── ui/                  # Button, Modal, Badge, Input, Card
        │   ├── map/                 # MapGL (Mapbox GL JS), DrawControl
        │   ├── dashboard/           # KPICard, ActivityFeed, MetricsSummary
        │   ├── projects/            # ProjectCard, CreateProjectModal
        │   ├── sites/               # AddSiteModal
        │   ├── observations/        # AddObservationModal
        │   └── charts/              # TimeSeriesChart
        └── pages/                   # Application views
            ├── Landing/             # High-conversion product overview
            ├── Login/               # Authentication screen
            ├── Register/            # Onboarding & organization setup
            ├── Dashboard/           # Executive portfolio overview & map
            ├── Projects/            # Project management & filtering
            ├── ProjectDetails/      # Project geospatial view & sites list
            ├── SiteDetails/         # Deep-dive analytics, observations & charts
            ├── MapExplorer/         # Fullscreen GIS map exploration
            ├── Analytics/           # Portfolio-wide aggregation
            └── Settings/            # Org profile, API configuration & audit log
```

---

## 3. Database Schema & ERD

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│              users              │       │          organizations          │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ id: UUID [PK]                   │       │ id: UUID [PK]                   │
│ email: VARCHAR(255) [UNIQUE]    │       │ name: VARCHAR(255)              │
│ full_name: VARCHAR(255)         │       │ slug: VARCHAR(100) [UNIQUE]     │
│ password_hash: VARCHAR(255)     │       │ created_at: TIMESTAMPTZ         │
│ is_active: BOOLEAN              │       │ updated_at: TIMESTAMPTZ         │
│ created_at: TIMESTAMPTZ         │       └───────────────┬─────────────────┘
└───────────────┬─────────────────┘                       │
                │                                         │
                ├─────────────────────┐                   │
                ▼                     ▼                   │
┌─────────────────────────────────┐   │                   │
│      organization_members       │   │                   │
├─────────────────────────────────┤   │                   │
│ id: UUID [PK]                   │   │                   │
│ organization_id: UUID [FK] ─────┼───┼───────────────────┘
│ user_id: UUID [FK]              │   │
│ role: role_enum                 │   │ (OWNER, ADMIN, MEMBER, VIEWER)
│ created_at: TIMESTAMPTZ         │   │
└─────────────────────────────────┘   │
                                      ▼
                      ┌─────────────────────────────────┐
                      │            projects             │
                      ├─────────────────────────────────┤
                      │ id: UUID [PK]                   │
                      │ organization_id: UUID [FK]      │
                      │ name: VARCHAR(255)              │
                      │ description: TEXT               │
                      │ project_type: project_type_enum │
                      │ status: project_status_enum     │
                      │ start_date: DATE                │
                      │ end_date: DATE                  │
                      │ created_by: UUID [FK]           │
                      │ created_at: TIMESTAMPTZ         │
                      │ updated_at: TIMESTAMPTZ         │
                      └───────────────┬─────────────────┘
                                      │
                                      ▼
                      ┌─────────────────────────────────┐
                      │              sites              │
                      ├─────────────────────────────────┤
                      │ id: UUID [PK]                   │
                      │ project_id: UUID [FK]           │
                      │ name: VARCHAR(255)              │
                      │ description: TEXT               │
                      │ geometry: GEOMETRY(MultiPolygon)│ SRID 4326 (WGS84)
                      │ area_hectares: NUMERIC(12,4)    │ Computed via ST_Transform
                      │ status: site_status_enum        │ (ACTIVE, INACTIVE, REVIEW)
                      │ created_by: UUID [FK]           │
                      │ created_at: TIMESTAMPTZ         │
                      │ updated_at: TIMESTAMPTZ         │
                      └───────────────┬─────────────────┘
                                      │
                                      ▼
                      ┌─────────────────────────────────┐
                      │          observations           │
                      ├─────────────────────────────────┤
                      │ id: UUID [PK]                   │
                      │ site_id: UUID [FK]              │
                      │ observed_at: TIMESTAMPTZ        │
                      │ source: VARCHAR(100)            │
                      │ source_reference: VARCHAR(255)  │
                      │ created_at: TIMESTAMPTZ         │
                      └───────────────┬─────────────────┘
                                      │
                                      ▼
                      ┌─────────────────────────────────┐
                      │       observation_metrics       │
                      ├─────────────────────────────────┤
                      │ id: UUID [PK]                   │
                      │ observation_id: UUID [FK]       │
                      │ metric_type: metric_type_enum   │
                      │ value: DOUBLE PRECISION         │
                      │ unit: VARCHAR(50)               │
                      └─────────────────────────────────┘

┌─────────────────────────────────┐
│           audit_logs            │
├─────────────────────────────────┤
│ id: UUID [PK]                   │
│ organization_id: UUID [FK]      │
│ user_id: UUID [FK]              │
│ action: VARCHAR(100)            │
│ entity_type: VARCHAR(100)       │
│ entity_id: UUID                 │
│ metadata: JSONB                 │
│ created_at: TIMESTAMPTZ         │
└─────────────────────────────────┘
```

### Spatial Indexing:
- Table `sites` contains a **GiST** index on `geometry` (`CREATE INDEX idx_sites_geometry ON sites USING GIST (geometry)`).
- Area computation is executed entirely inside the database: `ST_Area(ST_Transform(geometry, 3857)) / 10000.0`.

---

## 4. API Architecture

All endpoints reside under `/api/v1`. Authentication uses `Authorization: Bearer <token>` with JWT tokens signed using HS256.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Create user and organization |
| `POST` | `/api/v1/auth/login` | Authenticate and obtain access + refresh tokens |
| `POST` | `/api/v1/auth/refresh` | Exchange refresh token for new access token |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile & memberships |
| `GET` | `/api/v1/organizations/{id}` | Organization details & stats |
| `GET` | `/api/v1/organizations/{id}/audit-logs` | Organization audit trail |
| `GET` | `/api/v1/projects` | List projects for user's active organization |
| `POST` | `/api/v1/projects` | Create a new environmental project |
| `GET` | `/api/v1/projects/{id}` | Retrieve project details with aggregated site statistics |
| `GET` | `/api/v1/projects/{id}/sites` | List sites within a project |
| `POST` | `/api/v1/projects/{id}/sites` | Create a site with GeoJSON polygon (area auto-calculated) |
| `GET` | `/api/v1/sites/{id}` | Inspect site details with GeoJSON boundary |
| `GET` | `/api/v1/sites/{id}/analytics` | Site time-series metrics & summary statistics |
| `GET` | `/api/v1/sites/{id}/observations` | List site observations with pagination |
| `POST` | `/api/v1/sites/{id}/observations` | Add new environmental observation |
| `GET` | `/api/v1/sites/{id}/environmental-context` | Real-time weather, fire risk & EO satellite data |
| `GET` | `/api/v1/projects/{id}/analytics` | Aggregated project analytics across all sites |
| `GET` | `/api/v1/dashboard/kpis` | Organization KPI dashboard summary |
| `GET` | `/api/v1/map/sites` | Bounding-box filtered GeoJSON feature collection for GIS |

---

## 5. External API Integrations (Adapter Pattern)

External data providers follow an extensible interface architecture so that the application functions seamlessly out-of-the-box using high-fidelity mock generators while enabling production API keys without code modifications:

1. **Weather Integration (`WeatherProvider`)**:
   - `MockWeatherProvider`: Generates deterministic, geographically-aware microclimate telemetry (temperature, relative humidity, precipitation, and soil moisture).
   - `OpenWeatherProvider`: Invokes OpenWeatherMap OneCall API when `WEATHER_API_KEY` is provided.
   - **Fault Tolerance:** If external HTTP calls fail or rate limits are hit, the system automatically falls back to simulated baseline metrics without crashing.

2. **Earth Observation Integration (`EOProvider`)**:
   - `MockEOProvider`: Provides simulated Sentinel-2 NDVI spectral reflectance, tree canopy cover %, and fire weather indices.
   - `SentinelHubProvider`: Ready for Copernicus / Sentinel Hub integration using `EARTH_OBSERVATION_API_KEY`.

---

## 6. Required vs. Optional API Keys

| Key | Purpose | Required? | Fallback Behavior |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL + PostGIS | **Yes** | Server fails fast on startup if invalid |
| `JWT_SECRET` | Auth Token Signing | **Yes** | Uses cryptographic validation |
| `VITE_MAPBOX_ACCESS_TOKEN` | Mapbox GL Vector Tiles | **Yes** | Standard fallback styles; token needed for custom map tiles |
| `WEATHER_API_KEY` | Real-time weather & soil moisture | Optional | Falls back to high-fidelity mock weather provider |
| `EARTH_OBSERVATION_API_KEY` | Satellite EO bands & indices | Optional | Falls back to synthetic earth observation generator |

---

## 7. Implementation Roadmap & Status

- [x] **Phase 1 — Core Architecture & Scaffolding**: Setup modular monolith, dependencies, TypeScript contracts, Docker configuration.
- [x] **Phase 2 — Multi-Tenant Database & PostGIS**: Models for Users, Orgs, Projects, Sites (Geometry), Observations, Metrics, AuditLog.
- [x] **Phase 3 — Authentication & Authorization**: JWT flow, bcrypt security, organization tenancy context.
- [x] **Phase 4 — Core Geospatial Services**: PostGIS ST_Transform, ST_Area, ST_AsGeoJSON, ST_Intersects bounding-box queries.
- [x] **Phase 5 — Analytics Engine**: Aggregation algorithms, time series rolling averages, KPI calculations.
- [x] **Phase 6 — Frontend UI/UX & Interactive GIS**: React 18 dashboard, Mapbox GL JS map, Mapbox Draw polygon digitizing, Chart.js time-series.
- [x] **Phase 7 — Observation Data Ingestion**: Observation creation modal, instant chart reactivity.
- [x] **Phase 8 — External Integrations & Audit Trail**: Weather & EO telemetry adapter, organizational audit logging.
- [x] **Phase 9 — Production Polish**: SEO metadata, responsive layout, Docker deployment verification.
