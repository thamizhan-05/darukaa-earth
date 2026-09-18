export type ProjectType =
  | 'CARBON'
  | 'BIODIVERSITY'
  | 'CARBON_AND_BIODIVERSITY'
  | 'CONSERVATION'
  | 'RESTORATION'
  | 'FORESTRY'
  | 'OTHER'

export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED'

export interface Project {
  id: string
  organization_id: string
  name: string
  description: string | null
  project_type: ProjectType
  status: ProjectStatus
  start_date: string | null
  end_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  site_count: number
  total_area_hectares: number
}

export interface ProjectCreate {
  name: string
  description?: string
  project_type: ProjectType
  status?: ProjectStatus
  start_date?: string
  end_date?: string
  organization_id: string
}

export interface ProjectUpdate {
  name?: string
  description?: string
  project_type?: ProjectType
  status?: ProjectStatus
  start_date?: string
  end_date?: string
}
