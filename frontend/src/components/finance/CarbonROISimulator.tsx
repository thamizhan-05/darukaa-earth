import { useState, useMemo } from 'react'
import { DollarSign, Download, Calendar, Percent } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

interface CarbonROISimulatorProps {
  siteName: string
  areaHectares: number
  defaultSequestrationRate?: number
}

export function CarbonROISimulator({
  siteName,
  areaHectares,
  defaultSequestrationRate = 7.4,
}: CarbonROISimulatorProps) {
  const [carbonPrice, setCarbonPrice] = useState<number>(28) // $28 / tCO2e
  const [sequestrationRate, setSequestrationRate] = useState<number>(defaultSequestrationRate)
  const [capexPerHa, setCapexPerHa] = useState<number>(140) // $140 / ha upfront
  const [opexPerHa, setOpexPerHa] = useState<number>(18) // $18 / ha / year
  const [discountRate, setDiscountRate] = useState<number>(8) // 8% WACC

  const financialModel = useMemo(() => {
    const area = Math.max(1, areaHectares)
    const annualCredits = area * sequestrationRate
    const annualGrossRevenue = annualCredits * carbonPrice
    const annualOpex = area * opexPerHa
    const upfrontCapex = area * capexPerHa

    // 10-year cashflows
    const yearlyCashflows: {
      year: number
      grossRevenue: number
      opex: number
      netCashflow: number
      discountedCashflow: number
      cumulativeNet: number
    }[] = []

    let cumulative = -upfrontCapex
    let npv = -upfrontCapex

    for (let yr = 1; yr <= 10; yr++) {
      // Annual 2.5% inflation on credit price
      const priceAtYear = carbonPrice * Math.pow(1.025, yr - 1)
      const rev = annualCredits * priceAtYear
      const net = rev - annualOpex
      const df = 1 / Math.pow(1 + discountRate / 100, yr)
      const discounted = net * df

      npv += discounted
      cumulative += net

      yearlyCashflows.push({
        year: yr,
        grossRevenue: Math.round(rev),
        opex: Math.round(annualOpex),
        netCashflow: Math.round(net),
        discountedCashflow: Math.round(discounted),
        cumulativeNet: Math.round(cumulative),
      })
    }

    // Payback period
    let paybackYears = 10
    const paybackObj = yearlyCashflows.find((y) => y.cumulativeNet >= 0)
    if (paybackObj) {
      const prev = yearlyCashflows[paybackObj.year - 2]
      const prevCum = prev ? prev.cumulativeNet : -upfrontCapex
      const frac = Math.abs(prevCum) / paybackObj.netCashflow
      paybackYears = parseFloat((paybackObj.year - 1 + frac).toFixed(1))
    }

    // Rough IRR approximation
    const totalNet10Yr = yearlyCashflows.reduce((acc, y) => acc + y.netCashflow, 0)
    const irrEstimate = Math.min(
      85,
      Math.max(4, Math.round(((totalNet10Yr / upfrontCapex) * 100) / 10)),
    )

    return {
      annualCredits: Math.round(annualCredits),
      upfrontCapex: Math.round(upfrontCapex),
      annualGrossRevenue: Math.round(annualGrossRevenue),
      annualOpex: Math.round(annualOpex),
      npv: Math.round(npv),
      irrEstimate,
      paybackYears,
      totalNet10Yr: Math.round(totalNet10Yr),
      yearlyCashflows,
    }
  }, [areaHectares, carbonPrice, sequestrationRate, capexPerHa, opexPerHa, discountRate])

  const handleDownloadFactsheet = () => {
    let csv = `Year,Gross_Revenue_USD,OPEX_USD,Net_Cashflow_USD,Discounted_NPV_USD,Cumulative_USD\n`
    csv += `0,0,${financialModel.upfrontCapex},-${financialModel.upfrontCapex},-${financialModel.upfrontCapex},-${financialModel.upfrontCapex}\n`
    financialModel.yearlyCashflows.forEach((y) => {
      csv += `${y.year},${y.grossRevenue},${y.opex},${y.netCashflow},${y.discountedCashflow},${y.cumulativeNet}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${siteName.toLowerCase().replace(/\s+/g, '_')}_10yr_financial_model.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('10-Year Investor Cashflow CSV exported!')
  }

  return (
    <div className="card p-5 sm:p-6 space-y-6 border border-border bg-bg-surface shadow-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-green/15 border border-accent-green/30 flex items-center justify-center text-accent-green">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-text-primary">
                Investor Green Bond & Carbon ROI Simulator
              </h3>
              <Badge variant="carbon" dot>
                DCF Model
              </Badge>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              10-year discounted cashflow projection & capital payback analysis for {siteName}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          leftIcon={<Download className="w-4 h-4 text-accent-green" />}
          onClick={handleDownloadFactsheet}
        >
          Export CSV Model
        </Button>
      </div>

      {/* Key Financial KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl bg-bg-elevated/70 border border-border">
          <span className="text-[11px] text-text-muted block">10-Yr Net Present Value (NPV)</span>
          <span className="text-xl font-bold text-accent-green">
            ${(financialModel.npv / 1000).toFixed(0)}k USD
          </span>
          <span className="text-[10px] text-text-muted block mt-0.5">
            Discounted at {discountRate}% WACC
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-bg-elevated/70 border border-border">
          <span className="text-[11px] text-text-muted block">Projected IRR</span>
          <span className="text-xl font-bold text-accent-cyan">{financialModel.irrEstimate}%</span>
          <span className="text-[10px] text-text-muted block mt-0.5">Internal Rate of Return</span>
        </div>

        <div className="p-3.5 rounded-xl bg-bg-elevated/70 border border-border">
          <span className="text-[11px] text-text-muted block">Capital Payback Period</span>
          <span className="text-xl font-bold text-accent-amber">
            {financialModel.paybackYears} Years
          </span>
          <span className="text-[10px] text-text-muted block mt-0.5">
            Break-even on initial CAPEX
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-bg-elevated/70 border border-border">
          <span className="text-[11px] text-text-muted block">Total 10-Yr Net Profit</span>
          <span className="text-xl font-bold text-text-primary">
            ${(financialModel.totalNet10Yr / 1000).toFixed(0)}k USD
          </span>
          <span className="text-[10px] text-text-muted block mt-0.5">Cumulative net margin</span>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-bg-elevated/40 border border-border text-xs">
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-text-secondary font-medium">Carbon Price</span>
            <span className="font-bold text-text-primary font-mono">${carbonPrice} / tCO₂e</span>
          </div>
          <input
            type="range"
            min="10"
            max="65"
            step="1"
            value={carbonPrice}
            onChange={(e) => setCarbonPrice(parseInt(e.target.value))}
            className="w-full accent-accent-green"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-text-secondary font-medium">Annual Sequestration</span>
            <span className="font-bold text-text-primary font-mono">
              {sequestrationRate} tCO₂e/ha
            </span>
          </div>
          <input
            type="range"
            min="2"
            max="15"
            step="0.5"
            value={sequestrationRate}
            onChange={(e) => setSequestrationRate(parseFloat(e.target.value))}
            className="w-full accent-accent-green"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-text-secondary font-medium">Upfront CAPEX</span>
            <span className="font-bold text-text-primary font-mono">${capexPerHa} / ha</span>
          </div>
          <input
            type="range"
            min="50"
            max="500"
            step="10"
            value={capexPerHa}
            onChange={(e) => setCapexPerHa(parseInt(e.target.value))}
            className="w-full accent-accent-green"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-text-secondary font-medium">Annual MRV/OPEX</span>
            <span className="font-bold text-text-primary font-mono">${opexPerHa} / ha/yr</span>
          </div>
          <input
            type="range"
            min="5"
            max="60"
            step="2"
            value={opexPerHa}
            onChange={(e) => setOpexPerHa(parseInt(e.target.value))}
            className="w-full accent-accent-green"
          />
        </div>
      </div>

      {/* Yearly Cashflow Forecast Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-text-secondary uppercase tracking-wider">
            10-Year Pro-Forma Cashflow Projection (USD)
          </span>
          <div className="flex items-center gap-1.5 text-text-muted">
            <Percent className="w-3.5 h-3.5" />
            <span>Discount Rate:</span>
            <select
              value={discountRate}
              onChange={(e) => setDiscountRate(parseInt(e.target.value))}
              className="bg-bg-elevated border border-border rounded px-1.5 py-0.5 text-xs font-mono"
            >
              <option value="6">6%</option>
              <option value="8">8% (Standard)</option>
              <option value="10">10%</option>
              <option value="12">12% (High Risk)</option>
            </select>
          </div>
        </div>

        <div className="border border-border rounded-xl overflow-x-auto text-xs">
          <table className="w-full text-left font-mono">
            <thead className="bg-bg-elevated text-text-secondary font-semibold border-b border-border">
              <tr>
                <th className="py-2.5 px-3.5">Year</th>
                <th className="py-2.5 px-3.5">Gross Revenue</th>
                <th className="py-2.5 px-3.5">Operating Cost</th>
                <th className="py-2.5 px-3.5">Net Cash Flow</th>
                <th className="py-2.5 px-3.5 text-right">Cumulative Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {financialModel.yearlyCashflows.slice(0, 7).map((cf) => (
                <tr key={cf.year} className="hover:bg-bg-elevated/40">
                  <td className="py-2 px-3.5 font-bold font-sans flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-text-muted" /> Year {cf.year}
                  </td>
                  <td className="py-2 px-3.5 text-text-primary">
                    ${cf.grossRevenue.toLocaleString()}
                  </td>
                  <td className="py-2 px-3.5 text-text-muted">-${cf.opex.toLocaleString()}</td>
                  <td className="py-2 px-3.5 font-bold text-accent-green">
                    +${cf.netCashflow.toLocaleString()}
                  </td>
                  <td
                    className={`py-2 px-3.5 text-right font-bold ${
                      cf.cumulativeNet >= 0 ? 'text-accent-green' : 'text-accent-amber'
                    }`}
                  >
                    {cf.cumulativeNet >= 0 ? '+' : ''}${cf.cumulativeNet.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
