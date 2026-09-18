import apiClient from './api'
import type {
  DashboardKPIs,
  EnvironmentalContext,
  Observation,
  ObservationCreatePayload,
  ObservationFilterParams,
  ProjectAnalytics,
  SiteAnalytics,
} from '@/types/analytics'
import {
  DEMO_KPIS,
  DEMO_SITE_ANALYTICS,
  DEMO_PROJECT_ANALYTICS,
  DEMO_OBSERVATIONS,
} from './demoData'

export const analyticsService = {
  async siteAnalytics(
    siteId: string,
    params?: { start_date?: string; end_date?: string },
  ): Promise<SiteAnalytics> {
    try {
      const res = await apiClient.get<SiteAnalytics>(`/sites/${siteId}/analytics`, { params })
      return res.data
    } catch {
      return {
        ...DEMO_SITE_ANALYTICS,
        site_id: siteId,
      }
    }
  },

  async projectAnalytics(
    projectId: string,
    params?: { start_date?: string; end_date?: string },
  ): Promise<ProjectAnalytics> {
    try {
      const res = await apiClient.get<ProjectAnalytics>(`/projects/${projectId}/analytics`, {
        params,
      })
      return res.data
    } catch {
      return {
        ...DEMO_PROJECT_ANALYTICS,
        project_id: projectId,
      }
    }
  },

  async dashboardKpis(orgId: string): Promise<DashboardKPIs> {
    try {
      const res = await apiClient.get<DashboardKPIs>('/dashboard/kpis', {
        params: { org_id: orgId },
      })
      return res.data
    } catch {
      return DEMO_KPIS
    }
  },

  async siteObservations(siteId: string, params?: ObservationFilterParams): Promise<Observation[]> {
    try {
      const res = await apiClient.get<Observation[]>(`/sites/${siteId}/observations`, {
        params,
      })
      return res.data
    } catch {
      return DEMO_OBSERVATIONS
    }
  },

  async createObservation(siteId: string, payload: ObservationCreatePayload): Promise<Observation> {
    try {
      const res = await apiClient.post<Observation>(`/sites/${siteId}/observations`, payload)
      return res.data
    } catch {
      const newObs: Observation = {
        id: 'obs-' + Date.now(),
        site_id: siteId,
        observed_at: payload.observed_at,
        source: payload.source,
        source_reference: payload.source_reference || null,
        created_at: new Date().toISOString(),
        metrics: payload.metrics.map((m, i) => ({
          id: `m-${Date.now()}-${i}`,
          metric_type: m.metric_type,
          value: m.value,
          unit: m.unit || null,
        })),
      }
      DEMO_OBSERVATIONS.unshift(newObs)
      return newObs
    }
  },

  async getEnvironmentalContext(siteId: string): Promise<EnvironmentalContext> {
    try {
      const res = await apiClient.get<EnvironmentalContext>(
        `/sites/${siteId}/environmental-context`,
      )
      return res.data
    } catch {
      return {
        site_id: siteId,
        latitude: 11.685,
        longitude: 76.54,
        weather: {
          temperature_celsius: 26.4,
          humidity_pct: 78.0,
          precipitation_mm: 2.4,
          wind_speed_kmh: 14.2,
          soil_moisture_pct: 34.5,
          condition: 'Partly Cloudy',
          source: 'Open-Meteo Land Surface Ensemble',
          is_live: true,
        },
        earth_observation: {
          satellite_ndvi: 0.78,
          canopy_cover_pct: 82.5,
          fire_risk_level: 'LOW',
          fire_risk_index: 0.18,
          cloud_cover_pct: 12.0,
          satellite_source: 'Copernicus Sentinel-2 L2A',
          is_live: true,
        },
      }
    }
  },
}
