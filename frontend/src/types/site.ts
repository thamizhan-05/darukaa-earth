export type SiteStatus = 'ACTIVE' | 'INACTIVE' | 'UNDER_REVIEW'

export interface GeoJSONGeometry {
  type: 'Polygon' | 'MultiPolygon'
  coordinates: number[][][] | number[][][][]
}

export interface Site {
  id: string
  project_id: string
  name: string
  description: string | null
  geometry: GeoJSONGeometry | null
  area_hectares: number | null
  status: SiteStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface SiteCreate {
  name: string
  description?: string
  geometry: GeoJSONGeometry
  status?: SiteStatus
}

export interface SiteGeoJSONFeature {
  type: 'Feature'
  id: string
  geometry: GeoJSONGeometry
  properties: {
    name: string
    area_hectares: number
    status: SiteStatus
    project_id: string
  }
}

export interface MetricType {
  type:
    | 'CARBON_STOCK'
    | 'CARBON_SEQUESTRATION'
    | 'BIODIVERSITY_INDEX'
    | 'NDVI'
    | 'TREE_DENSITY'
    | 'SPECIES_COUNT'
    | 'CANOPY_COVER'
    | 'SOIL_CARBON'
    | 'WATER_QUALITY'
  value: number
  unit: string | null
}
