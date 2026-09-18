import { Bell, Menu, Activity } from 'lucide-react'
import { useUI } from '@/context/UIContext'

interface TopBarProps {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  const { toggleMobileSidebar } = useUI()

  return (
    <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-border bg-bg-surface/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={toggleMobileSidebar}
          className="md:hidden p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
          aria-label="Open sidebar navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col justify-center">
          {title && (
            <h1 className="text-base font-semibold text-text-primary leading-tight">{title}</h1>
          )}
          {subtitle && <p className="text-xs text-text-muted hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Environmental Telemetry Tag */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-green/10 border border-accent-green/20 text-[11px] font-medium text-accent-green">
          <Activity className="w-3 h-3 animate-pulse" />
          <span>Telemetry Active</span>
        </div>

        {actions}

        <button
          className="w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
