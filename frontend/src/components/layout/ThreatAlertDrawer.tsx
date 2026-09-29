import { useState } from 'react'
import {
  Flame,
  AlertTriangle,
  X,
  Compass,
  CheckCircle2,
  ShieldAlert,
  Radio,
  Thermometer,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface ThreatAlertDrawerProps {
  isOpen: boolean
  onClose: () => void
}

interface ThreatIncident {
  id: string
  type: 'WILDFIRE' | 'DROUGHT' | 'CANOPY_LOSS'
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE'
  title: string
  siteName: string
  distanceKm: number
  coordinates: [number, number]
  details: string
  timestamp: string
  status: 'ACTIVE' | 'DISPATCHED' | 'RESOLVED'
}

export function ThreatAlertDrawer({ isOpen, onClose }: ThreatAlertDrawerProps) {
  const navigate = useNavigate()
  const [incidents, setIncidents] = useState<ThreatIncident[]>([
    {
      id: 'alert-1',
      type: 'WILDFIRE',
      severity: 'CRITICAL',
      title: 'NASA FIRMS Thermal Spike Detected',
      siteName: 'Periyar Tiger Reserve Catchment',
      distanceKm: 3.4,
      coordinates: [77.168, 9.467],
      details: 'Fire Radiative Power: 48.2 MW · Brightness: 342.1 K · VIIRS Sensor N20',
      timestamp: '14 mins ago',
      status: 'ACTIVE',
    },
    {
      id: 'alert-2',
      type: 'DROUGHT',
      severity: 'HIGH',
      title: 'Microclimate Drought Stress Index >85',
      siteName: 'Bandipur Deciduous Corridor',
      distanceKm: 0.0,
      coordinates: [76.625, 11.668],
      details: 'Relative humidity <28% for 18 consecutive days · Elevated fuel dryness',
      timestamp: '2 hours ago',
      status: 'ACTIVE',
    },
    {
      id: 'alert-3',
      type: 'CANOPY_LOSS',
      severity: 'MODERATE',
      title: 'Sentinel-2 NDVI Degradation Anomaly',
      siteName: 'Silent Valley National Park',
      distanceKm: 1.2,
      coordinates: [76.442, 11.083],
      details: 'NDVI dropped 0.14 in North-Western sector · Potential illegal grazing/thaw',
      timestamp: '1 day ago',
      status: 'ACTIVE',
    },
  ])

  if (!isOpen) return null

  const handleDispatch = (id: string, siteName: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: 'DISPATCHED' as const } : inc)),
    )
    toast.success(`Ranger Patrol Dispatched for ${siteName}`, {
      icon: '🛡️',
    })
  }

  const handleInspectMap = (_incident: ThreatIncident) => {
    onClose()
    navigate('/app/map')
  }

  const criticalCount = incidents.filter(
    (i) => i.severity === 'CRITICAL' && i.status === 'ACTIVE',
  ).length

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="relative w-full max-w-md bg-bg-surface border-l border-border shadow-2xl h-full flex flex-col z-10 animate-slide-left overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border bg-bg-elevated/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-accent-red/15 text-accent-red">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-text-primary">Ecological Threat Center</h3>
                {criticalCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-red text-white uppercase tracking-wider animate-pulse">
                    {criticalCount} Critical
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Real-time NASA FIRMS & microclimate telemetry alerts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Incidents List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-bg-base">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className={`p-4 rounded-xl border transition-all ${
                inc.severity === 'CRITICAL'
                  ? 'border-accent-red/40 bg-accent-red/5'
                  : inc.severity === 'HIGH'
                    ? 'border-accent-amber/40 bg-accent-amber/5'
                    : 'border-border bg-bg-surface'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  {inc.type === 'WILDFIRE' ? (
                    <Flame className="w-4 h-4 text-accent-red animate-pulse" />
                  ) : inc.type === 'DROUGHT' ? (
                    <Thermometer className="w-4 h-4 text-accent-amber" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-accent-cyan" />
                  )}
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      inc.severity === 'CRITICAL'
                        ? 'bg-accent-red/20 text-accent-red'
                        : inc.severity === 'HIGH'
                          ? 'bg-accent-amber/20 text-accent-amber'
                          : 'bg-accent-cyan/20 text-accent-cyan'
                    }`}
                  >
                    {inc.severity}
                  </span>
                </div>
                <span className="text-[10px] text-text-muted">{inc.timestamp}</span>
              </div>

              <h4 className="text-xs font-bold text-text-primary leading-tight">{inc.title}</h4>
              <p className="text-xs font-medium text-text-secondary mt-1">
                Target: <strong className="text-text-primary">{inc.siteName}</strong>{' '}
                <span className="text-text-muted text-[11px]">
                  ({inc.distanceKm === 0 ? 'Inside Reserve' : `${inc.distanceKm} km from perimeter`}
                  )
                </span>
              </p>
              <p className="text-[11px] text-text-muted mt-1 leading-relaxed">{inc.details}</p>

              {/* Status and Action Buttons */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
                {inc.status === 'DISPATCHED' ? (
                  <span className="inline-flex items-center gap-1 text-xs text-accent-emerald font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Patrol Unit Dispatched
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[11px] py-1 h-7 border-accent-emerald/40 text-accent-emerald hover:bg-accent-emerald/10"
                    onClick={() => handleDispatch(inc.id, inc.siteName)}
                  >
                    Dispatch Patrol
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[11px] py-1 h-7 flex items-center gap-1"
                  onClick={() => handleInspectMap(inc)}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Inspect on Map</span>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-bg-surface text-center">
          <p className="text-[11px] text-text-muted flex items-center justify-center gap-1">
            <Radio className="w-3 h-3 text-accent-emerald animate-pulse" />
            Connected to NOAA-20 & Suomi-NPP VIIRS telemetry feed
          </p>
        </div>
      </div>
    </div>
  )
}
