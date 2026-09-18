import apiClient from './api'
import type { Project, ProjectCreate, ProjectUpdate } from '@/types/project'

export const projectsService = {
  async list(orgId: string): Promise<Project[]> {
    const res = await apiClient.get<Project[]>('/projects', {
      params: { org_id: orgId },
    })
    return res.data
  },

  async get(id: string): Promise<Project> {
    const res = await apiClient.get<Project>(`/projects/${id}`)
    return res.data
  },

  async create(data: ProjectCreate): Promise<Project> {
    const res = await apiClient.post<Project>('/projects', data)
    return res.data
  },

  async update(id: string, data: ProjectUpdate): Promise<Project> {
    const res = await apiClient.patch<Project>(`/projects/${id}`, data)
    return res.data
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/projects/${id}`)
  },
}
