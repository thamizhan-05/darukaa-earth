import apiClient from './api'
import type { Site, SiteCreate, SiteGeoJSONFeature } from '@/types/site'

export const sitesService = {
  async listForProject(projectId: string): Promise<Site[]> {
    const res = await apiClient.get<Site[]>(`/projects/${projectId}/sites`)
    return res.data
  },

  async get(siteId: string): Promise<Site> {
    const res = await apiClient.get<Site>(`/sites/${siteId}`)
    return res.data
  },

  async create(projectId: string, data: SiteCreate): Promise<Site> {
    const res = await apiClient.post<Site>(`/projects/${projectId}/sites`, data)
    return res.data
  },

  async update(siteId: string, data: Partial<SiteCreate>): Promise<Site> {
    const res = await apiClient.patch<Site>(`/sites/${siteId}`, data)
    return res.data
  },

  async remove(siteId: string): Promise<void> {
    await apiClient.delete(`/sites/${siteId}`)
  },

  async getMapFeatures(orgId: string, bbox?: string): Promise<SiteGeoJSONFeature[]> {
    const res = await apiClient.get<SiteGeoJSONFeature[]>('/map/sites', {
      params: { org_id: orgId, ...(bbox ? { bbox } : {}) },
    })
    return res.data
  },
}
