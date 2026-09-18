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

export const analyticsService = {
  async siteAnalytics(
    siteId: string,
    params?: { start_date?: string; end_date?: string },
  ): Promise<SiteAnalytics> {
    const res = await apiClient.get<SiteAnalytics>(`/sites/${siteId}/analytics`, { params })
    return res.data
  },

  async projectAnalytics(
    projectId: string,
    params?: { start_date?: string; end_date?: string },
  ): Promise<ProjectAnalytics> {
    const res = await apiClient.get<ProjectAnalytics>(`/projects/${projectId}/analytics`, {
      params,
    })
    return res.data
  },

  async dashboardKpis(orgId: string): Promise<DashboardKPIs> {
    const res = await apiClient.get<DashboardKPIs>('/dashboard/kpis', {
      params: { org_id: orgId },
    })
    return res.data
  },

  async siteObservations(siteId: string, params?: ObservationFilterParams): Promise<Observation[]> {
    const res = await apiClient.get<Observation[]>(`/sites/${siteId}/observations`, {
      params,
    })
    return res.data
  },

  async createObservation(siteId: string, payload: ObservationCreatePayload): Promise<Observation> {
    const res = await apiClient.post<Observation>(`/sites/${siteId}/observations`, payload)
    return res.data
  },

  async getEnvironmentalContext(siteId: string): Promise<EnvironmentalContext> {
    const res = await apiClient.get<EnvironmentalContext>(`/sites/${siteId}/environmental-context`)
    return res.data
  },
}
