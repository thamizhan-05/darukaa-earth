import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { X, MapPin, CheckCircle, UploadCloud, FileCode, PenTool, FileCheck2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

import { DrawControl } from '@/components/map/DrawControl'
import { sitesService } from '@/services/sites'
import type { GeoJSONGeometry } from '@/types/site'
import { parseSpatialFileContent, type ParsedSpatialFile } from '@/utils/spatialParser'

interface AddSiteModalProps {
  projectId: string
  onClose: () => void
  onSuccess: (newSite?: any) => void
  projectCenter?: [number, number]
}

export function AddSiteModal({ projectId, onClose, onSuccess, projectCenter }: AddSiteModalProps) {
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [inputMode, setInputMode] = useState<'draw' | 'file'>('draw')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [geometry, setGeometry] = useState<GeoJSONGeometry | null>(null)
  const [estimatedArea, setEstimatedArea] = useState<number | null>(null)
  const [step, setStep] = useState<'draw' | 'details' | 'saving'>('draw')
  const [parsedFile, setParsedFile] = useState<ParsedSpatialFile | null>(null)
  const [isDragging, setIsDragging] = useState(false)

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

  const handleFileProcess = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      try {
        const result = parseSpatialFileContent(content, file.name)
        setParsedFile(result)
        setGeometry(result.geometry)
        setEstimatedArea(result.areaHectares)
        if (result.name && !name) {
          setName(result.name)
        }
        if (result.description && !description) {
          setDescription(result.description)
        }
        toast.success(`Parsed "${file.name}" — ${result.areaHectares.toFixed(2)} ha verified`)
      } catch (err: any) {
        toast.error(err.message || 'Failed to parse spatial file')
      }
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0])
    }
  }

  const handleGeometryReady = () => {
    if (!geometry) {
      toast.error('Please provide a polygon boundary first')
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
      toast.error('Please draw or upload a polygon')
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
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-text-primary font-semibold text-base">
                Add New Conservation Site
              </h2>
              <p className="text-text-muted text-xs mt-0.5">
                {step === 'draw'
                  ? 'Define parcel boundary via interactive map or GIS file ingestion'
                  : 'Specify site nomenclature and conservation targets'}
              </p>
            </div>

            {/* Mode switch tabs */}
            {step === 'draw' && (
              <div className="hidden sm:flex items-center gap-1 bg-bg-elevated p-1 rounded-lg border border-border ml-2">
                <button
                  type="button"
                  onClick={() => setInputMode('draw')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    inputMode === 'draw'
                      ? 'bg-accent-emerald text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Draw on Map</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('file')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    inputMode === 'file'
                      ? 'bg-accent-emerald text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Import GIS File</span>
                </button>
              </div>
            )}
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
          {step === 'draw' ? (
            inputMode === 'draw' ? (
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
            ) : (
              /* GIS File Upload Dropzone */
              <div
                className="flex-1 p-8 flex flex-col items-center justify-center bg-bg-base"
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".geojson,.json,.kml"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileProcess(e.target.files[0])
                    }
                  }}
                />

                <div
                  className={`w-full max-w-lg p-8 border-2 border-dashed rounded-2xl flex flex-col items-center text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-accent-emerald bg-accent-emerald/10'
                      : 'border-border hover:border-accent-emerald/50 bg-bg-surface/50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-14 h-14 rounded-2xl bg-accent-emerald/15 border border-accent-emerald/30 flex items-center justify-center text-accent-emerald mb-4">
                    <FileCode className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-text-primary mb-1">
                    Drag & Drop your GIS Parcel File
                  </h3>
                  <p className="text-xs text-text-muted mb-4 max-w-sm">
                    Supports GeoJSON (<code>.geojson</code>, <code>.json</code>) or Google Earth KML
                    (<code>.kml</code>). Vector nodes will be converted to PostGIS WGS84
                    coordinates.
                  </p>
                  <Button variant="outline" size="sm">
                    Browse Local File
                  </Button>
                </div>

                {/* Parsed summary preview */}
                {parsedFile && (
                  <div className="mt-6 w-full max-w-lg p-4 rounded-xl bg-bg-surface border border-accent-emerald/30 flex items-center justify-between animate-fade-in shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-accent-emerald/15 text-accent-emerald">
                        <FileCheck2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-text-primary">
                          {parsedFile.name || 'GIS Parcel'}
                        </h4>
                        <p className="text-[11px] text-text-muted">
                          Area:{' '}
                          <strong className="text-accent-emerald">
                            {parsedFile.areaHectares.toFixed(2)} ha
                          </strong>{' '}
                          · Type: {parsedFile.geometry.type}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-accent-emerald px-2 py-0.5 rounded bg-accent-emerald/15">
                      Ready
                    </span>
                  </div>
                )}
              </div>
            )
          ) : (
            /* Details form */
            <form
              onSubmit={handleSubmit}
              className="flex-1 p-6 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-4 max-w-lg mx-auto w-full">
                <div className="p-3.5 rounded-lg bg-bg-elevated border border-border flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-accent-green shrink-0" />
                  <div className="text-xs">
                    <span className="text-text-muted">Calculated Area: </span>
                    <span className="font-semibold text-text-primary">
                      {estimatedArea != null
                        ? `${estimatedArea.toFixed(2)} hectares`
                        : 'Pending calculation'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Site Name <span className="text-accent-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Periyar Core Reserve Block A"
                    className="input-text text-sm"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Description <span className="text-text-muted">(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Conservation objectives, native canopy species, or community notes..."
                    rows={4}
                    className="input-text text-sm resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border max-w-lg mx-auto w-full">
                <Button variant="ghost" type="button" onClick={() => setStep('draw')}>
                  Back
                </Button>
                <Button
                  type="submit"
                  isLoading={createMutation.isPending || step === 'saving'}
                  leftIcon={<CheckCircle className="w-4 h-4" />}
                >
                  Create Site
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Footer for Step 1 */}
        {step === 'draw' && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-bg-surface">
            <div className="text-xs text-text-muted">
              {estimatedArea != null ? (
                <span>
                  Calculated area:{' '}
                  <strong className="text-text-primary">{estimatedArea.toFixed(2)} ha</strong>
                </span>
              ) : (
                <span>
                  {inputMode === 'draw'
                    ? 'Click on map to draw polygon boundary'
                    : 'Upload a GIS file to load geometry'}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose} size="sm">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleGeometryReady}
                disabled={!geometry}
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                Proceed to Details
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
