import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  Activity,
  BarChart3,
  Leaf,
  Plus,
  CloudSun,
  Droplets,
  Wind,
  Flame,
  Satellite,
  Search,
  Bug,
  SunMedium,
  TrendingUp,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { KPICard } from '@/components/dashboard/KPICard'
import { Badge, statusBadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MapGL } from '@/components/map/MapGL'
import { AddObservationModal } from '@/components/observations/AddObservationModal'
import { AnalyticsChart, CORE_METRIC_CONFIGS } from '@/components/analytics/AnalyticsChart'
import { sitesService } from '@/services/sites'
import { analyticsService } from '@/services/analytics'
import type { SiteGeoJSONFeature } from '@/types/site'

export default function SiteDetailsPage() {
  const { projectId, siteId } = useParams<{ projectId: string; siteId: string }>()
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'observations'>('overview')
  const [showAddObsModal, setShowAddObsModal] = useState(false)
  const [obsSearch, setObsSearch] = useState('')
  const [obsMetricFilter, setObsMetricFilter] = useState('ALL')

  const { data: site } = useQuery({
    queryKey: ['site', siteId],
    queryFn: () => sitesService.get(siteId!),
    enabled: !!siteId,
  })

  const { data: analytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ['site-analytics', siteId],
    queryFn: () => analyticsService.siteAnalytics(siteId!),
    enabled: !!siteId,
  })

  const { data: observations = [], refetch: refetchObservations } = useQuery({
    queryKey: ['observations', siteId],
    queryFn: () => analyticsService.siteObservations(siteId!),
    enabled: !!siteId,
  })

  const { data: envContext } = useQuery({
    queryKey: ['environmental-context', siteId],
    queryFn: () => analyticsService.getEnvironmentalContext(siteId!),
    enabled: !!siteId,
  })

  const mapFeature: SiteGeoJSONFeature | null = site?.geometry
    ? {
        type: 'Feature',
        id: site.id,
        geometry: site.geometry,
        properties: {
          name: site.name,
          area_hectares: site.area_hectares || 0,
          status: site.status,
          project_id: site.project_id,
        },
      }
    : null

  // Filtered observations
  const filteredObservations = useMemo(() => {
    return observations.filter((obs) => {
      const matchSearch =
        !obsSearch ||
        obs.source.toLowerCase().includes(obsSearch.toLowerCase()) ||
        (obs.source_reference &&
          obs.source_reference.toLowerCase().includes(obsSearch.toLowerCase()))

      const matchMetric =
        obsMetricFilter === 'ALL' || obs.metrics.some((m) => m.metric_type === obsMetricFilter)

      return matchSearch && matchMetric
    })
  }, [observations, obsSearch, obsMetricFilter])

  if (!site) {
    return (
      <AppShell>
        <div className="flex-1 p-6">
          <div className="card h-64 skeleton" />
        </div>
      </AppShell>
    )
  }

  const m = analytics?.metrics || {}
  const cs = m['CARBON_STOCK']
  const seq = m['CARBON_SEQUESTRATION']
  const bi = m['BIODIVERSITY_INDEX']
  const ndvi = m['NDVI']
  const trees = m['TREE_DENSITY']
  const species = m['SPECIES_COUNT']
  const canopy = m['CANOPY_COVER']

  return (
    <AppShell>
      <TopBar
        title={site.name}
        subtitle={`${site.area_hectares?.toFixed(2) || '—'} ha · PostGIS Calculated`}
        actions={
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowAddObsModal(true)}
            size="sm"
          >
            Add Observation
          </Button>
        }
      />

      <div className="flex-1 p-6 space-y-6 animate-fade-in">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Link to="/app/projects" className="hover:text-text-secondary transition-colors">
            Projects
          </Link>
          <span>/</span>
          <Link
            to={`/app/projects/${projectId}`}
            className="hover:text-text-secondary transition-colors"
          >
            Project
          </Link>
          <span>/</span>
          <span className="text-text-primary font-medium">{site.name}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-text-primary">{site.name}</h2>
              <Badge variant={statusBadgeVariant(site.status)} dot>
                {site.status}
              </Badge>
            </div>
            <p className="text-text-secondary text-xs mt-1">
              Registered site · {observations.length} observations
            </p>
          </div>
        </div>

        {/* KPIs across Core Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard
            label="Carbon Stock"
            value={cs?.current?.toFixed(1) ?? null}
            unit={cs?.unit ?? 'tCO₂e/ha'}
            change={cs?.change_pct ?? null}
            icon={<Leaf className="w-4 h-4" />}
            color="green"
          />
          <KPICard
            label="Sequestration"
            value={seq?.current?.toFixed(1) ?? null}
            unit={seq?.unit ?? 'tCO₂/ha/yr'}
            change={seq?.change_pct ?? null}
            icon={<TrendingUp className="w-4 h-4" />}
            color="green"
          />
          <KPICard
            label="Biodiversity"
            value={bi?.current?.toFixed(3) ?? null}
            unit={bi?.unit ?? 'index'}
            change={bi?.change_pct ?? null}
            icon={<BarChart3 className="w-4 h-4" />}
            color="teal"
          />
          <KPICard
            label="NDVI Index"
            value={ndvi?.current?.toFixed(3) ?? null}
            unit={ndvi?.unit ?? 'index'}
            change={ndvi?.change_pct ?? null}
            icon={<Activity className="w-4 h-4" />}
            color="orange"
          />
          <KPICard
            label="Species Richness"
            value={species?.current ? Math.round(species.current) : null}
            unit="species"
            icon={<Bug className="w-4 h-4" />}
            color="blue"
          />
          <KPICard
            label="Canopy Cover"
            value={canopy?.current?.toFixed(1) ?? null}
            unit="%"
            change={canopy?.change_pct ?? null}
            icon={<SunMedium className="w-4 h-4" />}
            color="blue"
          />
        </div>

        {/* Real-time Environmental Context Telemetry */}
        {envContext && (
          <div className="card p-4 bg-gradient-to-r from-bg-surface via-bg-elevated to-bg-surface border border-border/70 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/50 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-accent-amber" />
                <span className="text-xs font-semibold text-text-primary">
                  Site Microclimate & Satellite Telemetry
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-green/10 text-accent-green border border-accent-green/20">
                  {envContext.weather.is_live ? 'Live Sensor Feed' : 'Adapter Telemetry'}
                </span>
              </div>
              <span className="text-[11px] text-text-muted">
                Lat: {envContext.latitude.toFixed(4)}°N, Lon: {envContext.longitude.toFixed(4)}°E
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="bg-bg-overlay/40 rounded-lg p-2.5 border border-border/40">
                <span className="text-[10px] text-text-muted flex items-center gap-1">
                  <CloudSun className="w-3 h-3 text-accent-amber" /> Temperature
                </span>
                <span className="text-xs font-semibold text-text-primary mt-0.5 block">
                  {envContext.weather.temperature_celsius.toFixed(1)}°C
                </span>
              </div>

              <div className="bg-bg-overlay/40 rounded-lg p-2.5 border border-border/40">
                <span className="text-[10px] text-text-muted flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-info" /> Humidity
                </span>
                <span className="text-xs font-semibold text-text-primary mt-0.5 block">
                  {envContext.weather.humidity_pct}%
                </span>
              </div>

              <div className="bg-bg-overlay/40 rounded-lg p-2.5 border border-border/40">
                <span className="text-[10px] text-text-muted flex items-center gap-1">
                  <Wind className="w-3 h-3 text-text-muted" /> Wind
                </span>
                <span className="text-xs font-semibold text-text-primary mt-0.5 block">
                  {envContext.weather.wind_speed_kmh} km/h
                </span>
              </div>

              <div className="bg-bg-overlay/40 rounded-lg p-2.5 border border-border/40">
                <span className="text-[10px] text-text-muted flex items-center gap-1">
                  <Satellite className="w-3 h-3 text-accent-teal" /> Sentinel-2 NDVI
                </span>
                <span className="text-xs font-semibold text-text-primary mt-0.5 block">
                  {envContext.earth_observation.satellite_ndvi.toFixed(3)}
                </span>
              </div>

              <div className="bg-bg-overlay/40 rounded-lg p-2.5 border border-border/40">
                <span className="text-[10px] text-text-muted flex items-center gap-1">
                  <Flame className="w-3 h-3 text-accent-amber" /> Wildfire Risk
                </span>
                <span className="text-xs font-semibold mt-0.5 flex items-center gap-1.5">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      envContext.earth_observation.fire_risk_level === 'HIGH'
                        ? 'bg-danger'
                        : envContext.earth_observation.fire_risk_level === 'MODERATE'
                          ? 'bg-warning'
                          : 'bg-accent-green'
                    }`}
                  />
                  <span className="text-text-primary">
                    {envContext.earth_observation.fire_risk_level}
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {(['overview', 'analytics', 'observations'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-accent-green text-accent-green'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Site map */}
            <div className="card overflow-hidden h-80">
              {mapFeature ? (
                <MapGL features={[mapFeature]} autoFit={true} />
              ) : (
                <div className="h-full flex items-center justify-center text-text-muted text-sm">
                  No geometry available
                </div>
              )}
            </div>
            {/* Metadata & Site Profile */}
            <div className="card p-5 space-y-4">
              <h3 className="text-sm font-semibold text-text-primary">Site Geodetic Profile</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-text-muted">PostGIS Polygon Area</span>
                  <span className="text-text-primary font-medium">
                    {site.area_hectares?.toFixed(4) || '—'} ha
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-text-muted">Tree Density</span>
                  <span className="text-text-primary font-medium">
                    {trees?.current ? `${Math.round(trees.current)} trees/ha` : '—'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-text-muted">Canopy Cover</span>
                  <span className="text-text-primary font-medium">
                    {canopy?.current ? `${canopy.current.toFixed(1)}%` : '—'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-text-muted">Species Count</span>
                  <span className="text-text-primary font-medium">
                    {species?.current ? `${Math.round(species.current)} catalogued` : '—'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-text-muted">Total Observations</span>
                  <span className="text-text-primary font-medium">
                    {analytics?.observation_count ?? observations.length} records
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Created</span>
                  <span className="text-text-primary font-medium">
                    {format(new Date(site.created_at), 'dd MMM yyyy')}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Environmental Telemetry (Open-Meteo & Copernicus) */}
            {envContext && (
              <div className="lg:col-span-2 card p-5 space-y-4 border-accent-emerald/30 bg-gradient-to-br from-bg-surface via-bg-surface to-accent-emerald/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-accent-green/15 flex items-center justify-center text-accent-green">
                      <Activity className="w-3.5 h-3.5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">
                        Live Microclimate & Satellite Telemetry
                      </h3>
                      <p className="text-[11px] text-text-muted">
                        Real-time station observations for coordinates ({envContext.latitude},{' '}
                        {envContext.longitude})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-accent-green px-2.5 py-1 rounded-full bg-accent-green/10 border border-accent-green/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-ping" />
                      Live Telemetry Active
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
                  <div className="bg-bg-elevated/70 p-3 rounded-lg border border-border/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-text-muted text-[11px]">
                      <CloudSun className="w-3.5 h-3.5 text-accent-green" />
                      <span>Temperature</span>
                    </div>
                    <p className="text-base font-bold text-text-primary">
                      {envContext.weather.temperature_celsius}°C
                    </p>
                    <p className="text-[10px] text-text-muted capitalize truncate">
                      {envContext.weather.condition}
                    </p>
                  </div>

                  <div className="bg-bg-elevated/70 p-3 rounded-lg border border-border/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-text-muted text-[11px]">
                      <Droplets className="w-3.5 h-3.5 text-accent-teal" />
                      <span>Humidity</span>
                    </div>
                    <p className="text-base font-bold text-text-primary">
                      {envContext.weather.humidity_pct}%
                    </p>
                    <p className="text-[10px] text-text-muted">Relative humidity</p>
                  </div>

                  <div className="bg-bg-elevated/70 p-3 rounded-lg border border-border/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-text-muted text-[11px]">
                      <Leaf className="w-3.5 h-3.5 text-accent-green" />
                      <span>Soil Moisture</span>
                    </div>
                    <p className="text-base font-bold text-text-primary">
                      {envContext.weather.soil_moisture_pct}%
                    </p>
                    <p className="text-[10px] text-text-muted">Surface layer 0-1cm</p>
                  </div>

                  <div className="bg-bg-elevated/70 p-3 rounded-lg border border-border/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-text-muted text-[11px]">
                      <Wind className="w-3.5 h-3.5 text-accent-cyan" />
                      <span>Wind Speed</span>
                    </div>
                    <p className="text-base font-bold text-text-primary">
                      {envContext.weather.wind_speed_kmh} km/h
                    </p>
                    <p className="text-[10px] text-text-muted">
                      Precip: {envContext.weather.precipitation_mm} mm
                    </p>
                  </div>

                  <div className="bg-bg-elevated/70 p-3 rounded-lg border border-border/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-text-muted text-[11px]">
                      <Satellite className="w-3.5 h-3.5 text-accent-purple" />
                      <span>Satellite NDVI</span>
                    </div>
                    <p className="text-base font-bold text-text-primary">
                      {envContext.earth_observation.satellite_ndvi}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      Cloud: {envContext.earth_observation.cloud_cover_pct}%
                    </p>
                  </div>

                  <div className="bg-bg-elevated/70 p-3 rounded-lg border border-border/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-text-muted text-[11px]">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>Wildfire Risk</span>
                    </div>
                    <p className="text-base font-bold text-text-primary">
                      {envContext.earth_observation.fire_risk_level}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      Index: {envContext.earth_observation.fire_risk_index}/100
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-text-muted flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 pt-2 border-t border-border/50">
                  <span>
                    <b>Atmospheric Source:</b> {envContext.weather.source}
                  </span>
                  <span>
                    <b>Remote Sensing:</b> {envContext.earth_observation.satellite_source}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Analytics Chart with 7 Metrics */}
        {activeTab === 'analytics' && (
          <AnalyticsChart
            timeSeries={analytics?.time_series || {}}
            metricSummaries={analytics?.metrics || {}}
            isSynthetic={analytics?.is_synthetic ?? true}
            dataSourceNote={analytics?.data_source_note}
            title={`${site.name} — Multi-Spectral Ecological Intelligence`}
            subtitle="Interactive historical time-series curves, statistical boundaries, and trend calculations"
          />
        )}

        {/* Tab 3: Observations Table with Filters */}
        {activeTab === 'observations' && (
          <div className="card overflow-hidden space-y-4">
            {/* Observation Filters Header */}
            <div className="p-4 border-b border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-bg-surface/50">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  Recorded Environmental Observations ({filteredObservations.length})
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Database verified measurements linked to PostGIS polygon geometry
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                {/* Search source */}
                <div className="relative flex-1 md:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search by source..."
                    value={obsSearch}
                    onChange={(e) => setObsSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-md bg-bg-elevated border border-border text-xs text-text-primary focus:outline-none focus:border-accent-green"
                  />
                </div>

                {/* Metric filter */}
                <select
                  value={obsMetricFilter}
                  onChange={(e) => setObsMetricFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-md bg-bg-elevated border border-border text-xs text-text-primary focus:outline-none"
                >
                  <option value="ALL">All Metrics</option>
                  {CORE_METRIC_CONFIGS.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>

                <Button
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setShowAddObsModal(true)}
                >
                  Record Observation
                </Button>
              </div>
            </div>

            {/* Observations Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-text-muted bg-bg-surface/40">
                    <th className="font-medium px-4 py-3 text-left">Observed Date</th>
                    <th className="font-medium px-4 py-3 text-left">Telemetry Source</th>
                    <th className="font-medium px-4 py-3 text-right">Carbon Stock</th>
                    <th className="font-medium px-4 py-3 text-right">Sequestration</th>
                    <th className="font-medium px-4 py-3 text-right">Biodiversity</th>
                    <th className="font-medium px-4 py-3 text-right">NDVI</th>
                    <th className="font-medium px-4 py-3 text-right">Tree Density</th>
                    <th className="font-medium px-4 py-3 text-right">Species</th>
                    <th className="font-medium px-4 py-3 text-right">Canopy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-muted">
                  {filteredObservations.map((obs) => {
                    const getVal = (mtype: string) => {
                      const item = obs.metrics.find((m) => m.metric_type === mtype)
                      return item ? item.value : null
                    }
                    const csVal = getVal('CARBON_STOCK')
                    const seqVal = getVal('CARBON_SEQUESTRATION')
                    const biVal = getVal('BIODIVERSITY_INDEX')
                    const ndviVal = getVal('NDVI')
                    const treeVal = getVal('TREE_DENSITY')
                    const spVal = getVal('SPECIES_COUNT')
                    const canVal = getVal('CANOPY_COVER')

                    const isDemoSource =
                      obs.source.toLowerCase().includes('demo') ||
                      obs.source.toLowerCase().includes('synthetic')

                    return (
                      <tr key={obs.id} className="hover:bg-bg-elevated/70 transition-colors">
                        <td className="px-4 py-3 text-text-primary font-medium whitespace-nowrap">
                          {format(new Date(obs.observed_at), 'dd MMM yyyy')}
                        </td>
                        <td className="px-4 py-3 text-text-secondary max-w-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate">{obs.source}</span>
                            {isDemoSource && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-warning/10 text-warning border border-warning/20">
                                Demo
                              </span>
                            )}
                          </div>
                          {obs.source_reference && (
                            <div className="text-[10px] text-text-muted mt-0.5 truncate">
                              Ref: {obs.source_reference}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-text-primary">
                          {csVal !== null ? `${csVal.toFixed(1)} t` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-text-primary">
                          {seqVal !== null ? `${seqVal.toFixed(1)} t/yr` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-text-primary">
                          {biVal !== null ? biVal.toFixed(3) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-text-primary">
                          {ndviVal !== null ? ndviVal.toFixed(3) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-text-primary">
                          {treeVal !== null ? Math.round(treeVal) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-text-primary">
                          {spVal !== null ? Math.round(spVal) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-text-primary">
                          {canVal !== null ? `${canVal.toFixed(1)}%` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                  {filteredObservations.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-text-muted">
                        No observations match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showAddObsModal && (
        <AddObservationModal
          siteId={siteId!}
          siteName={site.name}
          onClose={() => setShowAddObsModal(false)}
          onSuccess={() => {
            refetchAnalytics()
            refetchObservations()
          }}
        />
      )}
    </AppShell>
  )
}
