import apiClient from './api'

export interface SatelliteScene {
  scene_id: string
  datetime: string
  cloud_cover_pct: number
  platform: string
  constellation: string
  bbox: number[]
  tilejson_url: string
  tile_url: string
  ndvi_tile_url: string
  thumbnail_url?: string
}

export interface SARScene {
  scene_id: string
  datetime: string
  instrument: string
  platform: string
  constellation: string
  polarizations: string[]
  active_polarization: string
  cloud_penetration: string
  orbit_state: string
  bbox: number[]
  tilejson_url: string
  tile_url: string
  ratio_tile_url: string
  thumbnail_url?: string
}

export interface WildfireAnomaly {
  latitude: number
  longitude: number
  frp_mw: number
  brightness_kelvin: number
  acquisition_date: string
  acquisition_time: string
  sensor: string
  confidence: string
  daynight: string
  distance_km?: number
  threat_level?: string
  is_inside_reserve?: boolean
}

export interface SatelliteSearchResponse {
  count: number
  bbox: number[]
  scenes: SatelliteScene[]
}

export interface SiteSatelliteResponse {
  site_id: string
  site_name: string
  scene: SatelliteScene
}

export interface SARSearchResponse {
  count: number
  bbox: number[]
  polarization: string
  scenes: SARScene[]
}

export interface SiteSARResponse {
  site_id: string
  site_name: string
  scene: SARScene
}

export interface SiteWildfiresResponse {
  site_id: string
  site_name: string
  threat_level: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'ADVISORY' | 'NONE'
  active_fire_count: number
  fires_inside_reserve: number
  buffer_km: number
  fires: WildfireAnomaly[]
}

export interface ViewportWildfiresResponse {
  count: number
  bbox?: number[]
  fires: WildfireAnomaly[]
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const satelliteService = {
  // ── Sentinel-2 Optical STAC ──
  async searchScenes(params: {
    bbox?: number[]
    geometry?: Record<string, any>
    maxCloudCover?: number
    limit?: number
  }): Promise<SatelliteSearchResponse> {
    const res = await apiClient.post<SatelliteSearchResponse>('/map/satellite/search', {
      bbox: params.bbox,
      geometry: params.geometry,
      max_cloud_cover: params.maxCloudCover ?? 30,
      limit: params.limit ?? 5,
    })
    return res.data
  },

  async getSiteSatellite(
    siteId: string,
    maxCloudCover: number = 30,
  ): Promise<SiteSatelliteResponse> {
    const res = await apiClient.get<SiteSatelliteResponse>(`/map/sites/${siteId}/satellite`, {
      params: { max_cloud_cover: maxCloudCover },
    })
    return res.data
  },

  // ── Sentinel-1 SAR (Radar) ──
  async searchSARScenes(params: {
    bbox?: number[]
    geometry?: Record<string, any>
    polarization?: 'vv' | 'vh'
    limit?: number
  }): Promise<SARSearchResponse> {
    const res = await apiClient.post<SARSearchResponse>('/map/satellite/sar/search', {
      bbox: params.bbox,
      geometry: params.geometry,
      polarization: params.polarization ?? 'vv',
      limit: params.limit ?? 5,
    })
    return res.data
  },

  async getSiteSAR(siteId: string, polarization: 'vv' | 'vh' = 'vv'): Promise<SiteSARResponse> {
    const res = await apiClient.get<SiteSARResponse>(`/map/sites/${siteId}/sar`, {
      params: { polarization },
    })
    return res.data
  },

  // ── NASA FIRMS Wildfire Alerts ──
  async getSiteWildfires(siteId: string, bufferKm: number = 25): Promise<SiteWildfiresResponse> {
    const res = await apiClient.get<SiteWildfiresResponse>(`/map/sites/${siteId}/wildfires`, {
      params: { buffer_km: bufferKm },
    })
    return res.data
  },

  async getViewportWildfires(bbox?: string): Promise<ViewportWildfiresResponse> {
    const res = await apiClient.get<ViewportWildfiresResponse>('/map/wildfires', {
      params: bbox ? { bbox } : undefined,
    })
    return res.data
  },

  // ── PostGIS MVT Vector Tiles ──
  getVectorTileUrl(orgId: string): string {
    const token = localStorage.getItem('access_token') || ''
    const base = BASE_URL ? BASE_URL : window.location.origin
    return `${base}/api/v1/tiles/${orgId}/{z}/{x}/{y}.pbf?token=${token}`
  },

  getVectorTileJsonUrl(orgId: string): string {
    const token = localStorage.getItem('access_token') || ''
    const base = BASE_URL ? BASE_URL : window.location.origin
    return `${base}/api/v1/tiles/${orgId}/tilejson.json?token=${token}`
  },
}
