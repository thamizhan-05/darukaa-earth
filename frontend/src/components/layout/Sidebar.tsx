import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  Globe,
  LayoutDashboard,
  Layers,
  LogOut,
  Map,
  Settings,
  ChevronDown,
  X,
  Database,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useUI } from '@/context/UIContext'
import { useState } from 'react'
import clsx from 'clsx'

const navItems = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/app/projects', icon: Layers, label: 'Projects' },
  { to: '/app/map', icon: Map, label: 'Map' },
  { to: '/app/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/app/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const { user, activeOrg, organizations, setActiveOrg, logout } = useAuth()
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUI()
  const [orgDropdown, setOrgDropdown] = useState(false)

  const handleNavClick = () => {
    if (mobileSidebarOpen) {
      setMobileSidebarOpen(false)
    }
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'w-64 md:w-60 flex-shrink-0 flex flex-col bg-bg-surface border-r border-border h-screen z-50 transition-transform duration-300 ease-in-out',
          'fixed inset-y-0 left-0 md:sticky md:top-0',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Logo & Mobile Close */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-accent-green flex items-center justify-center shadow-sm">
              <Globe className="w-4 h-4 text-text-inverse" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-sm font-bold text-text-primary tracking-tight">DARUKAA</span>
              <span className="text-sm font-bold text-accent-green tracking-tight">.EARTH</span>
            </div>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Org Selector */}
        {activeOrg && (
          <div className="px-3 py-3 border-b border-border relative">
            <button
              onClick={() => setOrgDropdown(!orgDropdown)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-bg-elevated transition-colors text-left"
            >
              <div className="w-6 h-6 rounded bg-accent-emerald flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {activeOrg.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-text-primary text-sm font-medium truncate flex-1">
                {activeOrg.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            </button>

            {orgDropdown && organizations.length > 1 && (
              <div className="absolute left-3 right-3 top-full mt-1 bg-bg-elevated border border-border rounded-lg shadow-elevated z-50 py-1">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      setActiveOrg(org)
                      setOrgDropdown(false)
                    }}
                    className={clsx(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-bg-overlay transition-colors',
                      org.id === activeOrg.id ? 'text-accent-green' : 'text-text-secondary',
                    )}
                  >
                    <div className="w-5 h-5 rounded bg-accent-emerald flex items-center justify-center text-xs font-bold text-white">
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                    {org.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={handleNavClick}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
                  isActive
                    ? 'bg-accent-emerald/15 text-accent-green border border-accent-emerald/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated',
                )
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Spatial Engine Status Badge */}
        <div className="px-4 py-2.5 mx-3 mb-2 bg-bg-elevated/80 border border-border/80 rounded-md">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-text-muted font-mono">
              <Database className="w-3 h-3 text-accent-green" />
              PostGIS 3.4
            </span>
            <span className="inline-flex items-center gap-1 text-accent-green font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
              SRID:4326
            </span>
          </div>
        </div>

        {/* Bottom: User Profile */}
        <div className="px-3 py-3 border-t border-border">
          <div className="flex items-center gap-2 px-3 py-2 rounded-md">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-green to-bio-light flex items-center justify-center text-xs font-bold text-text-inverse flex-shrink-0">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary text-xs font-medium truncate">{user?.full_name}</p>
              <p className="text-text-muted text-xs truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="p-1.5 rounded hover:bg-bg-overlay text-text-muted hover:text-danger transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
