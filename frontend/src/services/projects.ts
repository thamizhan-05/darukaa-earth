import apiClient from './api'
import type { Project, ProjectCreate, ProjectUpdate } from '@/types/project'
import { DEMO_PROJECTS } from './demoData'

export const projectsService = {
  async list(orgId: string): Promise<Project[]> {
    try {
      const res = await apiClient.get<Project[]>('/projects', {
        params: { org_id: orgId },
      })
      return res.data
    } catch {
      return DEMO_PROJECTS
    }
  },

  async get(id: string): Promise<Project> {
    try {
      const res = await apiClient.get<Project>(`/projects/${id}`)
      return res.data
    } catch {
      return DEMO_PROJECTS.find((p) => p.id === id) || DEMO_PROJECTS[0]
    }
  },

  async create(data: ProjectCreate): Promise<Project> {
    try {
      const res = await apiClient.post<Project>('/projects', data)
      return res.data
    } catch {
      const newProj: Project = {
        id: 'p-' + Date.now(),
        organization_id: data.organization_id,
        name: data.name,
        description: data.description || null,
        project_type: data.project_type,
        status: data.status || 'ACTIVE',
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        site_count: 0,
        total_area_hectares: 0,
      }
      DEMO_PROJECTS.push(newProj)
      return newProj
    }
  },

  async update(id: string, data: ProjectUpdate): Promise<Project> {
    try {
      const res = await apiClient.patch<Project>(`/projects/${id}`, data)
      return res.data
    } catch {
      const found = DEMO_PROJECTS.find((p) => p.id === id) || DEMO_PROJECTS[0]
      Object.assign(found, data)
      return found
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await apiClient.delete(`/projects/${id}`)
    } catch {
      const idx = DEMO_PROJECTS.findIndex((p) => p.id === id)
      if (idx !== -1) DEMO_PROJECTS.splice(idx, 1)
    }
  },
}
