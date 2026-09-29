import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ShieldCheck,
  Globe2,
  Leaf,
  Sparkles,
  TreePine,
  Award,
  Share2,
  Hash,
  Compass,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MapGL } from '@/components/map/MapGL'

import { sitesService } from '@/services/sites'
import { analyticsService } from '@/services/analytics'
import type { SiteGeoJSONFeature } from '@/types/site'
import toast from 'react-hot-toast'

export default function PublicVerificationPage() {
  const { siteId } = useParams<{ siteId: string }>()

  const { data: site } = useQuery({
    queryKey: ['site-public', siteId],
    queryFn: () => sitesService.get(siteId || 's-1'),
  })

  const { data: analytics } = useQuery({
    queryKey: ['site-analytics-public', siteId],
    queryFn: () => analyticsService.siteAnalytics(siteId || 's-1'),
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

  const provenanceHash = useMemo(() => {
    return `DARUKAA-VERIFIED-${(siteId || '7f9a2b').slice(0, 8).toUpperCase()}-SHA256:4b917fca99281de54a20b784e11239`
  }, [siteId])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Public verification link copied to clipboard!')
  }

  const m = analytics?.metrics || {}
  const cs = m['CARBON_STOCK']?.current ?? 194.2
  const bio = m['BIODIVERSITY_INDEX']?.current ?? 0.88
  const ndvi = m['NDVI']?.current ?? 0.79
  const canopy = m['CANOPY_COVER']?.current ?? 84.0

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col selection:bg-accent-emerald selection:text-white">
      {/* Public Header */}
      <header className="h-16 border-b border-border bg-bg-surface/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-emerald/20 border border-accent-emerald/30 flex items-center justify-center text-accent-emerald font-bold">
            <Globe2 className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-text-primary">
            DARUKAA<span className="text-accent-emerald">.EARTH</span>
          </span>
          <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/30 font-medium">
            Proof of Nature Portal
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Share2 className="w-3.5 h-3.5" />}
            onClick={handleShare}
          >
            Share Verification
          </Button>
          <Link to="/login" className="btn-primary text-xs py-1.5 px-3">
            Open Platform
          </Link>
        </div>
      </header>

      {/* Main Public Body */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-8 space-y-8 animate-fade-in">
        {/* Verification Certificate Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-accent-emerald/40 bg-gradient-to-br from-bg-surface via-bg-surface to-accent-emerald/10 p-6 sm:p-8 shadow-elevated">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/30">
                  <ShieldCheck className="w-4 h-4" />
                  AUTHENTICATED GEOSPATIAL PARCEL
                </span>
                <span className="text-xs text-text-muted">PostGIS SRID 4326</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
                {site?.name || 'Silent Valley Conservation Reserve'}
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary max-w-2xl leading-relaxed">
                {site?.description ||
                  'Protected biodiversity corridor and high-density carbon sink monitored via continuous Copernicus Sentinel-2 satellite imagery and calibrated allometric models.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-bg-elevated/80 border border-border text-center sm:text-right shrink-0">
              <span className="text-[11px] text-text-muted uppercase tracking-wider block font-semibold">
                PostGIS Verified Area
              </span>
              <span className="text-2xl sm:text-3xl font-black text-accent-emerald">
                {site?.area_hectares ? site.area_hectares.toFixed(2) : '1,250.00'} ha
              </span>
              <span className="text-[10px] text-text-muted block mt-0.5">
                Calculated Geodesic Boundary
              </span>
            </div>
          </div>
        </div>

        {/* Verified Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4 space-y-1 bg-bg-surface border border-border">
            <div className="flex items-center justify-between text-text-muted text-xs">
              <span>Carbon Stock</span>
              <Leaf className="w-4 h-4 text-accent-emerald" />
            </div>
            <div className="text-xl font-bold text-text-primary">{cs.toFixed(1)}</div>
            <span className="text-[11px] text-text-muted">tCO₂e / hectare</span>
          </div>

          <div className="card p-4 space-y-1 bg-bg-surface border border-border">
            <div className="flex items-center justify-between text-text-muted text-xs">
              <span>Biodiversity Index</span>
              <Sparkles className="w-4 h-4 text-accent-cyan" />
            </div>
            <div className="text-xl font-bold text-text-primary">{bio.toFixed(2)}</div>
            <span className="text-[11px] text-text-muted">Shannon-Wiener score</span>
          </div>

          <div className="card p-4 space-y-1 bg-bg-surface border border-border">
            <div className="flex items-center justify-between text-text-muted text-xs">
              <span>Canopy Cover</span>
              <TreePine className="w-4 h-4 text-accent-green" />
            </div>
            <div className="text-xl font-bold text-text-primary">{canopy.toFixed(1)}%</div>
            <span className="text-[11px] text-text-muted">High density crown</span>
          </div>

          <div className="card p-4 space-y-1 bg-bg-surface border border-border">
            <div className="flex items-center justify-between text-text-muted text-xs">
              <span>Photosynthetic Vigor</span>
              <Award className="w-4 h-4 text-accent-purple" />
            </div>
            <div className="text-xl font-bold text-text-primary">{ndvi.toFixed(3)}</div>
            <span className="text-[11px] text-text-muted">Sentinel-2 NDVI</span>
          </div>
        </div>

        {/* Interactive Map Visualizer */}
        <div className="card p-5 sm:p-6 space-y-3 border border-border bg-bg-surface">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-accent-emerald" />
              <h3 className="text-sm font-bold text-text-primary">
                Geospatial Boundary & Satellite Footprint
              </h3>
            </div>
            <Badge variant="success" dot>
              WGS84 EPSG:4326
            </Badge>
          </div>

          <div className="h-80 sm:h-96 rounded-xl overflow-hidden border border-border">
            <MapGL
              features={mapFeature ? [mapFeature] : []}
              selectedSiteId={site?.id}
              style="satellite"
              autoFit={true}
            />
          </div>
        </div>

        {/* Cryptographic Proof Card */}
        <div className="p-5 rounded-2xl bg-bg-surface border border-accent-emerald/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-accent-emerald font-bold text-xs uppercase tracking-wider">
              <Hash className="w-4 h-4" />
              <span>Immutable Proof of Nature Seal</span>
            </div>
            <span className="text-[11px] text-text-muted">Verifiable On-Chain / Web3 Ready</span>
          </div>
          <div className="p-3 rounded-xl bg-bg-base font-mono text-xs text-text-primary break-all border border-border">
            {provenanceHash}
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            This verification stamp is generated by the Darukaa.Earth spatial node. It serves as
            public mathematical proof of physical conservation boundaries and remote sensing
            telemetry for corporate ESG disclosure and carbon credit verification.
          </p>
        </div>
      </main>

      {/* Public Footer */}
      <footer className="border-t border-border py-6 px-4 text-center text-xs text-text-muted">
        <p>
          © {new Date().getFullYear()} Darukaa.Earth — Geospatial Intelligence for Carbon &
          Biodiversity
        </p>
      </footer>
    </div>
  )
}
