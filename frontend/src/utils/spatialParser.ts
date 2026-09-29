import type { GeoJSONGeometry } from '@/types/site'

export interface ParsedSpatialFile {
  name?: string
  description?: string
  geometry: GeoJSONGeometry
  areaHectares: number
  bbox: [number, number, number, number] // [minLon, minLat, maxLon, maxLat]
}

/**
 * Calculates approximate geodesic area in hectares for a Polygon/MultiPolygon
 * using spherical excess on WGS84 ellipsoid.
 */
export function calculateGeodesicAreaHectares(geometry: GeoJSONGeometry): number {
  const RADIUS = 6378137 // Earth radius in meters

  function ringArea(coords: number[][]): number {
    if (coords.length < 3) return 0
    let area = 0
    for (let i = 0; i < coords.length; i++) {
      const p1 = coords[i]
      const p2 = coords[(i + 1) % coords.length]
      const lon1 = (p1[0] * Math.PI) / 180
      const lat1 = (p1[1] * Math.PI) / 180
      const lon2 = (p2[0] * Math.PI) / 180
      const lat2 = (p2[1] * Math.PI) / 180
      area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2))
    }
    area = (area * RADIUS * RADIUS) / 2.0
    return Math.abs(area)
  }

  let totalSqMeters = 0
  if (geometry.type === 'Polygon') {
    const coords = geometry.coordinates as number[][][]
    if (coords && coords.length > 0) {
      totalSqMeters += ringArea(coords[0])
      for (let i = 1; i < coords.length; i++) {
        totalSqMeters -= ringArea(coords[i]) // subtract interior holes
      }
    }
  } else if (geometry.type === 'MultiPolygon') {
    const polys = geometry.coordinates as number[][][][]
    for (const poly of polys) {
      if (poly && poly.length > 0) {
        totalSqMeters += ringArea(poly[0])
        for (let i = 1; i < poly.length; i++) {
          totalSqMeters -= ringArea(poly[i])
        }
      }
    }
  }

  return Math.max(0.01, Math.round((totalSqMeters / 10000) * 100) / 100)
}

/**
 * Compute bounding box [minLon, minLat, maxLon, maxLat]
 */
export function computeBbox(geometry: GeoJSONGeometry): [number, number, number, number] {
  let minLon = 180,
    maxLon = -180,
    minLat = 90,
    maxLat = -90

  function traverse(coords: any) {
    if (typeof coords[0] === 'number') {
      const lon = coords[0]
      const lat = coords[1]
      if (lon < minLon) minLon = lon
      if (lon > maxLon) maxLon = lon
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    } else {
      for (const sub of coords) traverse(sub)
    }
  }

  traverse(geometry.coordinates)
  return [minLon, minLat, maxLon, maxLat]
}

/**
 * Parse a raw text file (GeoJSON or KML) into a verified ParsedSpatialFile
 */
export function parseSpatialFileContent(content: string, filename: string): ParsedSpatialFile {
  const isKml = filename.toLowerCase().endsWith('.kml') || content.includes('<kml')

  if (isKml) {
    return parseKML(content, filename)
  }

  // Parse as GeoJSON
  try {
    const json = JSON.parse(content)
    let feature: any = null

    if (json.type === 'FeatureCollection' && json.features && json.features.length > 0) {
      feature = json.features[0]
    } else if (json.type === 'Feature') {
      feature = json
    } else if (json.type === 'Polygon' || json.type === 'MultiPolygon') {
      feature = { type: 'Feature', geometry: json, properties: {} }
    }

    if (!feature || !feature.geometry) {
      throw new Error('Valid Polygon or MultiPolygon geometry not found in GeoJSON')
    }

    const geometry = feature.geometry as GeoJSONGeometry
    const area = calculateGeodesicAreaHectares(geometry)
    const bbox = computeBbox(geometry)

    const props = feature.properties || {}
    const name =
      props.name || props.NAME || props.title || props.SiteName || filename.replace(/\.[^/.]+$/, '')
    const description = props.description || props.desc || props.notes || ''

    return {
      name,
      description,
      geometry,
      areaHectares: area,
      bbox,
    }
  } catch (err: any) {
    throw new Error(`Failed to parse GeoJSON: ${err.message}`)
  }
}

/**
 * Minimal robust KML polygon parser
 */
function parseKML(kmlText: string, filename: string): ParsedSpatialFile {
  const parser = new DOMParser()
  const doc = parser.parseFromString(kmlText, 'text/xml')

  const nameEl = doc.querySelector('Placemark > name, Document > name')
  const name = nameEl?.textContent || filename.replace(/\.[^/.]+$/, '')

  const descEl = doc.querySelector('Placemark > description')
  const description = descEl?.textContent || ''

  const coordElements = doc.querySelectorAll('coordinates')
  if (!coordElements || coordElements.length === 0) {
    throw new Error('No <coordinates> elements found in KML file')
  }

  const rings: number[][][] = []
  coordElements.forEach((el) => {
    const raw = el.textContent || ''
    const points = raw
      .trim()
      .split(/\s+/)
      .map((pair) => {
        const parts = pair.split(',').map(Number)
        return [parts[0], parts[1]] // [lon, lat]
      })
      .filter((pt) => !isNaN(pt[0]) && !isNaN(pt[1]))

    if (points.length >= 3) {
      // Ensure closed loop
      const first = points[0]
      const last = points[points.length - 1]
      if (first[0] !== last[0] || first[1] !== last[1]) {
        points.push([first[0], first[1]])
      }
      rings.push(points)
    }
  })

  if (rings.length === 0) {
    throw new Error('Could not parse valid closed polygon rings from KML')
  }

  const geometry: GeoJSONGeometry = {
    type: 'Polygon',
    coordinates: rings,
  }

  const area = calculateGeodesicAreaHectares(geometry)
  const bbox = computeBbox(geometry)

  return {
    name,
    description,
    geometry,
    areaHectares: area,
    bbox,
  }
}
