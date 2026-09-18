import { useRef, useState, useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  BarChart3,
  MapPin,
  Plus,
  Layers,
  Activity,
  Leaf,
  Sparkles,
  SunMedium,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { Badge, statusBadgeVariant } from '@/components/ui/Badge'
import { KPICard } from '@/components/dashboard/KPICard'
import { MapGL, type MapGLHandle } from '@/components/map/MapGL'
import { AddSiteModal } from '@/components/sites/AddSiteModal'
import { AnalyticsChart, CORE_METRIC_CONFIGS } from '@/components/analytics/AnalyticsChart'
import { projectsService } from '@/services/projects'
import { sitesService } from '@/services/sites'
import { analyticsService } from '@/services/analytics'
import type { SiteGeoJSONFeature } from '@/types/site'

export default function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const mapRef = useRef<MapGLHandle>(null)
  const [activeTab, setActiveTab] = useState<'sites' | 'analytics'>('sites')
  const [showAddSite, setShowAddSite] = useState(false)
  const [selectedSite, setSelectedSite] = useState<string | null>(null)
  const [compMetric, setCompMetric] = useState<string>('CARBON_STOCK')

  const { data: project } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectsService.get(projectId!),
    enabled: !!projectId,
  })

  const { data: sites = [], refetch: refetchSites } = useQuery({
    queryKey: ['sites', projectId],
    queryFn: () => sitesService.listForProject(projectId!),
    enabled: !!projectId,
  })

  const { data: analytics } = useQuery({
    queryKey: ['project-analytics', projectId],
    queryFn: () => analyticsService.projectAnalytics(projectId!),
    enabled: !!projectId,
  })

  const mapFeatures: SiteGeoJSONFeature[] = sites
    .filter((s) => s.geometry)
    .map((s) => ({
      type: 'Feature' as const,
      id: s.id,
      geometry: s.geometry!,
      properties: {
        name: s.name,
        area_hectares: s.area_hectares || 0,
        status: s.status,
        project_id: s.project_id,
      },
    }))

  const handleSiteClick = (feature: SiteGeoJSONFeature) => {
    setSelectedSite(feature.id)
  }

  const handleSiteListClick = (site: (typeof sites)[0]) => {
    setSelectedSite(site.id)
    if (site.geometry && mapRef.current) {
      const coords = (site.geometry.coordinates as any)[0][0]
      if (coords && coords.length >= 2) {
        mapRef.current.flyTo([coords[0], coords[1]], 13)
      }
    }
  }

  // Cross-site comparison data
  const comparisonItems = useMemo(() => {
    if (!analytics?.site_breakdown) return []
    return analytics.site_breakdown.map((item) => ({
      name: item.site_name,
      value: item.metrics[compMetric] ?? null,
      area: item.area_hectares,
    }))
  }, [analytics, compMetric])

  const selectedMetricConfig = useMemo(() => {
    return CORE_METRIC_CONFIGS.find((m) => m.key === compMetric) || CORE_METRIC_CONFIGS[0]
  }, [compMetric])

  if (!project) {
    return (
      <AppShell>
        <div className="flex-1 p-6">
          <div className="card p-12 text-center animate-pulse">
            <div className="skeleton h-6 w-48 mx-auto mb-3 rounded" />
            <div className="skeleton h-4 w-64 mx-auto rounded" />
          </div>
        </div>
      </AppShell>
    )
  }

  const pm = analytics?.metrics || {}

  return (
    <AppShell>
      <TopBar
        title={project.name}
        subtitle={project.project_type.replace(/_/g, ' ')}
        actions={
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowAddSite(true)}
            size="sm"
          >
            Add Site
          </Button>
        }
      />

      <div className="flex-1 p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/app/projects')}
            className="p-2 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors mt-0.5"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={statusBadgeVariant(project.status)} dot>
                {project.status}
              </Badge>
              <Badge variant="default">{project.project_type.replace(/_/g, ' ')}</Badge>
            </div>
            {project.description && (
              <p className="text-text-secondary text-sm mt-2 max-w-2xl">{project.description}</p>
            )}
          </div>
        </div>

        {/* KPIs across Core Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard
            label="Sites"
            value={project.site_count}
            icon={<Layers className="w-4 h-4" />}
            color="green"
          />
          <KPICard
            label="Total Area"
            value={project.total_area_hectares.toLocaleString('en-IN', {
              maximumFractionDigits: 0,
            })}
            unit="ha"
            icon={<MapPin className="w-4 h-4" />}
            color="blue"
          />
          <KPICard
            label="Avg Carbon Stock"
            value={pm.CARBON_STOCK?.current?.toFixed(1) ?? null}
            unit="tCO₂e/ha"
            change={pm.CARBON_STOCK?.change_pct ?? null}
            icon={<Leaf className="w-4 h-4" />}
            color="green"
          />
          <KPICard
            label="Biodiversity"
            value={pm.BIODIVERSITY_INDEX?.current?.toFixed(3) ?? null}
            unit="index"
            change={pm.BIODIVERSITY_INDEX?.change_pct ?? null}
            icon={<Sparkles className="w-4 h-4" />}
            color="teal"
          />
          <KPICard
            label="Avg NDVI"
            value={pm.NDVI?.current?.toFixed(3) ?? null}
            unit="index"
            change={pm.NDVI?.change_pct ?? null}
            icon={<Activity className="w-4 h-4" />}
            color="orange"
          />
          <KPICard
            label="Canopy Cover"
            value={pm.CANOPY_COVER?.current?.toFixed(1) ?? null}
            unit="%"
            change={pm.CANOPY_COVER?.change_pct ?? null}
            icon={<SunMedium className="w-4 h-4" />}
            color="blue"
          />
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 border-b border-border">
          <button
            onClick={() => setActiveTab('sites')}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === 'sites'
                ? 'border-accent-green text-accent-green'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Sites & Spatial Boundary ({sites.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'border-accent-green text-accent-green'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Project Environmental Analytics</span>
          </button>
        </div>

        {/* Tab 1: Sites & Interactive Map */}
        {activeTab === 'sites' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[500px]">
            {/* Site list */}
            <div className="lg:col-span-2 card flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="text-text-primary text-sm font-semibold">Registered Sites</h3>
                <span className="text-xs text-text-muted">{sites.length} total</span>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-border-muted">
                {sites.length === 0 ? (
                  <div className="p-6 text-center">
                    <MapPin className="w-8 h-8 text-text-muted mx-auto mb-2" />
                    <p className="text-text-secondary text-xs">No sites yet</p>
                    <p className="text-text-muted text-xs mt-1">
                      Click "Add Site" to draw a boundary
                    </p>
                  </div>
                ) : (
                  sites.map((site) => (
                    <button
                      key={site.id}
                      onClick={() => handleSiteListClick(site)}
                      className={`w-full text-left px-4 py-3 hover:bg-bg-elevated transition-all group ${
                        selectedSite === site.id
                          ? 'bg-bg-elevated border-l-2 border-accent-green'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-text-primary text-xs font-medium group-hover:text-accent-green transition-colors">
                          {site.name}
                        </p>
                        <Badge variant={statusBadgeVariant(site.status)}>{site.status}</Badge>
                      </div>
                      <p className="text-text-muted text-xs mt-0.5">
                        {site.area_hectares?.toFixed(2) || '—'} ha
                      </p>
                      <Link
                        to={`/app/projects/${projectId}/sites/${site.id}`}
                        className="text-accent-green text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity inline-block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View telemetry details →
                      </Link>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Map */}
            <div className="lg:col-span-3 card overflow-hidden">
              <MapGL
                ref={mapRef}
                features={mapFeatures}
                onSiteClick={handleSiteClick}
                autoFit={true}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Project Environmental Analytics & Cross-Site Comparison */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <AnalyticsChart
              timeSeries={analytics?.time_series || {}}
              metricSummaries={analytics?.metrics || {}}
              isSynthetic={analytics?.is_synthetic ?? true}
              dataSourceNote={analytics?.data_source_note}
              title={`${project.name} — Multi-Site Environmental Analytics`}
              subtitle="Aggregated time-series curves across all project sites with period-over-period trend analysis"
            />

            {/* Cross-Site Comparison Section */}
            <div className="card p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    Cross-Site Metric Comparison
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Compare performance across sites for the selected environmental indicator
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">Metric:</span>
                  <select
                    value={compMetric}
                    onChange={(e) => setCompMetric(e.target.value)}
                    className="px-2.5 py-1.5 rounded-md bg-bg-elevated border border-border text-xs text-text-primary focus:outline-none"
                  >
                    {CORE_METRIC_CONFIGS.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label} ({m.unit})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Site ranking comparison list */}
              <div className="space-y-3 pt-2">
                {comparisonItems.length === 0 ? (
                  <div className="py-8 text-center text-xs text-text-muted">
                    No site telemetry available for comparison yet.
                  </div>
                ) : (
                  comparisonItems.map((item, idx) => {
                    const maxVal = Math.max(...comparisonItems.map((i) => i.value || 0), 1)
                    const pct = item.value ? Math.min(100, (item.value / maxVal) * 100) : 0

                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-text-primary flex items-center gap-2">
                            <span className="w-4 text-text-muted font-mono">{idx + 1}.</span>
                            <span>{item.name}</span>
                            <span className="text-[10px] text-text-muted font-normal">
                              ({item.area?.toFixed(1) || '—'} ha)
                            </span>
                          </span>
                          <span className="font-semibold tabular-nums text-text-primary">
                            {item.value !== null ? item.value.toFixed(2) : '—'}{' '}
                            <span className="text-[10px] font-normal text-text-muted">
                              {selectedMetricConfig.unit}
                            </span>
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-bg-elevated overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: selectedMetricConfig.color,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showAddSite && (
        <AddSiteModal
          projectId={projectId!}
          onClose={() => setShowAddSite(false)}
          onSuccess={refetchSites}
        />
      )}
    </AppShell>
  )
}
