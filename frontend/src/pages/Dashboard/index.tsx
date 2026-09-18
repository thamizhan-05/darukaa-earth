import { useQuery } from '@tanstack/react-query'
import {
  BarChart3,
  Layers,
  Map,
  MapPin,
  TrendingUp,
  Leaf,
  Compass,
  Plus,
  ShieldCheck,
  Globe2,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { KPICard } from '@/components/dashboard/KPICard'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { useAuth } from '@/context/AuthContext'
import { analyticsService } from '@/services/analytics'
import { projectsService } from '@/services/projects'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const { activeOrg, user } = useAuth()

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard-kpis', activeOrg?.id],
    queryFn: () => analyticsService.dashboardKpis(activeOrg!.id),
    enabled: !!activeOrg,
  })

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', activeOrg?.id],
    queryFn: () => projectsService.list(activeOrg!.id),
    enabled: !!activeOrg,
  })

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const recentProjects = projects?.slice(0, 4) || []

  return (
    <AppShell>
      <TopBar
        title="Portfolio Overview"
        subtitle={activeOrg ? `${activeOrg.name} · Geospatial Intelligence Workspace` : undefined}
      />
      <div className="flex-1 p-4 sm:p-6 space-y-6 animate-fade-in max-w-7xl mx-auto w-full">
        {/* Executive Banner */}
        <div className="relative overflow-hidden rounded-xl border border-accent-emerald/20 bg-gradient-to-r from-bg-surface via-bg-surface to-accent-emerald/10 p-5 sm:p-6 shadow-card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent-green/15 text-accent-green border border-accent-green/25">
                  <ShieldCheck className="w-3 h-3" />
                  Enterprise Spatial Node
                </span>
                <span className="text-xs text-text-muted">SRID 4326 PostGIS</span>
              </div>
              <h2 className="text-text-primary text-xl sm:text-2xl font-bold tracking-tight">
                {greeting()}, {user?.full_name?.split(' ')[0] || 'Member'} 👋
              </h2>
              <p className="text-text-secondary text-sm mt-1 max-w-2xl">
                Real-time multi-tenant monitoring of land boundaries, carbon stock density, and
                biodiversity indices.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                to="/app/map"
                className="btn-primary flex items-center gap-2 text-xs py-2 px-3.5 shadow-sm"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Map</span>
              </Link>
              <Link
                to="/app/projects"
                className="btn-secondary flex items-center gap-2 text-xs py-2 px-3.5"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </Link>
            </div>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-text-secondary text-xs font-semibold uppercase tracking-wider">
              Ecological Metrics & Scale
            </h3>
            <span className="text-[11px] text-text-muted">Live Aggregation</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            <KPICard
              label="Total Projects"
              value={kpis?.total_projects ?? null}
              icon={<Layers className="w-4 h-4" />}
              color="green"
              isLoading={kpisLoading}
            />
            <KPICard
              label="Active Projects"
              value={kpis?.active_projects ?? null}
              icon={<TrendingUp className="w-4 h-4" />}
              color="teal"
              isLoading={kpisLoading}
            />
            <KPICard
              label="Total Sites"
              value={kpis?.total_sites ?? null}
              icon={<Map className="w-4 h-4" />}
              color="blue"
              isLoading={kpisLoading}
            />
            <KPICard
              label="Total Area"
              value={
                kpis
                  ? kpis.total_area_hectares.toLocaleString('en-IN', { maximumFractionDigits: 0 })
                  : null
              }
              unit="ha"
              icon={<MapPin className="w-4 h-4" />}
              color="orange"
              isLoading={kpisLoading}
            />
            <KPICard
              label="Avg Carbon Stock"
              value={kpis?.avg_carbon_stock?.toFixed(1) ?? null}
              unit="tCO₂e/ha"
              icon={<Leaf className="w-4 h-4" />}
              color="green"
              isLoading={kpisLoading}
            />
            <KPICard
              label="Biodiversity Index"
              value={kpis?.avg_biodiversity_index?.toFixed(2) ?? null}
              icon={<BarChart3 className="w-4 h-4" />}
              color="teal"
              isLoading={kpisLoading}
            />
          </div>
        </div>

        {/* Main Content Grid: Recent Projects + Geospatial Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects (2 columns on lg) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-text-secondary text-xs font-semibold uppercase tracking-wider">
                Recent Environmental Projects
              </h3>
              <Link
                to="/app/projects"
                className="text-accent-green text-xs hover:text-accent-teal transition-colors font-medium"
              >
                View all projects →
              </Link>
            </div>

            {projectsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="card p-5 space-y-3">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                    <div className="skeleton h-3 w-1/3" />
                  </div>
                ))}
              </div>
            ) : recentProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentProjects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center border-dashed">
                <Layers className="w-10 h-10 text-text-muted mx-auto mb-3" />
                <p className="text-text-secondary text-sm font-medium">No projects registered</p>
                <p className="text-text-muted text-xs mt-1">
                  Create your first environmental project to begin spatial boundary mapping
                </p>
                <Link to="/app/projects" className="mt-4 inline-block">
                  <button className="text-accent-green text-sm font-medium hover:text-accent-teal transition-colors">
                    Create a project →
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Geospatial Intelligence & Verification Card (1 column on lg) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-text-secondary text-xs font-semibold uppercase tracking-wider">
                Geospatial Engine
              </h3>
              <span className="text-[11px] text-accent-green font-mono">Mapbox GL JS</span>
            </div>

            <div className="card p-5 space-y-4 bg-bg-surface border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent-teal/15 border border-accent-teal/30 flex items-center justify-center text-accent-teal flex-shrink-0">
                  <Globe2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">
                    Spatial Observation Coverage
                  </h4>
                  <p className="text-xs text-text-muted">PostGIS MultiPolygon Vector Topology</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-text-secondary pt-1 border-t border-border">
                <div className="flex justify-between items-center py-1">
                  <span className="text-text-muted">Coordinate System</span>
                  <span className="font-mono text-text-primary">WGS 84 / EPSG:4326</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-border/50">
                  <span className="text-text-muted">Area Computation</span>
                  <span className="font-mono text-text-primary">ST_Area(geography)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-border/50">
                  <span className="text-text-muted">Satellite Imagery</span>
                  <span className="font-mono text-text-primary">Mapbox High-Res RGB</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-border/50">
                  <span className="text-text-muted">Indices Tracked</span>
                  <span className="font-mono text-accent-green">7 Core Metrics</span>
                </div>
              </div>

              <Link
                to="/app/map"
                className="btn-secondary w-full justify-center flex items-center gap-2 text-xs py-2 mt-2"
              >
                <Map className="w-3.5 h-3.5 text-accent-green" />
                <span>Launch Interactive Map</span>
              </Link>
            </div>

            {/* Scientific Provenance Note */}
            <div className="card p-4 bg-bg-surface/60 border-border/70 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-text-secondary font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-accent-green flex-shrink-0" />
                <span>Methodology Standards</span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Observation series calibrated against IPCC Good Practice Guidance Tier 2 and Verra
                VM0047 dynamic carbon accounting standards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
