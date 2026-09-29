import { useState } from 'react'
import { Bell, Menu, Activity, Globe } from 'lucide-react'
import { useUI } from '@/context/UIContext'
import { useCurrency, SUPPORTED_CURRENCIES, type CurrencyCode } from '@/context/CurrencyContext'
import { ThreatAlertDrawer } from './ThreatAlertDrawer'

interface TopBarProps {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  const { toggleMobileSidebar } = useUI()
  const { currency, setCurrency } = useCurrency()
  const [showThreatDrawer, setShowThreatDrawer] = useState(false)

  return (
    <>
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

          {/* Global Multi-Currency Switcher */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-bg-elevated/70 border border-border text-xs">
            <Globe className="w-3.5 h-3.5 text-accent-green shrink-0" />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="bg-transparent text-text-primary text-xs font-semibold focus:outline-none cursor-pointer pr-1"
              title="Change Global Valuation Currency"
            >
              {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                <option key={c.code} value={c.code} className="bg-bg-surface text-text-primary">
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Threat Alert Trigger */}
          <button
            onClick={() => setShowThreatDrawer(true)}
            className="relative w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
            aria-label="Threat Alerts"
            title="Active Ecological Threat Center"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-red opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-red" />
            </span>
          </button>
        </div>
      </header>

      {/* Slide-over Threat Alert Drawer */}
      <ThreatAlertDrawer isOpen={showThreatDrawer} onClose={() => setShowThreatDrawer(false)} />
    </>
  )
}
