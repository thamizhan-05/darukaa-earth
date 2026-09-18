import clsx from 'clsx'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'carbon' | 'bio'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
  dot?: boolean
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-bg-overlay text-text-secondary border-border',
  success: 'bg-accent-emerald/15 text-accent-green border-accent-emerald/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  danger: 'bg-danger/15 text-danger border-danger/30',
  info: 'bg-info/15 text-info border-info/30',
  carbon: 'bg-carbon/15 text-carbon-light border-carbon/30',
  bio: 'bg-bio/15 text-bio-light border-bio/30',
}

export function Badge({ children, variant = 'default', className, dot }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border',
        variants[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={clsx('w-1.5 h-1.5 rounded-full', {
            'bg-text-secondary': variant === 'default',
            'bg-accent-green': variant === 'success',
            'bg-warning': variant === 'warning',
            'bg-danger': variant === 'danger',
            'bg-info': variant === 'info',
            'bg-carbon-light': variant === 'carbon',
            'bg-bio-light': variant === 'bio',
          })}
        />
      )}
      {children}
    </span>
  )
}

export function statusBadgeVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    ACTIVE: 'success',
    DRAFT: 'default',
    PAUSED: 'warning',
    COMPLETED: 'info',
    ARCHIVED: 'default',
    INACTIVE: 'warning',
    UNDER_REVIEW: 'info',
  }
  return map[status] || 'default'
}
