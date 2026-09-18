/**
 * Centralized Mapbox configuration and token resolution.
 * Supports VITE_MAPBOX_ACCESS_TOKEN and MAPBOX_ACCESS_TOKEN environment variables.
 */
export const getMapboxToken = (): string => {
  const raw = (
    import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ||
    import.meta.env.MAPBOX_ACCESS_TOKEN ||
    (typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.MAPBOX_ACCESS_TOKEN) ||
    ''
  )
    .toString()
    .trim()
    .replace(/^["']|["']$/g, '')

  if (raw && !raw.includes('demo_public_token')) {
    return raw
  }
  return ''
}

/**
 * True high-resolution satellite imagery using global Esri World Imagery
 * with satellite hybrid boundaries and place labels.
 * 100% token-independent, zero 401s, crystal-clear sub-meter planetary resolution.
 */
export const REAL_SATELLITE_STYLE: any = {
  version: 8,
  name: 'Darukaa High-Res Satellite',
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    'esri-world-imagery': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© Esri, Maxar, Earthstar Geographics, USDA, USGS',
    },
    'esri-boundaries-labels': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'esri-satellite-basemap',
      type: 'raster',
      source: 'esri-world-imagery',
      minzoom: 0,
      maxzoom: 22,
    },
    {
      id: 'esri-labels-overlay',
      type: 'raster',
      source: 'esri-boundaries-labels',
      minzoom: 0,
      maxzoom: 22,
      paint: {
        'raster-opacity': 0.85,
      },
    },
  ],
}

/**
 * Dark GIS Cartographic style fallback
 */
export const DARK_CANVAS_STYLE: any = {
  version: 8,
  name: 'Darukaa Dark Canvas',
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© CARTO, © OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
}

/**
 * Topographic Terrain style fallback
 */
export const TOPO_TERRAIN_STYLE: any = {
  version: 8,
  name: 'Darukaa Topo Terrain',
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    'esri-topo': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© Esri, USGS, NOAA',
    },
  },
  layers: [
    {
      id: 'esri-topo-layer',
      type: 'raster',
      source: 'esri-topo',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
}

export const MAP_STYLES = {
  standard: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  terrain: 'mapbox://styles/mapbox/outdoors-v12',
} as const

export type MapStyleKey = keyof typeof MAP_STYLES

export const FALLBACK_STYLES = {
  satellite: REAL_SATELLITE_STYLE,
  standard: DARK_CANVAS_STYLE,
  terrain: TOPO_TERRAIN_STYLE,
} as const

/**
 * Resolves map style: uses Mapbox vector style if custom user token provided,
 * otherwise falls back to true high-res Esri satellite & Carto basemaps.
 */
export const getResolvedMapStyle = (styleKey: MapStyleKey = 'satellite'): any => {
  const token = getMapboxToken()
  if (token && token.length > 20 && token.startsWith('pk.')) {
    return MAP_STYLES[styleKey] || MAP_STYLES.satellite
  }
  return FALLBACK_STYLES[styleKey] || REAL_SATELLITE_STYLE
}
