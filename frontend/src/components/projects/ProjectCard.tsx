import { format } from 'date-fns'
import type { Project } from '@/types/project'
import { Badge, statusBadgeVariant } from '@/components/ui/Badge'
import { Layers, MapPin, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'

const typeLabels: Record<string, string> = {
  CARBON: 'Carbon',
  BIODIVERSITY: 'Biodiversity',
  CARBON_AND_BIODIVERSITY: 'Carbon & Biodiversity',
  CONSERVATION: 'Conservation',
  RESTORATION: 'Restoration',
  FORESTRY: 'Forestry',
  OTHER: 'Other',
}

const typeColors: Record<string, string> = {
  CARBON: 'text-carbon-light',
  BIODIVERSITY: 'text-bio-light',
  CARBON_AND_BIODIVERSITY: 'text-accent-teal',
  CONSERVATION: 'text-ndvi-light',
  RESTORATION: 'text-accent-green',
  FORESTRY: 'text-accent-emerald',
  OTHER: 'text-text-muted',
}

interface ProjectCardProps {
  project: Project
  view?: 'grid' | 'list'
}

export function ProjectCard({ project, view = 'grid' }: ProjectCardProps) {
  const navigate = useNavigate()

  if (view === 'list') {
    return (
      <div
        onClick={() => navigate(`/app/projects/${project.id}`)}
        className="card px-5 py-4 flex items-center gap-6 hover:bg-bg-elevated cursor-pointer transition-all group"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-text-primary font-semibold text-sm truncate group-hover:text-accent-green transition-colors">
              {project.name}
            </h3>
            <Badge variant={statusBadgeVariant(project.status)} dot>
              {project.status}
            </Badge>
          </div>
          <p className={clsx('text-xs font-medium', typeColors[project.project_type])}>
            {typeLabels[project.project_type]}
          </p>
        </div>
        <div className="flex items-center gap-6 text-text-secondary text-xs flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>{project.site_count} sites</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>
              {project.total_area_hectares.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ha
            </span>
          </div>
          <span>{format(new Date(project.updated_at), 'dd MMM yyyy')}</span>
        </div>
        <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent-green transition-colors flex-shrink-0" />
      </div>
    )
  }

  return (
    <div
      onClick={() => navigate(`/app/projects/${project.id}`)}
      className="card p-5 hover:bg-bg-elevated cursor-pointer transition-all group hover:border-accent-emerald/30 flex flex-col gap-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-text-primary font-semibold text-sm group-hover:text-accent-green transition-colors leading-tight mb-1">
            {project.name}
          </h3>
          <p className={clsx('text-xs font-medium', typeColors[project.project_type])}>
            {typeLabels[project.project_type]}
          </p>
        </div>
        <Badge variant={statusBadgeVariant(project.status)} dot>
          {project.status}
        </Badge>
      </div>

      {project.description && (
        <p className="text-text-muted text-xs line-clamp-2 leading-relaxed">
          {project.description}
        </p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border-muted">
        <div className="flex items-center gap-4 text-text-secondary text-xs">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>{project.site_count} sites</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>
              {project.total_area_hectares.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ha
            </span>
          </div>
        </div>
        <span className="text-text-muted text-xs">
          {format(new Date(project.updated_at), 'MMM yyyy')}
        </span>
      </div>
    </div>
  )
}
