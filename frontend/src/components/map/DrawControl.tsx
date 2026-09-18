import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import type { GeoJSONGeometry } from '@/types/site'
import { Button } from '@/components/ui/Button'
import { getMapboxToken, getResolvedMapStyle, type MapStyleKey } from '@/config/mapbox'
import {
  AlertCircle,
  MapPin,
  Pencil,
  Trash2,
  Satellite,
  Map as MapIcon,
  CheckCircle2,
} from 'lucide-react'

interface DrawControlProps {
  onGeometryChange: (geometry: GeoJSONGeometry | null, estimatedAreaHa?: number) => void
  projectCenter?: [number, number]
  initialZoom?: number
}

/**
 * Calculates approximate surface area of a spherical polygon in hectares.
 * Formula: Area = R^2 * abs(sum((lon2 - lon1) * (2 + sin(lat1) + sin(lat2)))) / 2
 */
function calculateSphericalPolygonAreaHa(coordinates: number[][]): number {
  if (coordinates.length < 3) return 0
  const R = 6378137 // Earth radius in meters
  let total = 0

  for (let i = 0; i < coordinates.length - 1; i++) {
    const p1 = coordinates[i]
    const p2 = coordinates[i + 1]

    const lon1 = (p1[0] * Math.PI) / 180
    const lat1 = (p1[1] * Math.PI) / 180
    const lon2 = (p2[0] * Math.PI) / 180
    const lat2 = (p2[1] * Math.PI) / 180

    total += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2))
  }

  const areaSqMeters = Math.abs((total * R * R) / 2)
  return Number((areaSqMeters / 10000).toFixed(2)) // 1 hectare = 10,000 m²
}

/**
 * Validates that lines in a simple polygon do not intersect each other.
 */
function checkSelfIntersection(coords: number[][]): boolean {
  function ccw(p1: number[], p2: number[], p3: number[]): boolean {
    return (p3[1] - p1[1]) * (p2[0] - p1[0]) > (p2[1] - p1[1]) * (p3[0] - p1[0])
  }
  function intersect(p1: number[], p2: number[], p3: number[], p4: number[]): boolean {
    return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4)
  }

  const n = coords.length - 1
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue
      if (intersect(coords[i], coords[i + 1], coords[j], coords[j + 1])) {
        return true
      }
    }
  }
  return false
}

