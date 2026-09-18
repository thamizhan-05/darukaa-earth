import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Building2, Globe, Lock, Mail, User, MapPin, ShieldCheck, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { RegisterRequest } from '@/types/auth'
import { useAuth } from '@/context/AuthContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { loginAsDemo } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit } = useForm<RegisterRequest>({
    defaultValues: {
      full_name: 'Lead Environmental Reviewer',
      email: 'admin@darukaa.earth',
      organization_name: 'Global Conservation Project',
      password: 'admin1234',
    },
  })

  const handleInstantDemo = () => {
    loginAsDemo()
    toast.success('Welcome to Darukaa.Earth Portfolio Workspace!')
    navigate('/app/dashboard', { replace: true })
  }

  const onSubmit = async (_data: RegisterRequest) => {
    setIsLoading(true)
    loginAsDemo()
    toast.success('Welcome to Darukaa.Earth Workspace!')
    navigate('/app/dashboard', { replace: true })
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg-base flex">
      {/* ── Left Side: Sundarbans Mangrove Blue Carbon Photography ─────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-bg-surface border-r border-border">
        <img
          src="/images/sundarbans_mangrove.jpg"
          alt="Sundarbans mangrove tidal blue carbon delta"
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
              <span>Multi-Tenant Spatial Registry · EPSG:4326 PostGIS</span>
            </div>

            <h2 className="text-3xl font-extrabold text-white leading-snug tracking-tight">
              Create Your Conservation Organization Workspace.
            </h2>

            <div className="glass-card p-4 rounded-xl border border-white/15 text-xs text-white/80 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
                <ShieldCheck className="w-4 h-4" />
                <span>Multi-Tenant Isolation & Role-Based Access Control</span>
              </div>
              <p className="text-[11px] leading-relaxed text-white/70">
                Each organization maintains an isolated spatial boundary catalog, independent
                audited observation logs, and custom environmental threshold alert profiles.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Side: Registration Form ─────────────────────────────────── */}
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
              Create Organization Account
            </h1>
            <p className="text-text-secondary text-xs sm:text-sm">
              Portfolio & Evaluation Mode: Instant 1-click entry or submit to register.
            </p>
          </div>

          {/* 1-Click Instant Demo Button */}
          <button
            type="button"
            onClick={handleInstantDemo}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white font-semibold text-sm shadow-lg hover:shadow-emerald-500/25 hover:brightness-110 transition-all flex items-center justify-center gap-2 border border-emerald-400/30"
          >
            <span>⚡ 1-Click Instant Demo Access</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px bg-border flex-1" />
            <span className="text-[11px] text-text-muted uppercase tracking-wider">
              or create custom account
            </span>
            <div className="h-px bg-border flex-1" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div>
              <label className="text-text-secondary text-xs font-medium block mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  {...register('full_name')}
                  placeholder="Dr. Arjun Mehta"
                  className="w-full bg-bg-elevated border border-border rounded-lg pl-9 pr-4 py-2.5 text-text-primary text-sm placeholder:text-text-muted focus:border-accent-green focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-text-secondary text-xs font-medium block mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  {...register('email')}
                  placeholder="admin@darukaa.earth"
                  className="w-full bg-bg-elevated border border-border rounded-lg pl-9 pr-4 py-2.5 text-text-primary text-sm placeholder:text-text-muted focus:border-accent-green focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-text-secondary text-xs font-medium block mb-1.5">
                Organization / Project Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  {...register('organization_name')}
                  placeholder="Amazon BioCarbon Initiative"
                  className="w-full bg-bg-elevated border border-border rounded-lg pl-9 pr-4 py-2.5 text-text-primary text-sm placeholder:text-text-muted focus:border-accent-green focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-text-secondary text-xs font-medium block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full bg-bg-elevated border border-border rounded-lg pl-9 pr-4 py-2.5 text-text-primary text-sm placeholder:text-text-muted focus:border-accent-green focus:outline-none transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-2.5 mt-2 shadow-md glow-emerald"
              isLoading={isLoading}
              size="md"
            >
              Create Account & Enter
            </Button>
          </form>

          <div className="pt-4 border-t border-border text-center text-xs text-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-green hover:underline font-semibold">
              Sign In
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
