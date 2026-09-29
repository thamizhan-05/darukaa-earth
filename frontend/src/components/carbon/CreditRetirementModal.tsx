import { useState } from 'react'
import { Award, X, Printer, ShieldCheck, Building, Leaf } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface CreditRetirementModalProps {
  siteName: string
  siteId: string
  onClose: () => void
}

export interface RetirementRecord {
  id: string
  certificateNumber: string
  beneficiary: string
  volumeTons: number
  vintageYear: number
  retirementReason: string
  timestamp: string
  siteName: string
  siteId?: string
  verificationHash: string
}

const STORAGE_KEY = 'darukaa_credit_retirements'

export function CreditRetirementModal({ siteName, siteId, onClose }: CreditRetirementModalProps) {
  const [step, setStep] = useState<'form' | 'certificate'>('form')
  const [beneficiary, setBeneficiary] = useState('Acme Technologies Global Ltd.')
  const [volume, setVolume] = useState('250')
  const [vintage, setVintage] = useState('2026')
  const [reason, setReason] = useState(
    'Scope 1 & 2 Annual Corporate Carbon Neutrality (CSRD Aligned)',
  )
  const [currentCert, setCurrentCert] = useState<RetirementRecord | null>(null)

  const handleRetire = (e: React.FormEvent) => {
    e.preventDefault()
    const volNum = parseFloat(volume) || 100
    const serial = `DARUKAA-RET-${vintage}-${Math.floor(100000 + Math.random() * 900000)}`
    const hash = `0x${Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join('')}`

    const record: RetirementRecord = {
      id: `ret-${Date.now()}`,
      certificateNumber: serial,
      beneficiary,
      volumeTons: volNum,
      vintageYear: parseInt(vintage),
      retirementReason: reason,
      timestamp: new Date().toISOString(),
      siteName,
      siteId,
      verificationHash: hash,
    }

    // Save to local registry
    try {
      const existing = localStorage.getItem(STORAGE_KEY)
      const list = existing ? JSON.parse(existing) : []
      list.unshift(record)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    } catch {
      // ignore
    }

    setCurrentCert(record)
    setStep('certificate')
    toast.success(`Successfully retired ${volNum} tCO₂e credits!`, { icon: '🏅' })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden z-10 flex flex-col animate-slide-up">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-border bg-bg-elevated/80 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent-green/15 text-accent-green border border-accent-green/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">
                Carbon Credit Retirement Registry
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Permanent cancellation & verified ESG proof for {siteName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step === 'certificate' && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={() => window.print()}
              >
                Print Certificate
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {step === 'form' ? (
            <form onSubmit={handleRetire} className="space-y-4">
              <div className="p-4 rounded-xl bg-bg-elevated/50 border border-border space-y-1 text-xs">
                <div className="flex items-center gap-2 text-text-primary font-semibold">
                  <ShieldCheck className="w-4 h-4 text-accent-green" />
                  <span>Permanent Non-Reversible Retirement</span>
                </div>
                <p className="text-text-muted leading-relaxed">
                  Retiring credits burns them permanently from the tradeable market ledger, ensuring
                  they can never be resold or double-counted. This satisfies corporate CSRD, SEC,
                  and BRSR climate claims.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Beneficiary Entity / Organization
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={beneficiary}
                    onChange={(e) => setBeneficiary(e.target.value)}
                    className="input-text text-xs pl-9"
                    placeholder="e.g. Acme Technologies Inc."
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Volume to Retire (tCO₂e)
                  </label>
                  <div className="relative">
                    <Leaf className="w-4 h-4 text-accent-green absolute left-3 top-2.5" />
                    <input
                      type="number"
                      value={volume}
                      onChange={(e) => setVolume(e.target.value)}
                      className="input-text text-xs pl-9"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Vintage Year
                  </label>
                  <select
                    value={vintage}
                    onChange={(e) => setVintage(e.target.value)}
                    className="input-select text-xs"
                  >
                    <option value="2026">2026 (Current Vintage)</option>
                    <option value="2025">2025 Vintage</option>
                    <option value="2024">2024 Vintage</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Retirement Purpose & Disclosure Reference
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input-text text-xs"
                  placeholder="e.g. Scope 1 & 2 Neutrality, Product Packaging Carbon Offset..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button variant="ghost" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" leftIcon={<Award className="w-4 h-4" />}>
                  Authorize Retirement
                </Button>
              </div>
            </form>
          ) : (
            /* Certificate View */
            <div className="p-8 rounded-2xl bg-gradient-to-br from-bg-base via-bg-surface to-bg-base border-2 border-accent-green/40 space-y-6 text-center shadow-xl print:m-0 print:border print:border-black print:p-6">
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-accent-green font-bold text-xs uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Official Certificate of Permanent Carbon Retirement</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                  DARUKAA.EARTH REGISTRY
                </h2>
                <span className="text-[11px] font-mono text-text-muted block">
                  Serial: {currentCert?.certificateNumber}
                </span>
              </div>

              <div className="py-4 border-y border-border/70 space-y-3">
                <p className="text-xs text-text-secondary">
                  This official document certifies that on{' '}
                  <strong>{format(new Date(currentCert?.timestamp || ''), 'dd MMMM yyyy')}</strong>,
                </p>
                <h3 className="text-lg sm:text-xl font-black text-accent-green tracking-wide">
                  {currentCert?.beneficiary}
                </h3>
                <p className="text-xs text-text-secondary">
                  has permanently retired and cancelled from circulation:
                </p>
                <div className="inline-block px-5 py-2 rounded-xl bg-accent-green/15 border border-accent-green/30 text-2xl font-black text-accent-green">
                  {currentCert?.volumeTons.toLocaleString()} Metric Tonnes of CO₂e
                </div>
                <p className="text-[11px] text-text-muted mt-1">
                  Origin: <strong>{currentCert?.siteName}</strong> · Vintage Year:{' '}
                  <strong>{currentCert?.vintageYear}</strong>
                </p>
              </div>

              <div className="text-left p-3.5 rounded-xl bg-bg-elevated/50 border border-border text-xs space-y-1.5 font-mono">
                <div className="flex justify-between text-[11px] text-text-muted">
                  <span>Retirement Purpose:</span>
                  <span className="text-text-primary font-sans">
                    {currentCert?.retirementReason}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-text-muted pt-1 border-t border-border">
                  <span>Cryptographic Proof:</span>
                  <span className="truncate max-w-[280px]">{currentCert?.verificationHash}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[10px] text-text-muted border-t border-border/50">
                <span>Verified by Darukaa.Earth Geodetic Node</span>
                <span className="text-accent-green font-semibold">
                  Anti-Double-Counting Guaranteed
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
