import { useState, useMemo } from 'react'
import { ShieldAlert, Flame, Droplets, Bug, Scale, CheckCircle2, HelpCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

interface ReversalBufferPoolCalculatorProps {
  grossCredits: number
  fireRiskLevel?: string
  siteName: string
}

export function ReversalBufferPoolCalculator({
  grossCredits = 25000,
  fireRiskLevel = 'MODERATE',
  siteName,
}: ReversalBufferPoolCalculatorProps) {
  const [wildfireRisk, setWildfireRisk] = useState<'LOW' | 'MODERATE' | 'HIGH'>(
    fireRiskLevel === 'HIGH' ? 'HIGH' : fireRiskLevel === 'LOW' ? 'LOW' : 'MODERATE',
  )
  const [droughtSeverity, setDroughtSeverity] = useState<number>(1.2) // SPEI drought anomaly index
  const [pestPathogenRisk, setPestPathogenRisk] = useState<number>(2.5) // %
  const [tenureSecurity, setTenureSecurity] = useState<'HIGH' | 'MEDIUM' | 'DISPUTED'>('HIGH')

  const calculations = useMemo(() => {
    // Verra VCS AFOLU Non-Permanence Risk Tool formula simulation
    let fireBuffer = 3.0
    if (wildfireRisk === 'MODERATE') fireBuffer = 5.5
    if (wildfireRisk === 'HIGH') fireBuffer = 9.5

    const droughtBuffer = Math.min(8.0, droughtSeverity * 2.8)
    const pestBuffer = pestPathogenRisk * 0.8

    let tenureBuffer = 2.0
    if (tenureSecurity === 'MEDIUM') tenureBuffer = 5.0
    if (tenureSecurity === 'DISPUTED') tenureBuffer = 12.0

    // Mitigation discounts (field rangers, satellite alert system, community agreement)
    const activeMitigationDiscount = 4.0 // 4% discount for active IoT + AI telemetry

    const rawTotalPct = fireBuffer + droughtBuffer + pestBuffer + tenureBuffer
    const finalBufferPct = Math.max(10.0, Math.min(30.0, rawTotalPct - activeMitigationDiscount))

    const bufferCreditsDeposited = Math.round((grossCredits * finalBufferPct) / 100)
    const netTradeableCredits = grossCredits - bufferCreditsDeposited
    const permanenceScore = 100 - finalBufferPct * 0.35

    return {
      fireBuffer,
      droughtBuffer,
      pestBuffer,
      tenureBuffer,
      activeMitigationDiscount,
      finalBufferPct: parseFloat(finalBufferPct.toFixed(1)),
      bufferCreditsDeposited,
      netTradeableCredits,
      permanenceScore: permanenceScore.toFixed(1),
    }
  }, [grossCredits, wildfireRisk, droughtSeverity, pestPathogenRisk, tenureSecurity])

  return (
    <div className="card p-5 sm:p-6 space-y-6 border border-border bg-bg-surface shadow-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-amber/15 border border-accent-amber/30 flex items-center justify-center text-accent-amber">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-text-primary">
                Verra AFOLU Reversal Buffer Pool Simulator
              </h3>
              <Badge variant="warning" dot>
                Permanence Insurance
              </Badge>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Non-permanence risk assessment & mandatory carbon credit buffer withholding for{' '}
              {siteName}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-text-muted uppercase tracking-wider block font-semibold">
            Mandatory Buffer Rate
          </span>
          <span className="text-xl sm:text-2xl font-black text-accent-amber">
            {calculations.finalBufferPct}%
          </span>
        </div>
      </div>

      {/* Credit Yield Breakdown Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl bg-bg-elevated/70 border border-border">
          <span className="text-[11px] text-text-muted block">Gross Credits Estimated</span>
          <span className="text-xl font-bold text-text-primary">
            {grossCredits.toLocaleString()} tCO₂e
          </span>
          <span className="text-[10px] text-text-muted block mt-0.5">100% Total Generation</span>
        </div>

        <div className="p-4 rounded-xl bg-accent-amber/10 border border-accent-amber/30">
          <span className="text-[11px] text-accent-amber block font-semibold">
            Insurance Buffer Withholding
          </span>
          <span className="text-xl font-bold text-accent-amber">
            -{calculations.bufferCreditsDeposited.toLocaleString()} tCO₂e
          </span>
          <span className="text-[10px] text-text-muted block mt-0.5">
            Locked in collective registry buffer pool
          </span>
        </div>

        <div className="p-4 rounded-xl bg-accent-green/10 border border-accent-green/30">
          <span className="text-[11px] text-accent-green block font-semibold">
            Net Tradeable & Liquid Credits
          </span>
          <span className="text-xl font-bold text-accent-green">
            {calculations.netTradeableCredits.toLocaleString()} tCO₂e
          </span>
          <span className="text-[10px] text-text-muted block mt-0.5">
            Eligible for immediate sale or retirement
          </span>
        </div>
      </div>

      {/* Interactive Risk Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Wildfire Vulnerability */}
        <div className="p-4 rounded-xl bg-bg-elevated/40 border border-border space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-accent-red" /> Wildfire Vulnerability
            </span>
            <span className="font-mono text-accent-amber font-bold">
              +{calculations.fireBuffer}%
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
            {(['LOW', 'MODERATE', 'HIGH'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setWildfireRisk(lvl)}
                className={`py-1.5 px-2 rounded-lg border text-center font-semibold transition-all ${
                  wildfireRisk === lvl
                    ? 'bg-accent-red/20 border-accent-red text-text-primary'
                    : 'bg-bg-base border-border text-text-muted hover:border-border-muted'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Drought Severity Anomaly */}
        <div className="p-4 rounded-xl bg-bg-elevated/40 border border-border space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-accent-cyan" /> Drought SPEI Stress Deficit
            </span>
            <span className="font-mono text-accent-amber font-bold">
              +{calculations.droughtBuffer.toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="2.5"
            step="0.1"
            value={droughtSeverity}
            onChange={(e) => setDroughtSeverity(parseFloat(e.target.value))}
            className="w-full accent-accent-cyan"
          />
          <div className="flex justify-between text-[10px] text-text-muted">
            <span>Normal Hydrology</span>
            <span className="font-bold text-text-primary">{droughtSeverity} SPEI anomaly</span>
            <span>Severe Drought Deficit</span>
          </div>
        </div>

        {/* Pest & Pathogen Mortality */}
        <div className="p-4 rounded-xl bg-bg-elevated/40 border border-border space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary flex items-center gap-1.5">
              <Bug className="w-4 h-4 text-accent-amber" /> Pest & Pathogen Mortality Risk
            </span>
            <span className="font-mono text-accent-amber font-bold">
              +{calculations.pestBuffer.toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="6"
            step="0.5"
            value={pestPathogenRisk}
            onChange={(e) => setPestPathogenRisk(parseFloat(e.target.value))}
            className="w-full accent-accent-amber"
          />
          <div className="flex justify-between text-[10px] text-text-muted">
            <span>0% (Resilient)</span>
            <span className="font-bold text-text-primary">{pestPathogenRisk}% tree mortality</span>
            <span>6% (Epidemic outbreak)</span>
          </div>
        </div>

        {/* Land Tenure & Title Security */}
        <div className="p-4 rounded-xl bg-bg-elevated/40 border border-border space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-accent-purple" /> Land Tenure & Legal Security
            </span>
            <span className="font-mono text-accent-amber font-bold">
              +{calculations.tenureBuffer}%
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
            {(['HIGH', 'MEDIUM', 'DISPUTED'] as const).map((ten) => (
              <button
                key={ten}
                onClick={() => setTenureSecurity(ten)}
                className={`py-1.5 px-2 rounded-lg border text-center font-semibold transition-all ${
                  tenureSecurity === ten
                    ? 'bg-accent-purple/20 border-accent-purple text-text-primary'
                    : 'bg-bg-base border-border text-text-muted hover:border-border-muted'
                }`}
              >
                {ten}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mitigation Discount Card */}
      <div className="p-4 rounded-xl bg-accent-green/10 border border-accent-green/30 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-text-primary">
          <CheckCircle2 className="w-4 h-4 text-accent-green shrink-0" />
          <span>
            <strong>Active Mitigation Discount Applied: -4.0%</strong> (Continuous satellite alert
            telemetry + Community patrol accord)
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-text-muted">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>VCS AFOLU Sec. 3.2</span>
        </div>
      </div>
    </div>
  )
}
