import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { X, MapPin, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DrawControl } from '@/components/map/DrawControl'
import { sitesService } from '@/services/sites'
import type { GeoJSONGeometry } from '@/types/site'

interface AddSiteModalProps {
  projectId: string
  onClose: () => void
  onSuccess: (newSite?: any) => void
  projectCenter?: [number, number]
}

export function AddSiteModal({ projectId, onClose, onSuccess, projectCenter }: AddSiteModalProps) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [geometry, setGeometry] = useState<GeoJSONGeometry | null>(null)
  const [estimatedArea, setEstimatedArea] = useState<number | null>(null)
  const [step, setStep] = useState<'draw' | 'details' | 'saving'>('draw')

  const createMutation = useMutation({
    mutationFn: () => sitesService.create(projectId, { name, description, geometry: geometry! }),
    onSuccess: (site) => {
      qc.invalidateQueries({ queryKey: ['sites', projectId] })
      qc.invalidateQueries({ queryKey: ['projects', projectId] })
      qc.invalidateQueries({ queryKey: ['map-sites'] })
      toast.success(`Site "${site.name}" created — ${site.area_hectares?.toFixed(2)} ha`)
      onSuccess(site)
      onClose()
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Failed to create site'
      toast.error(msg)
      setStep('details')
    },
  })

  const handleGeometryReady = () => {
    if (!geometry) {
      toast.error('Please draw a polygon first')
      return
    }
    setStep('details')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Site name is required')
      return
    }
    if (!geometry) {
      toast.error('Please draw a polygon')
      return
    }
    setStep('saving')
    createMutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-surface border border-border rounded-xl shadow-elevated w-full max-w-4xl h-[620px] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-text-primary font-semibold text-base">Add New Site</h2>
            <p className="text-text-muted text-xs mt-0.5">
              {step === 'draw' ? 'Step 1 — Draw the site boundary' : 'Step 2 — Name your site'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Map */}
          <div className="flex-1 relative">
            <DrawControl
              projectCenter={projectCenter}
              onGeometryChange={(geom, area) => {
                setGeometry(geom)
                setEstimatedArea(area ?? null)
              }}
            />
            {geometry && (
              <div className="absolute top-4 right-4 glass rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-accent-green shadow-lg border border-accent-green/30">
                <CheckCircle className="w-3.5 h-3.5" />
                Polygon boundary verified
              </div>
            )}
          </div>

          {/* Details panel */}
          {(step === 'details' || step === 'saving') && (
            <div className="w-72 border-l border-border p-5 flex flex-col gap-4 animate-slide-up">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
                <div>
                  <label className="text-text-secondary text-xs font-medium block mb-1.5">
                    Site Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sahyadri Forest Block A"
                    className="w-full bg-bg-elevated border border-border rounded-md px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:border-accent-green focus:outline-none transition-colors"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="text-text-secondary text-xs font-medium block mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this site…"
                    rows={3}
                    className="w-full bg-bg-elevated border border-border rounded-md px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:border-accent-green focus:outline-none transition-colors resize-none"
                  />
                </div>

                <div className="glass rounded-lg px-4 py-3 mt-auto border border-border">
                  <p className="text-text-muted text-xs mb-1">Area Estimate</p>
                  <p className="text-text-primary text-sm font-semibold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-accent-green" />
                    {estimatedArea ? `~${estimatedArea.toFixed(2)} ha` : 'Calculating…'}
                  </p>
                  <span className="text-[10px] text-text-muted block mt-1">
                    Exact area verified server-side with PostGIS ST_Area.
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setStep('draw')}>
                    Back
                  </Button>
                  <Button type="submit" size="sm" isLoading={step === 'saving'} className="flex-1">
                    Save Site
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer step 1 */}
        {step === 'draw' && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <p className="text-text-muted text-xs">
              Use the draw tool on the map to outline your site boundary
            </p>
            <Button onClick={handleGeometryReady} disabled={!geometry} size="sm">
              Continue →
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
