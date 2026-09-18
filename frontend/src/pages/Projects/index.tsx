import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Grid, List, Plus, Search, Filter } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { useAuth } from '@/context/AuthContext'
import { projectsService } from '@/services/projects'
import type { ProjectCreate, ProjectStatus, ProjectType } from '@/types/project'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'

const PROJECT_TYPES: ProjectType[] = [
  'CARBON',
  'BIODIVERSITY',
  'CARBON_AND_BIODIVERSITY',
  'CONSERVATION',
  'RESTORATION',
  'FORESTRY',
  'OTHER',
]

const STATUS_OPTIONS: ProjectStatus[] = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED']

function CreateProjectModal({ orgId, onClose }: { orgId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectCreate>()

  const mutation = useMutation({
    mutationFn: (data: ProjectCreate) =>
      projectsService.create({ ...data, organization_id: orgId }),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ['projects', orgId] })
      toast.success(`Project "${p.name}" created`)
      onClose()
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to create project'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-surface border border-border rounded-xl shadow-elevated w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-text-primary font-semibold">New Project</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="p-6 space-y-4">
          <div>
            <label className="text-text-secondary text-xs font-medium block mb-1.5">
              Project Name *
            </label>
            <input
              {...register('name', { required: 'Name is required' })}
              placeholder="Western Ghats Restoration"
              className="w-full bg-bg-elevated border border-border rounded-md px-3 py-2.5 text-text-primary text-sm placeholder:text-text-muted focus:border-accent-green focus:outline-none transition-colors"
            />
            {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="text-text-secondary text-xs font-medium block mb-1.5">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={2}
              placeholder="Brief description of this project…"
              className="w-full bg-bg-elevated border border-border rounded-md px-3 py-2.5 text-text-primary text-sm placeholder:text-text-muted focus:border-accent-green focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-text-secondary text-xs font-medium block mb-1.5">
                Project Type *
              </label>
              <select
                {...register('project_type', { required: true })}
                className="w-full bg-bg-elevated border border-border rounded-md px-3 py-2.5 text-text-primary text-sm focus:border-accent-green focus:outline-none transition-colors"
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-text-secondary text-xs font-medium block mb-1.5">Status</label>
              <select
                {...register('status')}
                defaultValue="ACTIVE"
                className="w-full bg-bg-elevated border border-border rounded-md px-3 py-2.5 text-text-primary text-sm focus:border-accent-green focus:outline-none transition-colors"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-text-secondary text-xs font-medium block mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                {...register('start_date')}
                className="w-full bg-bg-elevated border border-border rounded-md px-3 py-2.5 text-text-primary text-sm focus:border-accent-green focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-text-secondary text-xs font-medium block mb-1.5">
                End Date
              </label>
              <input
                type="date"
                {...register('end_date')}
                className="w-full bg-bg-elevated border border-border rounded-md px-3 py-2.5 text-text-primary text-sm focus:border-accent-green focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" isLoading={mutation.isPending} className="flex-1">
              Create Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const { activeOrg } = useAuth()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [showCreate, setShowCreate] = useState(false)

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', activeOrg?.id],
    queryFn: () => projectsService.list(activeOrg!.id),
    enabled: !!activeOrg,
  })

  const filtered = projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <AppShell>
      <TopBar
        title="Projects"
        subtitle={`${projects.length} projects`}
        actions={
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowCreate(true)}
            size="sm"
          >
            New Project
          </Button>
        }
      />

      <div className="flex-1 p-6 animate-fade-in">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="w-full bg-bg-elevated border border-border rounded-md pl-9 pr-4 py-2 text-text-primary text-sm placeholder:text-text-muted focus:border-accent-green focus:outline-none transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-bg-elevated border border-border rounded-md px-3 py-2 text-text-secondary text-sm focus:border-accent-green focus:outline-none transition-colors"
          >
            <option value="ALL">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1 bg-bg-elevated border border-border rounded-md p-1">
            <button
              onClick={() => setView('grid')}
              className={`p-1.5 rounded transition-colors ${view === 'grid' ? 'bg-bg-overlay text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded transition-colors ${view === 'list' ? 'bg-bg-overlay text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div
            className={
              view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'
            }
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="card p-5 h-36 skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <Filter className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary text-sm font-medium">No projects found</p>
            <p className="text-text-muted text-xs mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div
            className={
              view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'
            }
          >
            {filtered.map((p) => (
              <ProjectCard key={p.id} project={p} view={view} />
            ))}
          </div>
        )}
      </div>

      {showCreate && activeOrg && (
        <CreateProjectModal orgId={activeOrg.id} onClose={() => setShowCreate(false)} />
      )}
    </AppShell>
  )
}
