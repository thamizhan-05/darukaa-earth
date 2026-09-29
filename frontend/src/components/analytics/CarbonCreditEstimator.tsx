import { useState, useMemo } from 'react'
import {
  Coins,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Info,
  Calendar,
  Award,
  Users,
} from 'lucide-react'

interface CarbonCreditEstimatorProps {
  siteName: string
  areaHectares: number
  annualSequestrationRate?: number // tCO2e / ha / year
  currentCarbonStock?: number // tCO2e / ha
}

export function CarbonCreditEstimator({
  siteName,
  areaHectares,
  annualSequestrationRate = 6.8, // standard tropical/subtropical restoration average
  currentCarbonStock = 180,
}: CarbonCreditEstimatorProps) {
  const [creditingYears, setCreditingYears] = useState<number>(20)
  const [carbonPriceUsd, setCarbonPriceUsd] = useState<number>(24) // $24 / tCO2e VCM price
  const [bufferPoolPct, setBufferPoolPct] = useState<number>(15) // Verra non-permanence risk buffer
  const mrvCostPct = 8 // 8% MRV & verification overhead
  const communitySharePct = 30 // 30% for local community restoration

  const calculations = useMemo(() => {
    const area = Math.max(1, areaHectares)
    const annualTotalSequestration = area * annualSequestrationRate
    const grossCumulativeCredits = annualTotalSequestration * creditingYears
    const bufferCredits = (grossCumulativeCredits * bufferPoolPct) / 100
    const netTradeableCredits = grossCumulativeCredits - bufferCredits

    const grossRevenue = netTradeableCredits * carbonPriceUsd
    const mrvCosts = (grossRevenue * mrvCostPct) / 100
    const netProjectRevenue = grossRevenue - mrvCosts
    const communityFund = (netProjectRevenue * communitySharePct) / 100
    const annualNetRevenue = netProjectRevenue / creditingYears

    return {
      annualTotalSequestration,
      grossCumulativeCredits,
      bufferCredits,
      netTradeableCredits,
      grossRevenue,
      mrvCosts,
      netProjectRevenue,
      communityFund,
      annualNetRevenue,
    }
  }, [
    areaHectares,
    annualSequestrationRate,
    creditingYears,
    carbonPriceUsd,
    bufferPoolPct,
    mrvCostPct,
    communitySharePct,
  ])

  return (
    <div className="card p-5 sm:p-6 space-y-6 border border-accent-emerald/25 bg-gradient-to-br from-bg-surface via-bg-surface to-accent-emerald/5 shadow-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-emerald/15 border border-accent-emerald/30 flex items-center justify-center text-accent-emerald">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-text-primary">
                Carbon Credit Issuance & Financial Yield
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-accent-emerald/20 text-accent-emerald uppercase tracking-wider">
                Verra VCS Aligned
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Voluntary Carbon Market (VCM) economic modeling for {siteName} (
              {areaHectares.toFixed(1)} ha · {currentCarbonStock.toFixed(1)} tCO₂e/ha baseline)
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-text-muted uppercase tracking-wider block">
            Estimated Net Value
          </span>
          <span className="text-xl sm:text-2xl font-black text-accent-emerald">
            $
            {calculations.netProjectRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-lg bg-bg-elevated/70 border border-border">
          <div className="flex items-center justify-between text-text-muted text-xs mb-1">
            <span>Net Tradeable Credits</span>
            <Award className="w-3.5 h-3.5 text-accent-emerald" />
          </div>
          <div className="text-lg font-bold text-text-primary">
            {Math.round(calculations.netTradeableCredits).toLocaleString()}
          </div>
          <span className="text-[11px] text-text-muted">tCO₂e ({creditingYears} yr pool)</span>
        </div>

        <div className="p-3.5 rounded-lg bg-bg-elevated/70 border border-border">
          <div className="flex items-center justify-between text-text-muted text-xs mb-1">
            <span>Annual Run-Rate</span>
            <TrendingUp className="w-3.5 h-3.5 text-accent-cyan" />
          </div>
          <div className="text-lg font-bold text-text-primary">
            ${Math.round(calculations.annualNetRevenue).toLocaleString()}
          </div>
          <span className="text-[11px] text-text-muted">per year net cash flow</span>
        </div>

        <div className="p-3.5 rounded-lg bg-bg-elevated/70 border border-border">
          <div className="flex items-center justify-between text-text-muted text-xs mb-1">
            <span>Risk Buffer Reserve</span>
            <ShieldCheck className="w-3.5 h-3.5 text-accent-amber" />
          </div>
          <div className="text-lg font-bold text-accent-amber">
            {Math.round(calculations.bufferCredits).toLocaleString()}
          </div>
          <span className="text-[11px] text-text-muted">tCO₂e ({bufferPoolPct}% permanence)</span>
        </div>

        <div className="p-3.5 rounded-lg bg-bg-elevated/70 border border-border">
          <div className="flex items-center justify-between text-text-muted text-xs mb-1">
            <span>Community Fund</span>
            <Users className="w-3.5 h-3.5 text-accent-purple" />
          </div>
          <div className="text-lg font-bold text-accent-purple">
            ${Math.round(calculations.communityFund).toLocaleString()}
          </div>
          <span className="text-[11px] text-text-muted">Local restoration pool</span>
        </div>
      </div>

      {/* Interactive Parameter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 rounded-xl bg-bg-elevated/40 border border-border">
        {/* Crediting Period Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-text-secondary font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-accent-emerald" />
              Crediting Period
            </span>
            <span className="font-bold text-text-primary">{creditingYears} Years</span>
          </div>
          <input
            type="range"
            min="5"
            max="30"
            step="5"
            value={creditingYears}
            onChange={(e) => setCreditingYears(Number(e.target.value))}
            className="w-full accent-accent-emerald cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-text-muted">
            <span>5 yr</span>
            <span>15 yr</span>
            <span>30 yr (Full Vintage)</span>
          </div>
        </div>

        {/* Carbon Price Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-text-secondary font-medium flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-accent-emerald" />
              Carbon Unit Price
            </span>
            <span className="font-bold text-accent-emerald">${carbonPriceUsd} / tCO₂e</span>
          </div>
          <input
            type="range"
            min="10"
            max="60"
            step="2"
            value={carbonPriceUsd}
            onChange={(e) => setCarbonPriceUsd(Number(e.target.value))}
            className="w-full accent-accent-emerald cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-text-muted">
            <span>$10 (Standard)</span>
            <span>$30 (High Quality)</span>
            <span>$60 (Removal)</span>
          </div>
        </div>

        {/* Risk Buffer Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-text-secondary font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-accent-amber" />
              Non-Permanence Buffer
            </span>
            <span className="font-bold text-accent-amber">{bufferPoolPct}% Holdback</span>
          </div>
          <input
            type="range"
            min="10"
            max="30"
            step="1"
            value={bufferPoolPct}
            onChange={(e) => setBufferPoolPct(Number(e.target.value))}
            className="w-full accent-accent-amber cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-text-muted">
            <span>10% Low Risk</span>
            <span>20% High Risk Fire Zone</span>
            <span>30%</span>
          </div>
        </div>
      </div>

      {/* Methodology & Revenue Waterfall Breakdown */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Credit Revenue Allocation Waterfall
        </h4>
        <div className="h-4 rounded-full overflow-hidden flex bg-bg-elevated border border-border">
          <div
            style={{ width: `${100 - mrvCostPct - communitySharePct}%` }}
            className="bg-accent-emerald h-full transition-all duration-300"
            title="Project Developer & Operations"
          />
          <div
            style={{ width: `${communitySharePct}%` }}
            className="bg-accent-purple h-full transition-all duration-300"
            title="Community Reinvestment"
          />
          <div
            style={{ width: `${mrvCostPct}%` }}
            className="bg-accent-cyan h-full transition-all duration-300"
            title="MRV & Third-Party Audit"
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 flex-wrap gap-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-accent-emerald" /> Project Operations (
            {100 - mrvCostPct - communitySharePct}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-accent-purple" /> Community Benefit (
            {communitySharePct}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-accent-cyan" /> MRV Telemetry & Audit (
            {mrvCostPct}%)
          </span>
        </div>
      </div>

      {/* Standard Notice */}
      <div className="p-3 rounded-lg bg-bg-base/60 border border-border flex items-start gap-2.5 text-xs text-text-muted">
        <Info className="w-4 h-4 text-accent-emerald shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Credits calculated using AFOLU (Agriculture, Forestry and Other Land Use) ARR
          (Afforestation, Reforestation & Revegetation) methodologies. Sequestration baseline
          calibrated from Sentinel-2 NDVI vegetative growth delta and field-sampled biomass carbon
          baselines.
        </p>
      </div>
    </div>
  )
}
