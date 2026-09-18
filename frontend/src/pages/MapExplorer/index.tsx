import { useCallback, useRef, useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Badge, statusBadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MapGL, type MapGLHandle } from '@/components/map/MapGL'
import { AddSiteModal } from '@/components/sites/AddSiteModal'
import { useAuth } from '@/context/AuthContext'
import { sitesService } from '@/services/sites'
import { projectsService } from '@/services/projects'
import { satelliteService, type SatelliteScene, type SARScene } from '@/services/satellite'
import type { SiteGeoJSONFeature } from '@/types/site'
import type { MapStyleKey } from '@/config/mapbox'
import {
  Satellite,
  Map as MapIcon,
  Mountain,
  Search,
  Layers,
  Plus,
  Compass,
  FolderKanban,
  Tag,
  Maximize2,
  Cpu,
  Radio,
  Sliders,
  CheckCircle2,
  Cloud,
  Sparkles,
  Flame,
  Activity,
  Zap,
} from 'lucide-react'

const STATUS_FILTERS = ['ALL', 'ACTIVE', 'UNDER_REVIEW', 'INACTIVE'] as const

export default function MapExplorerPage() {
  const { activeOrg } = useAuth()
  const qc = useQueryClient()
  const mapRef = useRef<MapGLHandle>(null)

  const [bbox, setBbox] = useState<string | undefined>()
  const [mapStyle, setMapStyle] = useState<MapStyleKey>('satellite')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [projectFilter, setProjectFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSite, setSelectedSite] = useState<SiteGeoJSONFeature | null>(null)
  const [showLabels, setShowLabels] = useState(true)
  const [showOutlines, setShowOutlines] = useState(true)

  // Satellite Raster Pipeline state
  const [enableSatelliteOverlay, setEnableSatelliteOverlay] = useState(false)
  const [sensorType, setSensorType] = useState<'sentinel-2' | 'sentinel-1-sar'>('sentinel-2')
  const [satelliteBandMode, setSatelliteBandMode] = useState<'visual' | 'ndvi'>('visual')
  const [sarPolarization, setSarPolarization] = useState<'vv' | 'vh'>('vv')
  const [satelliteOpacity, setSatelliteOpacity] = useState(0.85)

  const [activeScene, setActiveScene] = useState<SatelliteScene | null>(null)
  const [activeSarScene, setActiveSarScene] = useState<SARScene | null>(null)
  const [isFetchingScene, setIsFetchingScene] = useState(false)

  // NASA FIRMS Wildfire Alerts state
  const [enableWildfires, setEnableWildfires] = useState(true)

  // Vector Tile Engine state (GeoJSON vs PostGIS MVT)
  const [renderingEngine, setRenderingEngine] = useState<'geojson' | 'mvt'>('geojson')

  // Add Site Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [targetProjectId, setTargetProjectId] = useState<string>('')

  // 1. Load Projects for organization
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', activeOrg?.id],
    queryFn: () => projectsService.list(activeOrg!.id),
    enabled: !!activeOrg,
  })

  // 2. Load Map Sites with Viewport Bounding Box
  const { data: rawFeatures = [], isLoading: isSitesLoading } = useQuery({
    queryKey: ['map-sites', activeOrg?.id, bbox],
    queryFn: () => sitesService.getMapFeatures(activeOrg!.id, bbox),
    enabled: !!activeOrg,
  })

  // 3. Load NASA FIRMS Active Wildfires
  const { data: wildfireData } = useQuery({
    queryKey: ['wildfires', bbox],
    queryFn: () => satelliteService.getViewportWildfires(bbox),
    refetchInterval: 60000, // refresh every minute
  })

  // 4. Load Selected Site Wildfire Proximity Alert
  const { data: siteWildfireAlert } = useQuery({
    queryKey: ['site-wildfires', selectedSite?.id],
    queryFn: () => satelliteService.getSiteWildfires(String(selectedSite!.id), 30),
    enabled: !!selectedSite?.id,
  })

  // Filter features client-side by status, project, and search keyword
  const filteredFeatures = useMemo(() => {
    return rawFeatures.filter((f) => {
      const matchStatus = statusFilter === 'ALL' || f.properties.status === statusFilter
      const matchProject = projectFilter === 'ALL' || f.properties.project_id === projectFilter
      const matchQuery =
        !searchQuery || f.properties.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchStatus && matchProject && matchQuery
    })
  }, [rawFeatures, statusFilter, projectFilter, searchQuery])

  const handleBoundsChange = useCallback((newBbox: string) => {
    setBbox(newBbox)
  }, [])

  // MVT vector tile URL template
  const mvtSourceUrl = useMemo(() => {
    if (!activeOrg) return null
    return satelliteService.getVectorTileUrl(activeOrg.id)
  }, [activeOrg])

  // Fetch Copernicus Remote Sensing Scene (Sentinel-2 Optical or Sentinel-1 SAR Radar)
  useEffect(() => {
    if (!enableSatelliteOverlay) {
      setActiveScene(null)
      setActiveSarScene(null)
      return
    }

    let isMounted = true
    setIsFetchingScene(true)

    const fetchScene = async () => {
      try {
        let searchBbox = [76.0, 10.5, 77.2, 11.8]
        if (bbox) {
          const parts = bbox.split(',').map(Number)
          if (parts.length === 4 && !parts.some(isNaN)) {
            searchBbox = parts
          }
        }

        if (sensorType === 'sentinel-2') {
          if (selectedSite?.id) {
            const res = await satelliteService.getSiteSatellite(String(selectedSite.id), 35)
            if (isMounted && res.scene) {
              setActiveScene(res.scene)
              setIsFetchingScene(false)
              return
            }
          }
          const res = await satelliteService.searchScenes({
            bbox: searchBbox,
            maxCloudCover: 35,
            limit: 1,
          })
          if (isMounted && res.scenes && res.scenes.length > 0) {
            setActiveScene(res.scenes[0])
          }
        } else {
          // Sentinel-1 SAR Radar
          if (selectedSite?.id) {
            const res = await satelliteService.getSiteSAR(String(selectedSite.id), sarPolarization)
            if (isMounted && res.scene) {
              setActiveSarScene(res.scene)
              setIsFetchingScene(false)
              return
            }
          }
          const res = await satelliteService.searchSARScenes({
            bbox: searchBbox,
            polarization: sarPolarization,
            limit: 1,
          })
          if (isMounted && res.scenes && res.scenes.length > 0) {
            setActiveSarScene(res.scenes[0])
          }
        }
      } catch (err) {
        console.warn('Could not fetch Copernicus scene:', err)
      } finally {
        if (isMounted) setIsFetchingScene(false)
      }
    }

    fetchScene()

    return () => {
      isMounted = false
    }
  }, [enableSatelliteOverlay, sensorType, sarPolarization, selectedSite?.id, bbox])

  // Active raster tile URL based on chosen sensor & band mode
  const activeRasterUrl = useMemo(() => {
    if (!enableSatelliteOverlay) return null
    if (sensorType === 'sentinel-2' && activeScene) {
      return satelliteBandMode === 'ndvi' ? activeScene.ndvi_tile_url : activeScene.tile_url
    }
    if (sensorType === 'sentinel-1-sar' && activeSarScene) {
      return activeSarScene.tile_url
    }
    return null
  }, [enableSatelliteOverlay, sensorType, activeScene, activeSarScene, satelliteBandMode])

  // Calculate polygon centroid to fly to
  const flyToSite = useCallback((feature: SiteGeoJSONFeature) => {
    setSelectedSite(feature)
    try {
      let coords: [number, number] | null = null
      if (feature.geometry.type === 'MultiPolygon') {
        const ring = (feature.geometry.coordinates as number[][][][])[0][0]
        const avgX = ring.reduce((acc: number, c: number[]) => acc + c[0], 0) / ring.length
        const avgY = ring.reduce((acc: number, c: number[]) => acc + c[1], 0) / ring.length
        coords = [avgX, avgY]
      } else if (feature.geometry.type === 'Polygon') {
        const ring = (feature.geometry.coordinates as number[][][])[0]
        const avgX = ring.reduce((acc: number, c: number[]) => acc + c[0], 0) / ring.length
        const avgY = ring.reduce((acc: number, c: number[]) => acc + c[1], 0) / ring.length
        coords = [avgX, avgY]
      }
      if (coords && mapRef.current) {
        mapRef.current.flyTo(coords, 12)
      }
    } catch {
      // Fallback
    }
  }, [])

  const handleSiteCreated = (newSite?: any) => {
    qc.invalidateQueries({ queryKey: ['map-sites'] })
    if (newSite) {
      if (newSite.geometry?.coordinates) {
        try {
          const ring = newSite.geometry.coordinates[0][0] || newSite.geometry.coordinates[0]
          const avgX = ring.reduce((acc: number, c: number[]) => acc + c[0], 0) / ring.length
          const avgY = ring.reduce((acc: number, c: number[]) => acc + c[1], 0) / ring.length
          mapRef.current?.flyTo([avgX, avgY], 13)
        } catch {
          // Fallback
        }
      }
    }
  }

  const activeFireCount = wildfireData?.fires?.length ?? 0

  return (
    <AppShell>
      <TopBar
        title="Portfolio Map & Earth Observatory"
        subtitle={`${filteredFeatures.length} sites in viewport · Real-time PostGIS MVT, Sentinel-1/2 STAC & NASA FIRMS`}
        actions={
          <div className="flex items-center gap-2">
            {/* Basemap style switcher */}
            <div className="flex items-center gap-1 bg-bg-elevated border border-border rounded-md p-1">
              {(
                [
                  { key: 'standard', icon: MapIcon, label: 'Standard' },
                  { key: 'satellite', icon: Satellite, label: 'Satellite' },
                  { key: 'terrain', icon: Mountain, label: 'Terrain' },
                ] as const
              ).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setMapStyle(key)}
                  title={label}
                  className={`p-1.5 rounded transition-colors flex items-center gap-1.5 text-xs ${
                    mapStyle === key
                      ? 'bg-bg-overlay text-text-primary font-medium shadow-sm'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Quick Draw Site button */}
            {projects.length > 0 && (
              <Button
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  setTargetProjectId(projectFilter !== 'ALL' ? projectFilter : projects[0].id)
                  setIsAddModalOpen(true)
                }}
              >
                Draw Site
              </Button>
            )}
          </div>
        }
      />

      <div className="flex-1 p-4 flex flex-col gap-3">
        {/* Top Control Bar: Filters, Vector Engine, Copernicus Sensor, and NASA FIRMS */}
        <div className="flex items-center justify-between gap-3 flex-wrap bg-bg-surface border border-border rounded-lg p-2.5 shadow-sm">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Project Filter */}
            <div className="flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-accent-green" />
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="bg-bg-elevated border border-border rounded-md px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:border-accent-green"
              >
                <option value="ALL">All Projects ({projects.length})</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-text-muted flex items-center gap-1 mr-1">
                <Layers className="w-3.5 h-3.5 text-text-muted" /> Status:
              </span>
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-0.5 rounded text-xs font-medium transition-all ${
                    statusFilter === s
                      ? 'bg-accent-emerald text-white'
                      : 'text-text-muted hover:text-text-secondary bg-bg-elevated'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Vector Tile Server Toggle (GeoJSON vs PostGIS MVT) */}
            <div className="flex items-center gap-1 bg-bg-elevated border border-border rounded-md p-0.5 text-xs">
              <span className="px-2 py-0.5 text-[11px] text-text-muted flex items-center gap-1">
                <Cpu className="w-3 h-3 text-accent-emerald" /> Engine:
              </span>
              <button
                onClick={() => setRenderingEngine('geojson')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  renderingEngine === 'geojson'
                    ? 'bg-bg-overlay text-accent-green border border-border shadow-xs'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
                title="Direct GeoJSON feature payload"
              >
                GeoJSON
              </button>
              <button
                onClick={() => setRenderingEngine('mvt')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
                  renderingEngine === 'mvt'
                    ? 'bg-accent-emerald text-white shadow-xs'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
                title="PostGIS MVT binary vector tiles (.pbf)"
              >
                <span>PostGIS MVT</span>
                <span className="text-[9px] bg-white/20 px-1 rounded">.pbf</span>
              </button>
            </div>

            {/* Copernicus STAC Remote Sensing Stream Toggle */}
            <button
              onClick={() => setEnableSatelliteOverlay(!enableSatelliteOverlay)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all flex items-center gap-1.5 ${
                enableSatelliteOverlay
                  ? 'bg-emerald-950/80 border-accent-green text-accent-green shadow-[0_0_12px_rgba(63,185,80,0.25)]'
                  : 'bg-bg-elevated border-border text-text-muted hover:text-text-secondary'
              }`}
            >
              <Satellite
                className={`w-3.5 h-3.5 ${enableSatelliteOverlay ? 'animate-pulse text-accent-green' : ''}`}
              />
              <span>Copernicus Stream</span>
              {enableSatelliteOverlay && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-green animate-ping" />
              )}
            </button>

            {/* NASA FIRMS Active Wildfire Toggle */}
            <button
              onClick={() => setEnableWildfires(!enableWildfires)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all flex items-center gap-1.5 ${
                enableWildfires
                  ? 'bg-red-950/70 border-red-500/60 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                  : 'bg-bg-elevated border-border text-text-muted hover:text-text-secondary'
              }`}
            >
              <Flame
                className={`w-3.5 h-3.5 ${enableWildfires ? 'text-red-400 animate-pulse' : 'text-text-muted'}`}
              />
              <span>NASA FIRMS Fires</span>
              {activeFireCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {activeFireCount}
                </span>
              )}
            </button>

            {/* Outlines & Labels */}
            <div className="hidden xl:flex items-center gap-2 border-l border-border pl-3 text-xs text-text-muted">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                  className="rounded border-border bg-bg-elevated text-accent-green focus:ring-0 w-3.5 h-3.5"
                />
                <span>Labels</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showOutlines}
                  onChange={(e) => setShowOutlines(e.target.checked)}
                  className="rounded border-border bg-bg-elevated text-accent-green focus:ring-0 w-3.5 h-3.5"
                />
                <span>Outlines</span>
              </label>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search sites in view..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-elevated border border-border rounded-md pl-8 pr-3 py-1 text-xs text-text-primary focus:outline-none focus:border-accent-green"
            />
          </div>
        </div>

        {/* Map Container & Interactive Site Card / Sidebar */}
        <div className="flex-1 flex gap-4 min-h-[520px]">
          {/* Main MapGL Canvas */}
          <div className="flex-1 card overflow-hidden relative border border-border shadow-inner">
            <MapGL
              ref={mapRef}
              features={filteredFeatures}
              selectedSiteId={selectedSite?.id ? String(selectedSite.id) : null}
              onSiteClick={(feat) => setSelectedSite(feat)}
              onBoundsChange={handleBoundsChange}
              style={mapStyle}
              showLabels={showLabels}
              showOutlines={showOutlines}
              center={[76.5, 11.5]}
              zoom={7}
              // Satellite raster pipeline
              rasterTileUrl={activeRasterUrl}
              rasterOpacity={satelliteOpacity}
              // Vector Tile server
              renderingMode={renderingEngine}
              mvtSourceUrl={mvtSourceUrl}
              // NASA FIRMS Wildfire points
              wildfires={wildfireData?.fires || []}
              showWildfires={enableWildfires}
            />

            {/* Live Copernicus STAC Stream Telemetry Overlay */}
            {enableSatelliteOverlay && (
              <div className="absolute top-3 left-3 z-10 glass rounded-lg p-3 border border-accent-green/40 shadow-2xl backdrop-blur-md max-w-sm text-xs space-y-2.5 animate-slide-up">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5 font-semibold text-text-primary">
                    <Radio className="w-3.5 h-3.5 text-accent-green animate-pulse" />
                    <span>Copernicus Earth Observation</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-green/20 text-accent-green font-mono font-bold">
                    LIVE STAC
                  </span>
                </div>

                {/* Sensor Switcher (Sentinel-2 Optical vs Sentinel-1 SAR Radar) */}
                <div className="flex items-center gap-1 bg-bg-elevated p-1 rounded-md border border-border">
                  <button
                    onClick={() => setSensorType('sentinel-2')}
                    className={`flex-1 py-1 rounded text-[10px] font-medium transition-all flex items-center justify-center gap-1 ${
                      sensorType === 'sentinel-2'
                        ? 'bg-accent-emerald text-white shadow-xs'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" /> Sentinel-2 Optical
                  </button>
                  <button
                    onClick={() => setSensorType('sentinel-1-sar')}
                    className={`flex-1 py-1 rounded text-[10px] font-medium transition-all flex items-center justify-center gap-1 ${
                      sensorType === 'sentinel-1-sar'
                        ? 'bg-accent-emerald text-white shadow-xs'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    <Zap className="w-3 h-3" /> Sentinel-1 SAR Radar
                  </button>
                </div>

                {isFetchingScene ? (
                  <div className="py-2 text-center text-text-muted text-[11px] animate-pulse">
                    Querying Microsoft Planetary Computer STAC catalog…
                  </div>
                ) : sensorType === 'sentinel-2' && activeScene ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-text-muted block text-[10px]">Sensor / Level</span>
                        <span className="text-text-primary font-medium">
                          {activeScene.platform} L2A
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[10px]">Resolution</span>
                        <span className="text-text-primary font-medium">10m Multi-Spectral</span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[10px]">Acquisition</span>
                        <span className="text-text-primary font-mono text-[10px]">
                          {activeScene.datetime
                            ? new Date(activeScene.datetime).toISOString().split('T')[0]
                            : 'Recent'}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[10px]">Cloud Cover</span>
                        <span className="text-text-primary font-medium flex items-center gap-1">
                          <Cloud className="w-3 h-3 text-text-muted" />
                          {activeScene.cloud_cover_pct}%
                        </span>
                      </div>
                    </div>

                    {/* Band Combination Switcher */}
                    <div className="pt-1.5 border-t border-white/10 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-text-muted flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-accent-emerald" /> Spectral:
                      </span>
                      <div className="flex items-center gap-1 bg-bg-elevated p-0.5 rounded">
                        <button
                          onClick={() => setSatelliteBandMode('visual')}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                            satelliteBandMode === 'visual'
                              ? 'bg-accent-emerald text-white'
                              : 'text-text-muted hover:text-text-secondary'
                          }`}
                        >
                          RGB True Color
                        </button>
                        <button
                          onClick={() => setSatelliteBandMode('ndvi')}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                            satelliteBandMode === 'ndvi'
                              ? 'bg-accent-emerald text-white'
                              : 'text-text-muted hover:text-text-secondary'
                          }`}
                        >
                          NDVI NIR/Red
                        </button>
                      </div>
                    </div>
                  </div>
                ) : sensorType === 'sentinel-1-sar' && activeSarScene ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-text-muted block text-[10px]">Sensor / Band</span>
                        <span className="text-text-primary font-medium">Sentinel-1 C-Band SAR</span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[10px]">Cloud Penetration</span>
                        <span className="text-accent-green font-medium">100% All-Weather</span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[10px]">Acquisition</span>
                        <span className="text-text-primary font-mono text-[10px]">
                          {activeSarScene.datetime
                            ? new Date(activeSarScene.datetime).toISOString().split('T')[0]
                            : 'Recent'}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[10px]">Polarization</span>
                        <span className="text-text-primary font-mono text-[10px] font-semibold">
                          {activeSarScene.active_polarization}
                        </span>
                      </div>
                    </div>

                    {/* Polarization Switcher */}
                    <div className="pt-1.5 border-t border-white/10 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-text-muted flex items-center gap-1">
                        <Activity className="w-3 h-3 text-accent-emerald" /> Channel:
                      </span>
                      <div className="flex items-center gap-1 bg-bg-elevated p-0.5 rounded">
                        <button
                          onClick={() => setSarPolarization('vv')}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                            sarPolarization === 'vv'
                              ? 'bg-accent-emerald text-white'
                              : 'text-text-muted hover:text-text-secondary'
                          }`}
                          title="Vertical transmit, Vertical receive (surface roughness)"
                        >
                          VV Co-pol
                        </button>
                        <button
                          onClick={() => setSarPolarization('vh')}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                            sarPolarization === 'vh'
                              ? 'bg-accent-emerald text-white'
                              : 'text-text-muted hover:text-text-secondary'
                          }`}
                          title="Vertical transmit, Horizontal receive (canopy volume scattering)"
                        >
                          VH Cross-pol
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-text-muted py-1">
                    No active satellite scenes found for current viewport coordinates.
                  </div>
                )}

                {/* Opacity Slider */}
                <div className="flex items-center justify-between gap-2 text-[10px] text-text-muted pt-1 border-t border-white/10">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-2.5 h-2.5" /> Opacity:{' '}
                    {Math.round(satelliteOpacity * 100)}%
                  </span>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={satelliteOpacity}
                    onChange={(e) => setSatelliteOpacity(parseFloat(e.target.value))}
                    className="w-24 accent-accent-green h-1 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Active Engine Badge */}
            <div className="absolute top-3 right-12 z-10 glass rounded-md px-2 py-1 text-[11px] text-text-secondary border border-border flex items-center gap-1.5 shadow-md">
              <CheckCircle2 className="w-3 h-3 text-accent-green" />
              <span>
                {renderingEngine === 'mvt'
                  ? 'PostGIS MVT Vector Pipeline'
                  : 'GeoJSON Direct Pipeline'}
              </span>
            </div>

            {/* NASA FIRMS Floating Alert Pill if active fires detected */}
            {enableWildfires && activeFireCount > 0 && (
              <div className="absolute bottom-12 left-3 z-10 glass rounded-md px-3 py-1.5 text-xs text-red-400 border border-red-500/50 flex items-center gap-2 shadow-lg backdrop-blur-md animate-pulse">
                <Flame className="w-4 h-4 text-red-500" />
                <span>
                  <strong>{activeFireCount} Active Thermal Anomalies</strong> tracked via NASA
                  VIIRS/MODIS
                </span>
              </div>
            )}

            {/* Viewport counter floating badge */}
            <div className="absolute bottom-3 right-12 z-10 glass rounded-md px-2.5 py-1 text-[11px] text-text-secondary border border-border flex items-center gap-1.5 shadow-md">
              <Compass className="w-3.5 h-3.5 text-accent-green" />
              <span>
                {isSitesLoading
                  ? 'Loading viewport…'
                  : `${filteredFeatures.length} sites in viewport`}
              </span>
            </div>
          </div>

          {/* Site Inspection Card / Quick Selection Drawer */}
          <div className="w-84 flex flex-col gap-3">
            {selectedSite ? (
              <div className="card p-4 space-y-3.5 animate-slide-up flex flex-col justify-between shadow-lg border border-border">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                      Selected Site
                    </span>
                    <button
                      onClick={() => setSelectedSite(null)}
                      className="text-text-muted hover:text-text-primary text-xs p-1"
                    >
                      ✕
                    </button>
                  </div>

                  <h3 className="text-text-primary text-base font-semibold leading-snug">
                    {selectedSite.properties.name}
                  </h3>

                  <div className="flex items-center gap-2">
                    <Badge variant={statusBadgeVariant(selectedSite.properties.status)} dot>
                      {selectedSite.properties.status}
                    </Badge>

                    {/* NASA FIRMS Real-Time Fire Threat Badge */}
                    {siteWildfireAlert && (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                          siteWildfireAlert.threat_level === 'CRITICAL'
                            ? 'bg-red-950 text-red-400 border border-red-500 animate-pulse'
                            : siteWildfireAlert.threat_level === 'HIGH'
                              ? 'bg-orange-950 text-orange-400 border border-orange-500'
                              : siteWildfireAlert.threat_level === 'MODERATE'
                                ? 'bg-amber-950 text-amber-400 border border-amber-500'
                                : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        <Flame className="w-3 h-3" />
                        {siteWildfireAlert.threat_level === 'NONE'
                          ? 'Zero Wildfire Threats'
                          : `${siteWildfireAlert.threat_level} FIRE THREAT (${siteWildfireAlert.active_fire_count})`}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5 text-xs bg-bg-elevated p-3 rounded-lg border border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted">Calculated Area</span>
                      <span className="text-text-primary font-semibold">
                        {selectedSite.properties.area_hectares
                          ? `${Number(selectedSite.properties.area_hectares).toFixed(2)} ha`
                          : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted">Geometry</span>
                      <span className="text-text-primary font-medium">PostGIS MultiPolygon</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted">Spatial Ref</span>
                      <span className="text-text-primary font-mono text-[11px]">SRID 4326</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted">Vector Engine</span>
                      <span className="text-accent-emerald font-mono text-[11px]">
                        {renderingEngine === 'mvt' ? 'MVT Mapbox PBF' : 'GeoJSON Envelope'}
                      </span>
                    </div>
                  </div>

                  {/* Remote Sensing Controls for Selected Site */}
                  <div className="p-2.5 rounded-lg border border-accent-green/30 bg-emerald-950/30 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-text-primary font-medium flex items-center gap-1.5">
                        <Satellite className="w-3.5 h-3.5 text-accent-green" />
                        Copernicus Stream
                      </span>
                      <button
                        onClick={() => {
                          setEnableSatelliteOverlay(true)
                          flyToSite(selectedSite)
                        }}
                        className="text-[11px] text-accent-green font-semibold hover:underline"
                      >
                        {enableSatelliteOverlay ? 'Active on Map' : 'Load Tiles'}
                      </button>
                    </div>
                    <p className="text-[11px] text-text-muted">
                      Dual optical & C-Band SAR radar surface backscatter from Microsoft Planetary
                      Computer.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Maximize2 className="w-3.5 h-3.5" />}
                    onClick={() => flyToSite(selectedSite)}
                    className="w-full justify-center"
                  >
                    Focus Site on Map
                  </Button>
                  <Link
                    to={`/app/projects/${selectedSite.properties.project_id}/sites/${selectedSite.id}`}
                    className="w-full"
                  >
                    <Button size="sm" className="w-full justify-center">
                      Inspect Telemetry &rarr;
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="card p-4 flex-1 flex flex-col border border-border">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-accent-green" /> Sites in View (
                    {filteredFeatures.length})
                  </h4>
                </div>

                <div className="flex-1 overflow-y-auto mt-2 space-y-1.5 pr-1 max-h-[440px]">
                  {filteredFeatures.length === 0 ? (
                    <div className="p-6 text-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-accent-green/10 border border-accent-green/20 flex items-center justify-center mx-auto text-accent-green">
                        <Compass className="w-5 h-5" />
                      </div>
                      <p className="text-text-primary text-xs font-semibold">
                        No sites in current view
                      </p>
                      <p className="text-text-muted text-[11px] leading-relaxed">
                        Draw your first boundary polygon on the real satellite map or pan to your
                        project location.
                      </p>
                      {projects.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setTargetProjectId(projects[0].id)
                            setIsAddModalOpen(true)
                          }}
                          className="btn-primary text-xs py-1.5 px-3 mx-auto flex items-center gap-1.5 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add New Site</span>
                        </button>
                      ) : (
                        <Link
                          to="/app/projects"
                          className="btn-secondary text-xs py-1.5 px-3 mx-auto inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create First Project</span>
                        </Link>
                      )}
                    </div>
                  ) : (
                    filteredFeatures.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => flyToSite(f)}
                        className="p-2.5 rounded-lg bg-bg-elevated hover:bg-bg-overlay border border-transparent hover:border-border cursor-pointer transition-all flex items-center justify-between text-xs"
                      >
                        <div className="truncate pr-2">
                          <p className="font-medium text-text-primary truncate">
                            {f.properties.name}
                          </p>
                          <p className="text-[11px] text-text-muted">
                            {f.properties.area_hectares
                              ? `${Number(f.properties.area_hectares).toFixed(1)} ha`
                              : '—'}
                          </p>
                        </div>
                        <Badge variant={statusBadgeVariant(f.properties.status)}>
                          {f.properties.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Site Modal */}
      {isAddModalOpen && targetProjectId && (
        <AddSiteModal
          projectId={targetProjectId}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleSiteCreated}
        />
      )}
    </AppShell>
  )
}
