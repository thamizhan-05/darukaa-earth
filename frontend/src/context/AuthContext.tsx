import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { User } from '@/types/auth'
import { authService } from '@/services/auth'
import { Organization } from '@/types/analytics'
import apiClient from '@/services/api'

interface AuthContextValue {
  user: User | null
  activeOrg: Organization | null
  organizations: Organization[]
  isLoading: boolean
  isAuthenticated: boolean
  setActiveOrg: (org: Organization) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUserAndOrgs = useCallback(async () => {
    const token = authService.getAccessToken()
    if (!token) {
      setIsLoading(false)
      return
    }
    try {
      const [userData, orgsData] = await Promise.all([
        authService.me(),
        apiClient.get<Organization[]>('/organizations').then((r) => r.data),
      ])
      setUser(userData)
      setOrganizations(orgsData)
      if (orgsData.length > 0) {
        const saved = localStorage.getItem('active_org_id')
        const found = saved ? orgsData.find((o) => o.id === saved) : null
        setActiveOrg(found || orgsData[0])
      }
    } catch {
      authService.clearTokens()
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUserAndOrgs()
  }, [fetchUserAndOrgs])

  const handleSetActiveOrg = useCallback((org: Organization) => {
    setActiveOrg(org)
    localStorage.setItem('active_org_id', org.id)
  }, [])

  const logout = useCallback(() => {
    authService.clearTokens()
    localStorage.removeItem('active_org_id')
    setUser(null)
    setOrganizations([])
    setActiveOrg(null)
    window.location.href = '/login'
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        activeOrg,
        organizations,
        isLoading,
        isAuthenticated: !!user,
        setActiveOrg: handleSetActiveOrg,
        logout,
        refreshUser: fetchUserAndOrgs,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