export function DrawControl({
  onGeometryChange,
  projectCenter,
  initialZoom = 10,
}: DrawControlProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const drawRef = useRef<MapboxDraw | null>(null)
  const [mapStyle, setMapStyle] = useState<MapStyleKey>('satellite')
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasPolygon, setHasPolygon] = useState(false)
  const [areaEstimate, setAreaEstimate] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const token = getMapboxToken()

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    if (token) {
      mapboxgl.accessToken = token
    }

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: getResolvedMapStyle(mapStyle),
      center: projectCenter || [78.9629, 20.5937],
      zoom: projectCenter ? initialZoom : 5,
    })

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      defaultMode: 'simple_select',
      styles: [
        {
          id: 'gl-draw-polygon-fill',
          type: 'fill',
          filter: ['all', ['==', '$type', 'Polygon']],
          paint: {
            'fill-color': '#3FB950',
            'fill-opacity': 0.25,
          },
        },
        {
          id: 'gl-draw-polygon-stroke',
          type: 'line',
          filter: ['all', ['==', '$type', 'Polygon']],
          paint: {
            'line-color': '#3FB950',
            'line-width': 2.5,
          },
        },
        {
          id: 'gl-draw-polygon-midpoint',
          type: 'circle',
          filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
          paint: {
            'circle-radius': 4,
            'circle-color': '#3FB950',
          },
        },
        {
          id: 'gl-draw-polygon-vertex',
          type: 'circle',
          filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
          paint: {
            'circle-radius': 6,
            'circle-color': '#3FB950',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#FFFFFF',
          },
        },
      ],
    })

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right')
    map.addControl(draw, 'top-left')

    function validateAndUpdate() {
      const data = draw.getAll()
      if (!data.features.length) {
        onGeometryChange(null)
        setHasPolygon(false)
        setAreaEstimate(null)
        setError(null)
        return
      }

      const feat = data.features[0]
      if (feat.geometry.type === 'Polygon') {
        const ring = feat.geometry.coordinates[0]

        // 1. Min 3 vertices (4 points including closing vertex)
        if (ring.length < 4) {
          setError('Polygon must have at least 3 vertices')
          return
        }

        // 2. Check bounds
        const invalidCoords = ring.some(
          ([lon, lat]) => lon < -180 || lon > 180 || lat < -90 || lat > 90,
        )
        if (invalidCoords) {
          setError('Invalid geographical coordinates')
          return
        }

        // 3. Self intersection check
        if (checkSelfIntersection(ring)) {
          setError('Polygon cannot self-intersect (bow-tie shape)')
          return
        }

        const calculatedHa = calculateSphericalPolygonAreaHa(ring)
        if (calculatedHa <= 0) {
          setError('Polygon surface area must be greater than 0')
          return
        }

        setError(null)
        setHasPolygon(true)
        setIsDrawing(false)
        setAreaEstimate(calculatedHa)

        // Convert Polygon → MultiPolygon for PostGIS SRID 4326
        onGeometryChange(
          {
            type: 'MultiPolygon',
            coordinates: [feat.geometry.coordinates as number[][][]],
          },
          calculatedHa,
        )
      }
    }

    map.on('draw.create', validateAndUpdate)
    map.on('draw.update', validateAndUpdate)
    map.on('draw.delete', () => {
      onGeometryChange(null)
      setHasPolygon(false)
      setIsDrawing(false)
      setAreaEstimate(null)
      setError(null)
    })

    mapRef.current = map
    drawRef.current = draw

    return () => {
      map.remove()
      mapRef.current = null
      drawRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Switch basemap style
  const toggleBasemap = (newStyle: MapStyleKey) => {
    if (!mapRef.current || newStyle === mapStyle) return
    setMapStyle(newStyle)
    mapRef.current.setStyle(getResolvedMapStyle(newStyle))
  }

  const startDrawing = () => {
    drawRef.current?.deleteAll()
    drawRef.current?.changeMode('draw_polygon')
    setIsDrawing(true)
    setHasPolygon(false)
    setAreaEstimate(null)
    setError(null)
    onGeometryChange(null)
  }

  const clearPolygon = () => {
    drawRef.current?.deleteAll()
    setHasPolygon(false)
    setIsDrawing(false)
    setAreaEstimate(null)
    setError(null)
    onGeometryChange(null)
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden" />

      {/* Top right basemap toggle */}
      <div className="absolute top-3 right-12 z-10 flex items-center gap-1 bg-bg-surface/90 backdrop-blur-md border border-border rounded-md p-1 shadow-md">
        <button
          type="button"
          onClick={() => toggleBasemap('satellite')}
          title="Satellite Imagery"
          className={`p-1.5 rounded transition-colors flex items-center gap-1 text-xs ${
            mapStyle === 'satellite'
              ? 'bg-bg-overlay text-text-primary font-medium'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <Satellite className="w-3.5 h-3.5" />
          <span>Satellite</span>
        </button>
        <button
          type="button"
          onClick={() => toggleBasemap('standard')}
          title="Standard Vector Map"
          className={`p-1.5 rounded transition-colors flex items-center gap-1 text-xs ${
            mapStyle === 'standard'
              ? 'bg-bg-overlay text-text-primary font-medium'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Street</span>
        </button>
      </div>

      {/* Bottom overlay controls */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2 max-w-sm">
        {!isDrawing && !hasPolygon && (
          <Button
            type="button"
            onClick={startDrawing}
            leftIcon={<Pencil className="w-3.5 h-3.5" />}
            size="sm"
            className="shadow-lg"
          >
            Draw site boundary
          </Button>
        )}

        {isDrawing && (
          <div className="glass rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-text-secondary shadow-lg border border-border/80">
            <MapPin className="w-3.5 h-3.5 text-accent-green animate-pulse" />
            <span>Click on map to place polygon vertices. Double-click to complete boundary.</span>
          </div>
        )}

        {hasPolygon && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={clearPolygon}
              variant="danger"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              size="sm"
            >
              Clear polygon
            </Button>

            {areaEstimate !== null && (
              <div className="glass rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs text-text-primary border border-border/80">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />
                <span>
                  Estimated Area: <strong>{areaEstimate.toFixed(2)} ha</strong>
                </span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="glass rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-danger shadow-lg border border-danger/40">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  )
}
