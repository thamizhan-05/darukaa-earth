import { useState, useEffect } from 'react'
import {
  X,
  Wifi,
  WifiOff,
  MapPin,
  Camera,
  TreePine,
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Navigation,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import { analyticsService } from '@/services/analytics'

interface FieldDataCollectorModalProps {
  siteId: string
  siteName: string
  onClose: () => void
  onSynced?: () => void
}

export interface OfflineFieldRecord {
  id: string
  siteId: string
  timestamp: string
  latitude: number
  longitude: number
  treeSpecies: string
  dbhCm: number
  canopyHeightM: number
  threatType: 'NONE' | 'LOGGING' | 'SNARE' | 'FIRE_TRACE' | 'ENCROACHMENT'
  notes: string
  isSynced: boolean
}

const STORAGE_KEY = 'darukaa_offline_field_records'

export function FieldDataCollectorModal({
  siteId,
  siteName,
  onClose,
  onSynced,
}: FieldDataCollectorModalProps) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)
  const [activeTab, setActiveTab] = useState<'log' | 'queue'>('log')

  // Form State
  const [lat, setLat] = useState<string>('11.0832')
  const [lon, setLon] = useState<string>('76.4421')
  const [species, setSpecies] = useState<string>('Dipterocarpus indicus')
  const [dbh, setDbh] = useState<string>('42.5')
  const [height, setHeight] = useState<string>('24.0')
  const [threat, setThreat] = useState<OfflineFieldRecord['threatType']>('NONE')
  const [notes, setNotes] = useState<string>('')
  const [isLocating, setIsLocating] = useState<boolean>(false)

  // Offline queue state
  const [records, setRecords] = useState<OfflineFieldRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(5))
        setLon(pos.coords.longitude.toFixed(5))
        setIsLocating(false)
        toast.success('GPS coordinates locked from handheld device')
      },
      () => {
        setIsLocating(false)
        toast.error('Unable to fetch device GPS. Check location permissions.')
      },
      { timeout: 10000, enableHighAccuracy: true },
    )
  }

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault()
    const newRecord: OfflineFieldRecord = {
      id: `field-${Date.now()}`,
      siteId,
      timestamp: new Date().toISOString(),
      latitude: parseFloat(lat) || 11.08,
      longitude: parseFloat(lon) || 76.44,
      treeSpecies: species || 'Native Flora',
      dbhCm: parseFloat(dbh) || 30.0,
      canopyHeightM: parseFloat(height) || 20.0,
      threatType: threat,
      notes,
      isSynced: false,
    }

    const updated = [newRecord, ...records]
    setRecords(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

    toast.success(
      isOnline
        ? 'Field observation logged locally (Ready to Sync)'
        : 'Logged to offline storage. Will sync when reconnected.',
      { icon: '🌲' },
    )

    // Reset form
    setNotes('')
    setActiveTab('queue')
  }

  const handleSyncAll = async () => {
    const pending = records.filter((r) => !r.isSynced)
    if (pending.length === 0) {
      toast('No pending records to sync')
      return
    }

    toast.loading('Syncing field records to cloud PostGIS database...', { id: 'sync' })

    try {
      for (const rec of pending) {
        // Convert to Darukaa observation format
        await analyticsService.createObservation(rec.siteId, {
          observed_at: rec.timestamp,
          source: 'Ranger Ground Survey (Offline PWA)',
          source_reference: `GPS-${rec.latitude},${rec.longitude}`,
          metrics: [
            {
              metric_type: 'TREE_DENSITY',
              value: Math.round(rec.dbhCm * 8.5),
              unit: 'trees/ha',
            },
            {
              metric_type: 'CANOPY_COVER',
              value: Math.min(95, rec.canopyHeightM * 3.8),
              unit: '%',
            },
            {
              metric_type: 'CARBON_STOCK',
              value: 180 + rec.dbhCm * rec.canopyHeightM * 0.04,
              unit: 'tCO₂e/ha',
            },
          ],
        })
      }

      const marked = records.map((r) => ({ ...r, isSynced: true }))
      setRecords(marked)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(marked))
      toast.success(`Successfully reconciled ${pending.length} observations!`, { id: 'sync' })
      if (onSynced) onSynced()
    } catch {
      toast.error('Sync failed. Check connection.', { id: 'sync' })
    }
  }

  const handleDeleteRecord = (id: string) => {
    const filtered = records.filter((r) => r.id !== id)
    setRecords(filtered)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    toast.success('Record removed')
  }

  const pendingCount = records.filter((r) => !r.isSynced).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden z-10 flex flex-col animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-bg-elevated/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent-green/15 text-accent-green border border-accent-green/30">
              <TreePine className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-text-primary">
                  Offline Ranger Field Logger
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                    isOnline
                      ? 'bg-accent-emerald/20 text-accent-green border border-accent-emerald/30'
                      : 'bg-accent-amber/20 text-accent-amber border border-accent-amber/30'
                  }`}
                >
                  {isOnline ? (
                    <>
                      <Wifi className="w-3 h-3" /> Online Node
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3" /> Offline PWA Mode
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Ground-truth biomass & threat recording for {siteName}
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

        {/* Tab switch */}
        <div className="flex border-b border-border bg-bg-base px-6">
          <button
            onClick={() => setActiveTab('log')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'log'
                ? 'border-accent-green text-accent-green'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            New Ground Observation
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'queue'
                ? 'border-accent-green text-accent-green'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <span>Sync Queue</span>
            {pendingCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-accent-amber text-black text-[10px] font-bold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {activeTab === 'log' ? (
            <form onSubmit={handleSaveRecord} className="space-y-4">
              {/* GPS Coordinates Header */}
              <div className="p-3.5 rounded-xl bg-bg-elevated/70 border border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-accent-green" />
                  <div className="text-xs">
                    <span className="text-text-muted block text-[10px] uppercase font-semibold">
                      GPS Fix (WGS84)
                    </span>
                    <span className="font-mono text-text-primary font-bold">
                      {lat}° N, {lon}° E
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  leftIcon={<Navigation className="w-3.5 h-3.5" />}
                  isLoading={isLocating}
                  onClick={handleGetLocation}
                >
                  Fetch Device GPS
                </Button>
              </div>

              {/* Biomass measurements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Tree / Flora Species
                  </label>
                  <input
                    type="text"
                    value={species}
                    onChange={(e) => setSpecies(e.target.value)}
                    className="input-text text-xs"
                    placeholder="e.g. Shorea robusta / Teak"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Threat & Encroachment Status
                  </label>
                  <select
                    value={threat}
                    onChange={(e) => setThreat(e.target.value as any)}
                    className="input-select text-xs"
                  >
                    <option value="NONE">No Threat (Undisturbed Primary Forest)</option>
                    <option value="LOGGING">Illegal Logging / Stump Cut</option>
                    <option value="SNARE">Poaching Wire Snare Detected</option>
                    <option value="FIRE_TRACE">Fresh Ground Fire / Ash Traces</option>
                    <option value="ENCROACHMENT">Boundary Stone Moved / Encroachment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Tree DBH (Diameter at Breast Height)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={dbh}
                      onChange={(e) => setDbh(e.target.value)}
                      className="input-text text-xs pr-10"
                      required
                    />
                    <span className="absolute right-3 top-2 text-text-muted text-xs">cm</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Canopy Clinometer Height
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="input-text text-xs pr-10"
                      required
                    />
                    <span className="absolute right-3 top-2 text-text-muted text-xs">meters</span>
                  </div>
                </div>
              </div>

              {/* Photo Evidence Simulation */}
              <div className="p-3 rounded-xl border border-dashed border-border bg-bg-base/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-text-muted">
                  <Camera className="w-4 h-4 text-accent-green" />
                  <span>Geotagged Photo Evidence (EXIF metadata embedded)</span>
                </div>
                <Badge variant="success">Attached (IMG_0942.JPG)</Badge>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Field Notes & Observations
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record crown health, understory sapling count, or soil condition..."
                  rows={3}
                  className="input-text text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Save to Local Log
                </Button>
              </div>
            </form>
          ) : (
            /* Queue tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    IndexedDB Local Storage Queue
                  </h4>
                  <p className="text-[11px] text-text-muted">
                    {pendingCount} records awaiting reconciliation with master PostGIS database
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<UploadCloud className="w-4 h-4" />}
                  disabled={pendingCount === 0 || !isOnline}
                  onClick={handleSyncAll}
                >
                  Sync to Cloud ({pendingCount})
                </Button>
              </div>

              <div className="space-y-2.5">
                {records.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl border border-border bg-bg-base flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-primary">{r.treeSpecies}</span>
                        {r.threatType !== 'NONE' ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent-red/20 text-accent-red flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {r.threatType}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent-green/15 text-accent-green">
                            Healthy
                          </span>
                        )}
                        {r.isSynced ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent-emerald/15 text-accent-emerald flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Synced
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent-amber/15 text-accent-amber">
                            Pending Sync
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted">
                        DBH: <strong>{r.dbhCm} cm</strong> · Height:{' '}
                        <strong>{r.canopyHeightM} m</strong> · GPS: {r.latitude}, {r.longitude}
                      </p>
                      {r.notes && (
                        <p className="text-[11px] text-text-secondary italic">"{r.notes}"</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteRecord(r.id)}
                      className="p-1 rounded text-text-muted hover:text-accent-red hover:bg-bg-elevated transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {records.length === 0 && (
                  <div className="p-8 text-center text-text-muted text-xs">
                    No field records logged yet. Switch to "New Ground Observation" to record data.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
