import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Globe, Lock, Mail, MapPin, ShieldCheck, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { authService } from '@/services/auth'
import type { LoginRequest } from '@/types/auth'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>()

  const onSubmit = async (data: LoginRequest) => {
    setIsLoading(true)
    try {
      const tokens = await authService.login(data)
      authService.saveTokens(tokens)
      await refreshUser()
      toast.success('Welcome back!')
      navigate('/app/dashboard', { replace: true })
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Login failed. Check your credentials.'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex">
      {/* ── Left Side: High-Impact Environmental Photography ──────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-bg-surface border-r border-border">
        <img
          src="/images/hero_canopy_sat.jpg"
          alt="Western Ghats ancient rainforest with geospatial contours"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-bg-base/80" />

        <div className="relative z-10 p-12 flex flex-col justify-between h-full w-full">
          {/* Brand Header */}
          <Link to="/" className="flex items-center gap-2.5 w-fit group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-green to-accent-teal flex items-center justify-center shadow-md">
              <Globe className="w-4.5 h-4.5 text-text-inverse" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold text-white tracking-tight">
              DARUKAA<span className="text-accent-green">.EARTH</span>
            </span>
          </Link>

          {/* Environmental Telemetry Overlay */}
          <div className="space-y-4 max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card border border-white/20 text-emerald-300 text-xs font-mono">
              <MapPin className="w-3.5 h-3.5" />
              <span>Planetary Geospatial Observability · EPSG:4326 PostGIS</span>
            </div>

            <h2 className="text-3xl font-extrabold text-white leading-snug tracking-tight">
              Geospatial Intelligence for Carbon & Biodiversity Analytics.
            </h2>

            <div className="glass-card p-4 rounded-xl border border-white/15 text-xs text-white/80 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Ecological Baselines</span>
              </div>
              <p className="text-[11px] leading-relaxed text-white/70">
                Calibrated with high-resolution satellite imagery, PostGIS geodetic vector topology,
                and IPCC Tier 2 accounting standards.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Side: Clean Authentication Form ─────────────────────────── */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 max-w-xl mx-auto w-full">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Observatory</span>
          </Link>
        </div>

        <div className="w-full max-w-sm mx-auto space-y-6 animate-slide-up">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              Sign In to Workspace
            </h1>
            <p className="text-text-secondary text-xs sm:text-sm">
              Access your multi-tenant conservation projects and spatial maps
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-text-secondary text-xs font-medium block mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  placeholder="admin@darukaa.earth"
                  className="w-full bg-bg-elevated border border-border rounded-lg pl-9 pr-4 py-2.5 text-text-primary text-sm placeholder:text-text-muted focus:border-accent-green focus:outline-none transition-colors"
                />
              </div>
              {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-text-secondary text-xs font-medium">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="password"
                  {...register('password', { required: 'Password is required' })}
                  placeholder="••••••••"
                  className="w-full bg-bg-elevated border border-border rounded-lg pl-9 pr-4 py-2.5 text-text-primary text-sm placeholder:text-text-muted focus:border-accent-green focus:outline-none transition-colors"
                />
              </div>
              {errors.password && (
                <p className="text-danger text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full py-2.5 shadow-md glow-emerald"
              isLoading={isLoading}
              size="md"
            >
              Sign In
            </Button>
          </form>

          <div className="pt-4 border-t border-border text-center text-xs text-text-muted">
            Need an organization account?{' '}
            <Link to="/register" className="text-accent-green hover:underline font-semibold">
              Register Organization
            </Link>
          </div>
        </div>

        <div className="text-center text-[11px] text-text-muted pt-8">
          DARUKAA.EARTH · PostGIS EPSG:4326 Node
        </div>
      </div>
    </div>
  )
}
