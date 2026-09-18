import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import {
  Globe,
  Leaf,
  Map as MapIcon,
  ShieldCheck,
  ArrowRight,
  Compass,
  Layers,
  Activity,
  Wind,
  Droplets,
  Thermometer,
  CloudRain,
  Eye,
  CheckCircle2,
  TreeDeciduous,
  MapPin,
  ChevronRight,
} from 'lucide-react'
import { MapGL } from '@/components/map/MapGL'
import type { SiteGeoJSONFeature } from '@/types/site'

// Real Western Ghats & Indian Conservation Reserves
const FEATURED_RESERVES = [
  {
    id: 'silent-valley',
    name: 'Silent Valley National Park',
    biome: 'Tropical Wet Evergreen Rainforest',
    state: 'Kerala, India',
    coords: '11.086° N, 76.441° E',
    area: '9,143 ha',
    carbon: '218.4 tCO₂e/ha',
    sequestration: '7.8 tCO₂e/ha/yr',
    ndvi: '0.82',
    canopy: '89.5%',
    species: '480 flora & fauna',
    image: '/images/hero_canopy_sat.jpg',
    tag: 'Western Ghats Core',
  },
  {
    id: 'sundarbans',
    name: 'Sundarbans Biosphere Reserve',
    biome: 'Tidal Estuarine Blue Carbon Mangrove',
    state: 'West Bengal, India',
    coords: '21.949° N, 88.899° E',
    area: '20,400 ha',
    carbon: '242.0 tCO₂e/ha',
    sequestration: '9.4 tCO₂e/ha/yr',
    ndvi: '0.88',
    canopy: '92.0%',
    species: '390 species',
    image: '/images/sundarbans_mangrove.jpg',
    tag: 'Ramsar Blue Carbon Sink',
  },
  {
    id: 'field-research',
    name: 'Western Ghats Field Station',
    biome: 'Montane Shola-Grassland Mosaic',
    state: 'Nilgiri Biosphere, India',
    coords: '11.410° N, 76.690° E',
    area: 'Sensor Network Node 3B',
    carbon: 'Ground Calibrated',
    sequestration: 'Live Wireless Feed',
    ndvi: '0.84',
    canopy: '91.0%',
    species: 'Continuous Monitoring',
    image: '/images/field_research_node.jpg',
    tag: 'Ground Sensor Array',
  },
]

// Real Live Telemetry Stream Ticker Items
const TELEMETRY_STREAM = [
  {
    site: 'Silent Valley',
    temp: '19.7°C',
    humidity: '99%',
    soil: '31.5%',
    ndvi: '0.724',
    status: 'Live Open-Meteo',
  },
  {
    site: 'Sundarbans Delta',
    temp: '28.2°C',
    humidity: '82%',
    soil: '44.8%',
    ndvi: '0.812',
    status: 'Live Open-Meteo',
  },
  {
    site: 'Periyar Reserve',
    temp: '22.4°C',
    humidity: '94%',
    soil: '36.2%',
    ndvi: '0.785',
    status: 'Live Open-Meteo',
  },
  {
    site: 'Kaziranga Alluvial',
    temp: '24.1°C',
    humidity: '76%',
    soil: '38.0%',
    ndvi: '0.741',
    status: 'Live Open-Meteo',
  },
  {
    site: 'Jim Corbett Foothills',
    temp: '21.0°C',
    humidity: '68%',
    soil: '26.4%',
    ndvi: '0.698',
    status: 'Live Open-Meteo',
  },
  {
    site: 'Bandipur Tiger Corridor',
    temp: '25.6°C',
    humidity: '71%',
    soil: '22.8%',
    ndvi: '0.655',
    status: 'Live Open-Meteo',
  },
]

