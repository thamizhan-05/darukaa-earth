export interface MetricSummary {
  current: number | null
  previous: number | null
  change_pct: number | null
  unit: string | null
  trend_direction?: 'up' | 'down' | 'flat' | null
  min_value?: number | null
  max_value?: number | null
  avg_value?: number | null
}

export interface TimeSeriesPoint {
  date: string
  value: number
}

export interface SiteComparisonItem {
  site_id: string
  site_name: string
  area_hectares: number | null
  metrics: Record<string, number | null>
}

export interface SiteAnalytics {
  site_id: string
  site_name: string
  area_hectares: number | null
  metrics: Record<string, MetricSummary>
  time_series: Record<string, TimeSeriesPoint[]>
  observation_count: number
  is_synthetic: boolean
  data_source_note: string
}

export interface ProjectAnalytics {
  project_id: string
  project_name: string
  site_count: number
  total_area_hectares: number
  metrics: Record<string, MetricSummary>
  time_series: Record<string, TimeSeriesPoint[]>
  site_breakdown: SiteComparisonItem[]
  is_synthetic: boolean
  data_source_note: string
}

export interface DashboardKPIs {
  total_projects: number
  active_projects: number
  total_sites: number
  total_area_hectares: number
  avg_carbon_stock: number | null
  avg_biodiversity_index: number | null
}

export interface ObservationMetricItem {
  id: string
  metric_type: string
  value: number
  unit: string | null
}

export interface Observation {
  id: string
  site_id: string
  observed_at: string
  source: string
  source_reference: string | null
  created_at: string
  metrics: ObservationMetricItem[]
}

export interface Organization {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface EnvironmentalContext {
  site_id: string
  latitude: number
  longitude: number
  weather: {
    temperature_celsius: number
    humidity_pct: number
    precipitation_mm: number
    wind_speed_kmh: number
    soil_moisture_pct: number
    condition: string
    source: string
    is_live: boolean
  }
  earth_observation: {
    satellite_ndvi: number
    canopy_cover_pct: number
    fire_risk_level: string
    fire_risk_index: number
    cloud_cover_pct: number
    satellite_source: string
    is_live: boolean
  }
}

export interface ObservationCreatePayload {
  observed_at: string
  source: string
  source_reference?: string
  metrics: Array<{
    metric_type: string
    value: number
    unit?: string
  }>
}

export interface ObservationFilterParams {
  start_date?: string
  end_date?: string
  metric_type?: string
  source?: string
  skip?: number
  limit?: number
}
