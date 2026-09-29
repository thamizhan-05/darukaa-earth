import { useState } from 'react'
import { Camera, MapPin, Compass, User, Plus, X, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

interface GeotaggedMediaGalleryProps {
  siteName: string
}

interface FieldPhoto {
  id: string
  title: string
  category: 'WILDLIFE' | 'DRONE_CANOPY' | 'NURSERY' | 'PATROL'
  imageUrl: string
  lat: number
  lon: number
  elevationM: number
  azimuthDeg: number
  photographer: string
  timestamp: string
  notes: string
}

export function GeotaggedMediaGallery({ siteName }: GeotaggedMediaGalleryProps) {
  const [photos, setPhotos] = useState<FieldPhoto[]>([
    {
      id: 'photo-1',
      title: 'Dense Primary Evergreen Canopy Orthomosaic',
      category: 'DRONE_CANOPY',
      imageUrl:
        'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
      lat: 10.4284,
      lon: 76.9821,
      elevationM: 840,
      azimuthDeg: 185,
      photographer: 'Ranger Selvakumar (Drone Pilot)',
      timestamp: '28 Sep 2026, 09:15 AM',
      notes:
        'DJI Mavic 3 Multispectral flight at 120m AGL. 0% cloud shadow. Closed canopy coverage.',
    },
    {
      id: 'photo-2',
      title: 'Lion-Tailed Macaque Troop in Upper Bole',
      category: 'WILDLIFE',
      imageUrl:
        'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=800&q=80',
      lat: 10.4312,
      lon: 76.9795,
      elevationM: 910,
      azimuthDeg: 240,
      photographer: 'Bio-Acoustic Team (Camera Trap #04)',
      timestamp: '26 Sep 2026, 04:30 PM',
      notes:
        'Endangered Macaca silenus troop feeding on Cullenia exarillata fruit. High biodiversity indicator.',
    },
    {
      id: 'photo-3',
      title: 'Tribal Native Sapling Polyhouse Nursery',
      category: 'NURSERY',
      imageUrl:
        'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=800&q=80',
      lat: 10.4198,
      lon: 76.9864,
      elevationM: 780,
      azimuthDeg: 90,
      photographer: 'Kadar Indigenous Forest Council',
      timestamp: '25 Sep 2026, 11:00 AM',
      notes:
        '14,000 native hardwood seedlings propagated for post-monsoon buffer zone enrichment planting.',
    },
    {
      id: 'photo-4',
      title: 'Ancient Teak Trunk Diameter Tape Audit',
      category: 'PATROL',
      imageUrl:
        'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
      lat: 10.4255,
      lon: 76.9841,
      elevationM: 865,
      azimuthDeg: 310,
      photographer: 'Field Ranger Patrol Team Beta',
      timestamp: '24 Sep 2026, 02:45 PM',
      notes:
        'DBH verified at 142cm. Stratum Plot #03 ground-truthing for Sentinel-2 biomass calibration.',
    },
  ])

  const [selectedPhoto, setSelectedPhoto] = useState<FieldPhoto | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('ALL')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState<
    'WILDLIFE' | 'DRONE_CANOPY' | 'NURSERY' | 'PATROL'
  >('PATROL')
  const [newNotes, setNewNotes] = useState('')

  const filteredPhotos =
    filterCategory === 'ALL' ? photos : photos.filter((p) => p.category === filterCategory)

  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const newP: FieldPhoto = {
      id: `photo-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      imageUrl:
        'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=800&q=80',
      lat: 10.426 + (Math.random() - 0.5) * 0.01,
      lon: 76.981 + (Math.random() - 0.5) * 0.01,
      elevationM: 850 + Math.floor(Math.random() * 80),
      azimuthDeg: Math.floor(Math.random() * 360),
      photographer: 'Field Ranger (Live Sync)',
      timestamp: 'Just now',
      notes: newNotes || 'Geotagged patrol observation logged via mobile camera telemetry.',
    }

    setPhotos([newP, ...photos])
    setNewTitle('')
    setNewNotes('')
    setShowUploadModal(false)
    toast.success('Geotagged field media added to story layer!')
  }

  return (
    <div className="card p-5 sm:p-6 space-y-6 border border-border bg-bg-surface shadow-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-teal/15 border border-accent-teal/30 flex items-center justify-center text-accent-teal">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-text-primary">
                Geotagged Field Media & Storytelling Layer
              </h3>
              <Badge variant="bio" dot>
                explorer.land Style
              </Badge>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              High-resolution photo evidence, drone surveys, and wildlife captures across {siteName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowUploadModal(true)}
          >
            Upload Field Media
          </Button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
        {['ALL', 'DRONE_CANOPY', 'WILDLIFE', 'NURSERY', 'PATROL'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
              filterCategory === cat
                ? 'bg-accent-green text-bg-base shadow-sm'
                : 'bg-bg-elevated text-text-muted hover:text-text-primary'
            }`}
          >
            {cat === 'ALL'
              ? 'All Field Evidence'
              : cat === 'DRONE_CANOPY'
                ? 'Drone Aerials'
                : cat === 'WILDLIFE'
                  ? 'Wildlife Cameras'
                  : cat === 'NURSERY'
                    ? 'Nurseries'
                    : 'Ground Patrols'}
          </button>
        ))}
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredPhotos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="group cursor-pointer rounded-xl overflow-hidden border border-border bg-bg-elevated/40 hover:border-accent-green/50 transition-all shadow-sm hover:shadow-md flex flex-col"
          >
            <div className="relative aspect-video overflow-hidden bg-bg-base">
              <img
                src={photo.imageUrl}
                alt={photo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2 left-2">
                <Badge variant={photo.category === 'WILDLIFE' ? 'bio' : 'default'}>
                  {photo.category}
                </Badge>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1">
                <MapPin className="w-3 h-3 text-accent-green" />
                {photo.elevationM}m
              </div>
            </div>

            <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between text-xs">
              <div>
                <h4 className="font-bold text-text-primary group-hover:text-accent-green transition-colors line-clamp-1">
                  {photo.title}
                </h4>
                <p className="text-[11px] text-text-muted line-clamp-2 mt-0.5">{photo.notes}</p>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-text-muted">
                <span>{photo.timestamp}</span>
                <span className="font-mono text-accent-teal flex items-center gap-0.5">
                  <Compass className="w-2.5 h-2.5" /> {photo.azimuthDeg}°
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            onClick={() => setSelectedPhoto(null)}
          />

          <div className="relative bg-bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden z-10 flex flex-col animate-slide-up">
            <div className="relative max-h-[55vh] bg-black flex items-center justify-center overflow-hidden">
              <img
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.title}
                className="w-full h-full object-contain max-h-[55vh]"
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div>
                  <h3 className="text-base font-bold text-text-primary">{selectedPhoto.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="bio">{selectedPhoto.category}</Badge>
                    <span className="text-[11px] text-text-muted">{selectedPhoto.timestamp}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono bg-bg-elevated p-2 rounded-lg border border-border">
                  <span className="flex items-center gap-1 text-text-primary">
                    <MapPin className="w-3.5 h-3.5 text-accent-green" />
                    {selectedPhoto.lat.toFixed(4)}°N, {selectedPhoto.lon.toFixed(4)}°E
                  </span>
                  <span className="text-text-muted">|</span>
                  <span className="text-text-primary">{selectedPhoto.elevationM}m MSL</span>
                  <span className="text-text-muted">|</span>
                  <span className="text-accent-teal">{selectedPhoto.azimuthDeg}° Bearing</span>
                </div>
              </div>

              <p className="text-text-secondary leading-relaxed">{selectedPhoto.notes}</p>

              <div className="flex items-center justify-between text-[11px] text-text-muted pt-2 border-t border-border">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-accent-green" /> {selectedPhoto.photographer}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <ExternalLink className="w-3 h-3" /> WGS84 Georeferenced
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Media Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowUploadModal(false)}
          />

          <div className="relative bg-bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10 flex flex-col animate-slide-up p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
                <Camera className="w-4 h-4 text-accent-green" /> Upload Field Observation Photo
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPhoto} className="space-y-3 text-xs">
              <div>
                <label className="block text-text-secondary font-medium mb-1">Photo Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Canopy regeneration transect 4"
                  className="input-text text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  Evidence Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="input-select text-xs w-full"
                >
                  <option value="PATROL">Ground Ranger Patrol</option>
                  <option value="DRONE_CANOPY">Drone Aerial Survey</option>
                  <option value="WILDLIFE">Camera Trap Wildlife</option>
                  <option value="NURSERY">Community Sapling Nursery</option>
                </select>
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">Field Notes</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ecological observations, species noted, canopy density..."
                  rows={3}
                  className="input-text text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" type="submit" variant="primary">
                  Pin to Story Map
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