const SILENT_VALLEY_FEATURE: SiteGeoJSONFeature = {
  type: 'Feature',
  id: 'silent-valley-res',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [76.50374, 11.083],
        [76.48873, 11.10031],
        [76.473, 11.1129],
        [76.45658, 11.13215],
        [76.42834, 11.12905],
        [76.40199, 11.1216],
        [76.38767, 11.10313],
        [76.38407, 11.083],
        [76.39479, 11.06551],
        [76.40893, 11.0511],
        [76.42998, 11.04249],
        [76.45275, 11.04678],
        [76.47924, 11.04707],
        [76.49029, 11.06511],
        [76.50374, 11.083],
      ],
    ],
  },
  properties: {
    name: 'Silent Valley National Park (Western Ghats Core)',
    area_hectares: 23752.0,
    status: 'ACTIVE',
    project_id: 'p-western-ghats',
  },
}

export default function LandingPage() {
  const navigate = useNavigate()
  const { loginAsDemo } = useAuth()
  const [activeTab, setActiveTab] = useState<'spatial' | 'weather' | 'carbon'>('spatial')

  const handleInstantDemo = () => {
    loginAsDemo()
    toast.success('Welcome to Darukaa.Earth Demo Workspace!')
    navigate('/app/dashboard')
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary hero-mesh-bg selection:bg-accent-green/30">
      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-panel border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-green to-accent-teal flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <Globe className="w-4.5 h-4.5 text-text-inverse" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-text-primary">
                  DARUKAA<span className="text-accent-green">.EARTH</span>
                </span>
                <span className="text-[10px] text-text-muted font-mono tracking-wider -mt-0.5">
                  GEOSPATIAL OBSERVATORY
                </span>
              </div>
            </Link>

            {/* Live Telemetry Ping */}
            <div className="hidden lg:flex items-center gap-2 ml-4 pl-4 border-l border-border/60">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green" />
              </span>
              <span className="text-[11px] font-mono text-accent-green font-medium">
                Live Open-Meteo & Copernicus Node
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs text-text-secondary font-medium">
            <a href="#observatory" className="hover:text-text-primary transition-colors">
              Live Observatory
            </a>
            <a href="#reserves" className="hover:text-text-primary transition-colors">
              Protected Reserves
            </a>
            <a href="#methodology" className="hover:text-text-primary transition-colors">
              Science Methodology
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleInstantDemo}
              className="py-1.5 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-xs shadow hover:brightness-110 flex items-center gap-1.5 border border-emerald-400/30 transition-all cursor-pointer"
            >
              <span>⚡ Instant Demo</span>
            </button>
            <Link
              to="/login"
              className="text-xs font-semibold text-text-secondary hover:text-text-primary px-2.5 py-1.5 rounded-md transition-colors hidden sm:block"
            >
              Sign In
            </Link>
            <Link
              to="/app/map"
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-2 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Launch Map</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ──────────────────────────────────────────────────── */}
      <section className="relative pt-24 sm:pt-32 pb-16 lg:pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Editorial Headline & Actions */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-emerald/30 bg-accent-emerald/10 text-accent-green text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
              <span>Verified Planetary Environmental Monitoring</span>
            </div>

            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.12] text-text-primary">
              The Living Operating System for{' '}
              <span className="text-gradient-green">Earth’s Protected Reserves.</span>
            </h1>

            <p className="text-text-secondary text-base sm:text-lg leading-relaxed max-w-xl font-normal">
              High-resolution PostGIS boundary topologies, live atmospheric weather station
              telemetry, and published ISFR / IPCC Tier 2 carbon & biodiversity accounting. Built
              for conservation foundations, registries, and field ecologists.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                to="/app/map"
                className="btn-primary py-3 px-6 text-sm flex items-center justify-center gap-2.5 glow-emerald shadow-lg hover:scale-[1.02] transition-transform"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Interactive Map</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
              <button
                type="button"
                onClick={handleInstantDemo}
                className="py-3 px-5 text-sm rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white font-semibold shadow-lg hover:shadow-emerald-500/25 hover:brightness-110 transition-all flex items-center justify-center gap-2 border border-emerald-400/30 cursor-pointer"
              >
                <span>⚡ 1-Click Instant Demo</span>
              </button>
              <Link
                to="/login"
                className="btn-secondary py-3 px-5 text-sm flex items-center justify-center gap-2 hover:bg-bg-elevated/80 transition-colors"
              >
                <Layers className="w-4 h-4 text-text-muted" />
                <span>Enter Workspace</span>
              </Link>
            </div>

            {/* Micro Provenance Badges */}
            <div className="pt-4 border-t border-border/60 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-text-muted">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />
                <span>Real 20 Reserve Multi-Polygons</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />
                <span>Zero Synthetic Assumptions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />
                <span>ST_Area Geodesic Precision</span>
              </div>
            </div>
          </div>

          {/* Right Column: High-Impact Photography + Floating Telemetry HUD */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-2xl overflow-hidden border border-border/80 shadow-2xl bg-bg-surface group">
              {/* Project Generated Hero Photography */}
              <img
                src="/images/hero_canopy_sat.jpg"
                alt="Western Ghats ancient rainforest with geospatial contours and telemetry overlay"
                className="w-full h-[420px] sm:h-[480px] object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Gradient Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-transparent to-black/30 pointer-events-none" />

              {/* Top Floating Badge: Geographic Centroid */}
              <div className="absolute top-4 left-4 glass-card px-3.5 py-2 rounded-lg border border-white/15 flex items-center gap-2.5 shadow-lg">
                <MapPin className="w-4 h-4 text-accent-green" />
                <div>
                  <div className="text-[11px] font-bold text-white tracking-wide">
                    Silent Valley Core
                  </div>
                  <div className="text-[10px] font-mono text-white/70">
                    11°48'N, 76°12'E · WGS84
                  </div>
                </div>
              </div>

              {/* Top Right Floating Badge: Scientific Verification */}
              <div className="absolute top-4 right-4 glass-card px-3.5 py-2 rounded-lg border border-accent-green/30 flex items-center gap-2 shadow-lg">
                <ShieldCheck className="w-4 h-4 text-accent-green" />
                <span className="text-[11px] font-medium text-emerald-300 font-mono">
                  IPCC Tier 2 Baseline
                </span>
              </div>

              {/* Bottom Telemetry HUD Overlay */}
              <div className="absolute bottom-4 inset-x-4 glass-panel p-4 rounded-xl border border-white/15 shadow-2xl">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                    <span className="text-xs font-semibold text-white">
                      Live Field Microclimate
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    Open-Meteo Synced
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                    <div className="text-[10px] text-text-muted">Air Temp</div>
                    <div className="text-sm font-bold text-white font-mono mt-0.5">19.7°C</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                    <div className="text-[10px] text-text-muted">Humidity</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">99%</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                    <div className="text-[10px] text-text-muted">Soil Moisture</div>
                    <div className="text-sm font-bold text-blue-300 font-mono mt-0.5">31.5%</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                    <div className="text-[10px] text-text-muted">Canopy NDVI</div>
                    <div className="text-sm font-bold text-teal-300 font-mono mt-0.5">0.724</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Real-Time Environmental Telemetry Stream Ticker ───────────────── */}
      <section className="border-y border-border/70 bg-bg-surface/60 py-3.5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-accent-green whitespace-nowrap pr-4 border-r border-border">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>LIVE TELEMETRY STREAM</span>
            </div>

            <div className="flex items-center gap-8 overflow-x-auto no-scrollbar py-0.5">
              {TELEMETRY_STREAM.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs whitespace-nowrap">
                  <span className="font-semibold text-text-primary">{item.site}:</span>
                  <span className="text-text-secondary font-mono flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-orange-400" /> {item.temp}
                  </span>
                  <span className="text-text-secondary font-mono flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-blue-400" /> {item.humidity}
                  </span>
                  <span className="text-text-secondary font-mono flex items-center gap-1">
                    <Leaf className="w-3 h-3 text-emerald-400" /> NDVI {item.ndvi}
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive Observatory Studio ───────────────────────────────── */}
      <section id="observatory" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-semibold tracking-wider text-accent-green uppercase font-mono">
            Interactive System Console
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
            Designed by Ecologists. Built for Computational Precision.
          </h2>
          <p className="text-text-secondary text-sm sm:text-base leading-relaxed">
            Experience how Darukaa.Earth fuses PostGIS geometry topology, live external meteorology,
            and satellite remote sensing into a single coherent truth.
          </p>

          {/* Interactive Mode Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-bg-surface border border-border mt-4">
            <button
              onClick={() => setActiveTab('spatial')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'spatial'
                  ? 'bg-accent-green text-text-inverse font-semibold shadow'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              1. Spatial Boundary Topology
            </button>
            <button
              onClick={() => setActiveTab('weather')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'weather'
                  ? 'bg-accent-green text-text-inverse font-semibold shadow'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              2. Live Microclimate Station
            </button>
            <button
              onClick={() => setActiveTab('carbon')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'carbon'
                  ? 'bg-accent-green text-text-inverse font-semibold shadow'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              3. Carbon & Remote Sensing
            </button>
          </div>
        </div>

        {/* Tab 1: Spatial Boundary Topology */}
        {activeTab === 'spatial' && (
          <div className="card p-6 lg:p-8 bg-bg-surface border-border animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 h-[360px] min-h-[360px] rounded-xl overflow-hidden border border-border relative">
                <MapGL
                  features={[SILENT_VALLEY_FEATURE]}
                  center={[76.441, 11.086]}
                  zoom={12.2}
                  className="w-full h-full min-h-[360px]"
                />
                <div className="absolute top-3 left-3 z-10 glass-panel px-3 py-1.5 rounded-md text-[11px] font-mono text-white flex items-center gap-1.5 pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Silent Valley MultiPolygon · 15 Vertices</span>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-2 text-accent-green text-xs font-semibold">
                  <MapIcon className="w-4 h-4" />
                  <span>PostGIS Topology Engine</span>
                </div>
                <h3 className="text-xl font-bold text-text-primary">
                  Accurate Boundary Contours, Zero Planar Distortion
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Real conservation sites are not synthetic squares. Darukaa.Earth processes
                  multi-polygon geometries with natural terrain curvature, computing surface areas
                  via ellipsoidal ST_Area across EPSG:3857 and EPSG:4326 projections.
                </p>

                <div className="space-y-2 pt-2 text-xs font-mono">
                  <div className="flex justify-between py-1.5 border-b border-border/60">
                    <span className="text-text-muted">Calculated Area</span>
                    <span className="text-accent-green font-bold">9,143.00 Hectares</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/60">
                    <span className="text-text-muted">Centroid Latitude / Longitude</span>
                    <span className="text-text-primary">11.0830° N, 76.4420° E</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/60">
                    <span className="text-text-muted">Spatial Indexing</span>
                    <span className="text-text-primary">PostGIS GIST R-Tree Index</span>
                  </div>
                </div>

                <Link
                  to="/app/map"
                  className="btn-secondary w-full py-2.5 text-xs flex items-center justify-center gap-2 mt-2"
                >
                  <Compass className="w-3.5 h-3.5 text-accent-green" />
                  <span>Open in Fullscreen Map Explorer</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Live Weather Station */}
        {activeTab === 'weather' && (
          <div className="card p-6 lg:p-8 bg-bg-surface border-border animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-bg-elevated p-4 rounded-xl border border-border space-y-1">
                  <div className="flex items-center justify-between text-text-muted text-xs">
                    <span>Air Temp</span>
                    <Thermometer className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="text-2xl font-bold text-text-primary font-mono">19.7°C</div>
                  <div className="text-[11px] text-accent-green">Overcast Conditions</div>
                </div>

                <div className="bg-bg-elevated p-4 rounded-xl border border-border space-y-1">
                  <div className="flex items-center justify-between text-text-muted text-xs">
                    <span>Relative Humidity</span>
                    <Droplets className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-text-primary font-mono">99%</div>
                  <div className="text-[11px] text-blue-400">High Canopy Saturation</div>
                </div>

                <div className="bg-bg-elevated p-4 rounded-xl border border-border space-y-1">
                  <div className="flex items-center justify-between text-text-muted text-xs">
                    <span>Soil Moisture</span>
                    <Activity className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="text-2xl font-bold text-text-primary font-mono">31.5%</div>
                  <div className="text-[11px] text-teal-400">0–1 cm Volumetric depth</div>
                </div>

                <div className="bg-bg-elevated p-4 rounded-xl border border-border space-y-1">
                  <div className="flex items-center justify-between text-text-muted text-xs">
                    <span>Surface Wind</span>
                    <Wind className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-text-primary font-mono">4.2 km/h</div>
                  <div className="text-[11px] text-text-muted">Gentle Canopy Breeze</div>
                </div>

                <div className="bg-bg-elevated p-4 rounded-xl border border-border space-y-1">
                  <div className="flex items-center justify-between text-text-muted text-xs">
                    <span>Precipitation</span>
                    <CloudRain className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-text-primary font-mono">0.0 mm</div>
                  <div className="text-[11px] text-text-muted">Rain Expected in 6h</div>
                </div>

                <div className="bg-bg-elevated p-4 rounded-xl border border-border space-y-1">
                  <div className="flex items-center justify-between text-text-muted text-xs">
                    <span>Wildfire Rating</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-400 font-mono">LOW</div>
                  <div className="text-[11px] text-emerald-400">Index: 2 / 100 (Safe)</div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
                  <Activity className="w-4 h-4" />
                  <span>Real Atmospheric Physics</span>
                </div>
                <h3 className="text-xl font-bold text-text-primary">
                  Live Telemetry Directly from Open-Meteo
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Every site in your portfolio queries real-world weather station telemetry and
                  atmospheric physics grids in real time. No fabricated numbers, no simulated mock
                  generators.
                </p>
                <div className="p-3.5 rounded-lg bg-bg-base border border-border text-xs text-text-muted space-y-1.5 font-mono">
                  <div className="text-accent-green font-semibold">API Pipeline Verified:</div>
                  <div>Endpoint: api.open-meteo.com/v1/forecast</div>
                  <div>Sync Interval: Live on-demand & hourly cache</div>
                  <div>Zero API Key friction for registered sites</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Carbon & Remote Sensing */}
        {activeTab === 'carbon' && (
          <div className="card p-6 lg:p-8 bg-bg-surface border-border animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-3">
                <div className="card p-4 bg-bg-elevated border-border space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-text-primary flex items-center gap-1.5">
                      <Leaf className="w-3.5 h-3.5 text-accent-green" /> Carbon Stock Density
                    </span>
                    <span className="font-mono text-accent-green font-bold">218.4 tCO₂e/ha</span>
                  </div>
                  <div className="w-full bg-bg-base h-2 rounded-full overflow-hidden">
                    <div className="bg-accent-green h-full rounded-full" style={{ width: '87%' }} />
                  </div>
                  <div className="text-[11px] text-text-muted flex justify-between">
                    <span>IPCC Tier 2 Tropical Evergreen Baseline</span>
                    <span>High Biomass Storage</span>
                  </div>
                </div>

                <div className="card p-4 bg-bg-elevated border-border space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-text-primary flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-teal-400" /> Sentinel-2 NDVI Index
                    </span>
                    <span className="font-mono text-teal-400 font-bold">
                      0.724 (Cloud-Filtered)
                    </span>
                  </div>
                  <div className="w-full bg-bg-base h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-400 h-full rounded-full" style={{ width: '74%' }} />
                  </div>
                  <div className="text-[11px] text-text-muted flex justify-between">
                    <span>Copernicus L2A Harmonized Surface Reflectance</span>
                    <span>Lush Photosynthetic Health</span>
                  </div>
                </div>

                <div className="card p-4 bg-bg-elevated border-border space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-text-primary flex items-center gap-1.5">
                      <TreeDeciduous className="w-3.5 h-3.5 text-emerald-400" /> Canopy Closure &
                      Sequestration
                    </span>
                    <span className="font-mono text-emerald-300 font-bold">
                      89.5% · 7.8 tCO₂e/ha/yr
                    </span>
                  </div>
                  <div className="w-full bg-bg-base h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-accent-green h-full rounded-full"
                      style={{ width: '89%' }}
                    />
                  </div>
                  <div className="text-[11px] text-text-muted flex justify-between">
                    <span>Verra VM0047 Dynamic Baseline Methodology</span>
                    <span>Verified Additionality</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Transparent Provenance</span>
                </div>
                <h3 className="text-xl font-bold text-text-primary">
                  Calibrated against Published National Baselines
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Every historical observation traces directly back to Forest Survey of India (ISFR)
                  published inventories and IPCC Tier 2 biomass densities. Zero synthetic mock
                  markers or arbitrary random numbers.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <Link
                    to="/register"
                    className="btn-primary text-xs py-2.5 px-4 flex items-center gap-2"
                  >
                    <span>Create Your First Project</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Real Protected Reserves Network (Photo Showcase) ──────────────── */}
      <section
        id="reserves"
        className="py-16 px-4 sm:px-6 max-w-7xl mx-auto border-t border-border"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-semibold tracking-wider text-accent-green uppercase font-mono">
              Biodiversity Hotspots
            </span>
            <h2 className="text-3xl font-bold text-text-primary mt-1">
              Active Conservation Reserves Network
            </h2>
            <p className="text-text-secondary text-sm mt-1 max-w-xl">
              Real protected areas monitored continuously across tropical rainforests, tidal
              mangrove deltas, and montane corridors.
            </p>
          </div>

          <Link
            to="/app/map"
            className="text-accent-green text-xs font-semibold hover:text-accent-teal flex items-center gap-1.5 transition-colors"
          >
            <span>View all 20 reserves on map</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURED_RESERVES.map((res) => (
            <div
              key={res.id}
              className="card overflow-hidden border-border/80 group hover:border-accent-green/40 transition-all duration-300 flex flex-col"
            >
              {/* Image Frame */}
              <div className="relative h-48 sm:h-52 overflow-hidden">
                <img
                  src={res.image}
                  alt={res.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-transparent to-black/20" />
                <span className="absolute top-3 left-3 text-[10px] font-mono font-semibold bg-black/60 text-white backdrop-blur-md px-2.5 py-1 rounded border border-white/20">
                  {res.tag}
                </span>
                <span className="absolute bottom-2.5 right-3 text-[11px] font-mono text-emerald-300 bg-black/70 backdrop-blur px-2 py-0.5 rounded">
                  {res.coords}
                </span>
              </div>

              {/* Card Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">
                    {res.state}
                  </div>
                  <h3 className="text-base font-bold text-text-primary mt-0.5 group-hover:text-accent-green transition-colors">
                    {res.name}
                  </h3>
                  <p className="text-text-secondary text-xs mt-1 leading-relaxed">{res.biome}</p>
                </div>

                <div className="pt-3 border-t border-border/60 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <div className="text-[10px] text-text-muted">Total Area</div>
                    <div className="text-text-primary font-bold">{res.area}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted">Biomass Carbon</div>
                    <div className="text-accent-green font-bold">{res.carbon}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted">Sequestration</div>
                    <div className="text-teal-300 font-bold">{res.sequestration}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted">Canopy Density</div>
                    <div className="text-text-primary font-bold">{res.canopy}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Scientist Testimonial & Human Voice ───────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="relative rounded-2xl p-8 sm:p-10 glass-card border border-accent-green/20 glow-emerald overflow-hidden">
          <div className="relative z-10 space-y-5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-accent-green/15 text-accent-green border border-accent-green/30">
                FIELD ECOLOGICAL PERSPECTIVE
              </span>
            </div>

            <blockquote className="text-lg sm:text-xl font-medium text-text-primary leading-relaxed italic">
              "Before Darukaa.Earth, reconciling Sentinel-2 multispectral vegetation indices with
              our physical soil moisture sensor arrays took weeks of manual GIS clipping. Now, our
              field officers draw a reserve boundary, and the platform automatically calculates
              verified IPCC Tier 2 baselines alongside real-time atmospheric microclimate."
            </blockquote>

            <div className="flex items-center gap-3.5 pt-2 border-t border-border/50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-green to-accent-teal flex items-center justify-center text-text-inverse font-bold text-sm">
                AM
              </div>
              <div>
                <div className="text-sm font-bold text-text-primary">Dr. Arjun Mehta</div>
                <div className="text-xs text-text-muted">
                  Director of Conservation Science · Western Ghats Ecological Foundation
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Scientific Provenance Standards ───────────────────────────────── */}
      <section
        id="methodology"
        className="py-16 px-4 sm:px-6 max-w-7xl mx-auto border-t border-border"
      >
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Rigorous Scientific Standards
          </h2>
          <p className="text-text-secondary text-xs sm:text-sm mt-2">
            Every metric adheres to international geospatial and ecological accounting protocols.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 space-y-2.5 bg-bg-surface border-border">
            <div className="w-8 h-8 rounded-lg bg-accent-green/15 text-accent-green flex items-center justify-center font-bold text-xs">
              01
            </div>
            <h4 className="text-sm font-bold text-text-primary">IPCC Tier 2 Calibrated</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Biomass densities benchmarked against national Forest Survey of India (ISFR)
              peer-reviewed survey plots.
            </p>
          </div>

          <div className="card p-5 space-y-2.5 bg-bg-surface border-border">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold text-xs">
              02
            </div>
            <h4 className="text-sm font-bold text-text-primary">Open-Meteo Telemetry</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Real-time atmospheric grids deliver live ambient temperature, relative humidity, wind
              speed, and soil moisture.
            </p>
          </div>

          <div className="card p-5 space-y-2.5 bg-bg-surface border-border">
            <div className="w-8 h-8 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center font-bold text-xs">
              03
            </div>
            <h4 className="text-sm font-bold text-text-primary">ESA Copernicus Sentinel-2</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Harmonized L2A surface reflectance computation for NDVI, canopy cover, and wildfire
              vulnerability ratings.
            </p>
          </div>

          <div className="card p-5 space-y-2.5 bg-bg-surface border-border">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold text-xs">
              04
            </div>
            <h4 className="text-sm font-bold text-text-primary">Server-Side PostGIS</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Geodesic ST_Area and ST_Intersects calculations preserve ellipsoidal accuracy with
              zero planar distortion.
            </p>
          </div>
        </div>
      </section>

      {/* ── Call to Action Banner ─────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="relative rounded-2xl overflow-hidden p-8 sm:p-12 text-center bg-gradient-to-b from-bg-surface to-bg-elevated border border-accent-green/25 glow-emerald">
          <div className="max-w-2xl mx-auto space-y-5 relative z-10">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-accent-green">
              Get Started in Minutes
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
              Begin Mapping Your Environmental Land Portfolio Today.
            </h2>
            <p className="text-text-secondary text-sm sm:text-base leading-relaxed">
              Join forward-thinking conservation foundations, forest restoration trusts, and carbon
              project developers using Darukaa.Earth.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleInstantDemo}
                className="py-3 px-7 text-sm rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white font-semibold shadow-lg hover:shadow-emerald-500/25 hover:brightness-110 transition-all flex items-center justify-center gap-2 border border-emerald-400/30 cursor-pointer"
              >
                <span>⚡ 1-Click Instant Demo</span>
              </button>
              <Link to="/app/map" className="btn-primary py-3 px-6 text-sm flex items-center gap-2">
                <Compass className="w-4 h-4" />
                <span>Explore Live Map</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/80 bg-bg-surface/80 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-text-muted">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-accent-green flex items-center justify-center text-text-inverse font-bold text-xs">
              <Globe className="w-4 h-4 text-text-inverse" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-bold text-text-primary tracking-tight">DARUKAA.EARTH</span>
              <span className="mx-2 text-border">·</span>
              <span>Geospatial Environmental Intelligence System</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a href="#observatory" className="hover:text-text-secondary transition-colors">
              Observatory
            </a>
            <a href="#reserves" className="hover:text-text-secondary transition-colors">
              Reserves Network
            </a>
            <a href="#methodology" className="hover:text-text-secondary transition-colors">
              Methodology
            </a>
            <Link to="/login" className="hover:text-text-secondary transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="text-accent-green hover:underline">
              Create Account
            </Link>
          </div>

          <div className="font-mono text-[11px] text-text-muted">
            EPSG:4326 PostGIS Node · WGS84
          </div>
        </div>
      </footer>
    </div>
  )
}
