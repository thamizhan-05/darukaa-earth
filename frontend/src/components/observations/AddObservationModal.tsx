import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { X, PlusCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { analyticsService } from '@/services/analytics'

interface AddObservationModalProps {
  siteId: string
  siteName: string
  onClose: () => void
  onSuccess?: () => void
}

const SOURCES = [
  'Field Ecological Survey',
  'Copernicus Sentinel-2 Satellite',
  'Ground IoT Sensor Network',
  'Drone LiDAR / Photogrammetry',
  'Government Forest Department Record',
  'Demo / Ground Truth Benchmark',
]

export function AddObservationModal({
  siteId,
  siteName,
  onClose,
  onSuccess,
}: AddObservationModalProps) {
  const queryClient = useQueryClient()
  const [observedAt, setObservedAt] = useState(new Date().toISOString().slice(0, 10))
  const [source, setSource] = useState(SOURCES[0])
  const [sourceRef, setSourceRef] = useState('')

  // Metrics state
  const [carbonStock, setCarbonStock] = useState('110.5')
  const [biodiversity, setBiodiversity] = useState('0.745')
  const [ndvi, setNdvi] = useState('0.780')
  const [treeDensity, setTreeDensity] = useState('240')
  const [canopyCover, setCanopyCover] = useState('78.5')
  const [sequestration, setSequestration] = useState('4.8')
  const [speciesCount, setSpeciesCount] = useState('85')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      const metrics: Array<{ metric_type: string; value: number; unit: string }> = []

      if (carbonStock)
        metrics.push({
          metric_type: 'CARBON_STOCK',
          value: parseFloat(carbonStock),
          unit: 'tCO₂e/ha',
        })
      if (biodiversity)
        metrics.push({
          metric_type: 'BIODIVERSITY_INDEX',
          value: parseFloat(biodiversity),
          unit: 'index',
        })
      if (ndvi) metrics.push({ metric_type: 'NDVI', value: parseFloat(ndvi), unit: 'index' })
      if (treeDensity)
        metrics.push({
          metric_type: 'TREE_DENSITY',
          value: parseFloat(treeDensity),
          unit: 'trees/ha',
        })
      if (canopyCover)
        metrics.push({ metric_type: 'CANOPY_COVER', value: parseFloat(canopyCover), unit: '%' })
      if (sequestration)
        metrics.push({
          metric_type: 'CARBON_SEQUESTRATION',
          value: parseFloat(sequestration),
          unit: 'tCO₂e/ha/yr',
        })
      if (speciesCount)
        metrics.push({
          metric_type: 'SPECIES_COUNT',
          value: parseFloat(speciesCount),
          unit: 'species',
        })

      if (metrics.length === 0) {
        throw new Error('Please enter at least one metric measurement.')
      }

      return analyticsService.createObservation(siteId, {
        observed_at: new Date(observedAt).toISOString(),
        source,
        source_reference: sourceRef || undefined,
        metrics,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-analytics', siteId] })
      queryClient.invalidateQueries({ queryKey: ['observations', siteId] })
      queryClient.invalidateQueries({ queryKey: ['project-analytics'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] })
      toast.success('Environmental observation recorded successfully')
      onSuccess?.()
      onClose()
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err.message || 'Failed to record observation'
      setError(msg)
      toast.error(msg)
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-surface border border-border rounded-xl shadow-elevated w-full max-w-xl flex flex-col animate-slide-up max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              Record Environmental Observation
            </h3>
            <p className="text-xs text-text-muted mt-0.5">{siteName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/20 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Observation Date
              </label>
              <input
                type="date"
                value={observedAt}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setObservedAt(e.target.value)}
                required
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-green"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Data Source
              </label>
              <select
                value={source}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSource(e.target.value)}
                className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-green"
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Source Reference / Provenance
            </label>
            <input
              type="text"
              placeholder="e.g. Field Team Delta GPS Log, Copernicus L2A Tile 43QDF"
              value={sourceRef}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSourceRef(e.target.value)}
              className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-green"
            />
          </div>

          <div className="border-t border-border pt-3">
            <h4 className="text-xs font-semibold text-text-primary mb-3">
              Environmental Measurements
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-text-muted mb-1">Carbon (tCO₂e/ha)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="110.5"
                  value={carbonStock}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCarbonStock(e.target.value)
                  }
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-green"
                />
              </div>

              <div>
                <label className="block text-[11px] text-text-muted mb-1">Biodiversity (0-1)</label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="0.745"
                  value={biodiversity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setBiodiversity(e.target.value)
                  }
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-green"
                />
              </div>

              <div>
                <label className="block text-[11px] text-text-muted mb-1">
                  NDVI Index (-1 to 1)
                </label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="0.780"
                  value={ndvi}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNdvi(e.target.value)}
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-green"
                />
              </div>

              <div>
                <label className="block text-[11px] text-text-muted mb-1">Tree Density (/ha)</label>
                <input
                  type="number"
                  step="1"
                  placeholder="240"
                  value={treeDensity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTreeDensity(e.target.value)
                  }
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-green"
                />
              </div>

              <div>
                <label className="block text-[11px] text-text-muted mb-1">Canopy Cover (%)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="78.5"
                  value={canopyCover}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCanopyCover(e.target.value)
                  }
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-green"
                />
              </div>

              <div>
                <label className="block text-[11px] text-text-muted mb-1">Seq. (tCO₂e/yr)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="4.8"
                  value={sequestration}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSequestration(e.target.value)
                  }
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-green"
                />
              </div>

              <div>
                <label className="block text-[11px] text-text-muted mb-1">Species Richness</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="85"
                  value={speciesCount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSpeciesCount(e.target.value)
                  }
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-green"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={mutation.isPending}
              leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
              size="sm"
            >
              Record Observation
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
