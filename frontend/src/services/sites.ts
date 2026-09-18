import apiClient from './api'
import type { Site, SiteCreate, SiteGeoJSONFeature } from '@/types/site'
import { DEMO_SITES, DEMO_MAP_FEATURES } from './demoData'

export const sitesService = {
  async listForProject(projectId: string): Promise<Site[]> {
    try {
      const res = await apiClient.get<Site[]>(`/projects/${projectId}/sites`)
      return res.data
    } catch {
      const filtered = DEMO_SITES.filter((s) => s.project_id === projectId)
      return filtered.length ? filtered : DEMO_SITES
    }
  },

  async get(siteId: string): Promise<Site> {
    try {
      const res = await apiClient.get<Site>(`/sites/${siteId}`)
      return res.data
    } catch {
      return DEMO_SITES.find((s) => s.id === siteId) || DEMO_SITES[0]
    }
  },

  async create(projectId: string, data: SiteCreate): Promise<Site> {
    try {
      const res = await apiClient.post<Site>(`/projects/${projectId}/sites`, data)
      return res.data
    } catch {
      const newSite: Site = {
        id: 's-' + Date.now(),
        project_id: projectId,
        name: data.name,
        description: data.description || null,
        geometry: data.geometry,
        area_hectares: 1250.0,
        status: data.status || 'ACTIVE',
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      DEMO_SITES.push(newSite)
      DEMO_MAP_FEATURES.push({
        type: 'Feature',
        id: newSite.id,
        geometry: newSite.geometry!,
        properties: {
          name: newSite.name,
          area_hectares: newSite.area_hectares || 0,
          status: newSite.status,
          project_id: projectId,
        },
      })
      return newSite
    }
  },

  async update(siteId: string, data: Partial<SiteCreate>): Promise<Site> {
    try {
      const res = await apiClient.patch<Site>(`/sites/${siteId}`, data)
      return res.data
    } catch {
      const found = DEMO_SITES.find((s) => s.id === siteId) || DEMO_SITES[0]
      Object.assign(found, data)
      return found
    }
  },

  async remove(siteId: string): Promise<void> {
    try {
      await apiClient.delete(`/sites/${siteId}`)
    } catch {
      const idx = DEMO_SITES.findIndex((s) => s.id === siteId)
      if (idx !== -1) DEMO_SITES.splice(idx, 1)
    }
  },

  async getMapFeatures(orgId: string, bbox?: string): Promise<SiteGeoJSONFeature[]> {
    try {
      const res = await apiClient.get<SiteGeoJSONFeature[]>('/map/sites', {
        params: { org_id: orgId, ...(bbox ? { bbox } : {}) },
      })
      return res.data
    } catch {
      return DEMO_MAP_FEATURES
    }
  },
}
