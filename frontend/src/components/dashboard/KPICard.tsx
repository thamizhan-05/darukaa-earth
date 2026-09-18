import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import clsx from 'clsx'

interface KPICardProps {
  label: string
  value: string | number | null
  unit?: string
  change?: number | null
  icon?: React.ReactNode
  color?: 'green' | 'blue' | 'orange' | 'teal'
  isLoading?: boolean
}

const colorMap = {
  green: {
    icon: 'bg-carbon/20 text-carbon-light',
    accent: 'text-accent-green',
  },
  blue: {
    icon: 'bg-info/20 text-info-light',
    accent: 'text-info',
  },
  orange: {
    icon: 'bg-warning/20 text-warning-light',
    accent: 'text-warning',
  },
  teal: {
    icon: 'bg-bio/20 text-bio-light',
    accent: 'text-bio-light',
  },
}

export function KPICard({
  label,
  value,
  unit,
  change,
  icon,
  color = 'green',
  isLoading,
}: KPICardProps) {
  const colors = colorMap[color]

  if (isLoading) {
    return (
      <div className="card p-5 space-y-3">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-8 w-32 rounded" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    )
  }

  return (
    <div className="card p-5 hover:border-border-muted transition-all duration-200 group animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <p className="text-text-secondary text-xs font-medium uppercase tracking-wider">{label}</p>
        {icon && (
          <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', colors.icon)}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className={clsx('text-2xl font-bold text-text-primary tabular-nums', colors.accent)}>
          {value !== null && value !== undefined ? value : '—'}
        </span>
        {unit && <span className="text-text-muted text-sm">{unit}</span>}
      </div>

      {change !== undefined && change !== null && (
        <div className="flex items-center gap-1 mt-2">
          {change > 0 ? (
            <TrendingUp className="w-3 h-3 text-accent-green" />
          ) : change < 0 ? (
            <TrendingDown className="w-3 h-3 text-danger" />
          ) : (
            <Minus className="w-3 h-3 text-text-muted" />
          )}
          <span
            className={clsx('text-xs font-medium', {
              'text-accent-green': change > 0,
              'text-danger': change < 0,
              'text-text-muted': change === 0,
            })}
          >
            {change > 0 ? '+' : ''}
            {change.toFixed(1)}%
          </span>
          <span className="text-text-muted text-xs">vs prev</span>
        </div>
      )}
    </div>
  )
}
