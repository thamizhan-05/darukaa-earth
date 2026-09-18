import { Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useEffect } from 'react'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, loginAsDemo } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginAsDemo()
    }
  }, [isLoading, isAuthenticated, loginAsDemo])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-sm">Loading Darukaa.Earth…</p>
        </div>
      </div>
    )
  }

  return <Outlet />
}
