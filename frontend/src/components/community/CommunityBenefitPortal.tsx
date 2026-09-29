import { useState } from 'react'
import { Users, HeartHandshake, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

interface CommunityBenefitPortalProps {
  siteName: string
  areaHectares: number
}

interface DisbursementItem {
  id: string
  initiative: string
  category: 'AGROFORESTRY' | 'RANGERS' | 'WATER' | 'EDUCATION'
  amountUsd: number
  beneficiaryCommunity: string
  date: string
  status: 'DISBURSED' | 'ALLOCATED'
}

export function CommunityBenefitPortal({ siteName, areaHectares }: CommunityBenefitPortalProps) {
  const [disbursements] = useState<DisbursementItem[]>([
    {
      id: 'disb-1',
      initiative: 'Tribal Agroforestry & Native Sapling Nursery',
      category: 'AGROFORESTRY',
      amountUsd: 38000,
      beneficiaryCommunity: 'Muduvar & Kadar Forest Hamlet Councils',
      date: '12 Sep 2026',
      status: 'DISBURSED',
    },
    {
      id: 'disb-2',
      initiative: 'Indigenous Ranger Patrol Living Wages & Equipment',
      category: 'RANGERS',
      amountUsd: 52000,
      beneficiaryCommunity: 'Attappady Wildlife Defense Collective',
      date: '01 Aug 2026',
      status: 'DISBURSED',
    },
    {
      id: 'disb-3',
      initiative: 'Solar Micro-Grid Rainwater Purification Systems',
      category: 'WATER',
      amountUsd: 28500,
      beneficiaryCommunity: 'Eastern Valley Tribal Settlements (3 Villages)',
      date: '15 Jul 2026',
      status: 'DISBURSED',
    },
    {
      id: 'disb-4',
      initiative: 'Youth Ecological Stewardship & Drone Survey Training',
      category: 'EDUCATION',
      amountUsd: 24000,
      beneficiaryCommunity: 'Community Youth Center & Forestry Cooperative',
      date: '10 Jun 2026',
      status: 'DISBURSED',
    },
  ])

  const totalDisbursed = disbursements.reduce((acc, d) => acc + d.amountUsd, 0)

  return (
    <div className="card p-5 sm:p-6 space-y-6 border border-border bg-bg-surface shadow-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-purple/15 border border-accent-purple/30 flex items-center justify-center text-accent-purple">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-text-primary">
                Community Benefit & FPIC Governance Portal
              </h3>
              <Badge variant="bio" dot>
                CCB Gold Standard
              </Badge>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Transparent carbon revenue distribution & indigenous stewardship for {siteName} (
              {areaHectares.toFixed(1)} ha protected)
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-text-muted uppercase tracking-wider block font-semibold">
            Total Community Pool Disbursed
          </span>
          <span className="text-xl sm:text-2xl font-black text-accent-purple">
            ${totalDisbursed.toLocaleString()} USD
          </span>
        </div>
      </div>

      {/* FPIC & SDG Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-bg-elevated/70 border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-accent-purple" />
              FPIC Accord Status
            </span>
            <span className="text-[10px] font-bold text-accent-green px-2 py-0.5 rounded bg-accent-green/15">
              VERIFIED
            </span>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Free, Prior, and Informed Consent agreement ratified by 100% of participating indigenous
            tribal councils with bilingual documentation.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-bg-elevated/70 border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-accent-amber" />
              UN SDG Alignment
            </span>
            <span className="text-[10px] font-bold text-accent-amber px-2 py-0.5 rounded bg-accent-amber/15">
              4 Goals Active
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold pt-1">
            <span className="px-2 py-0.5 rounded bg-accent-red/20 text-accent-red">SDG 1</span>
            <span className="px-2 py-0.5 rounded bg-info/20 text-info">SDG 6</span>
            <span className="px-2 py-0.5 rounded bg-accent-green/20 text-accent-green">SDG 13</span>
            <span className="px-2 py-0.5 rounded bg-accent-emerald/20 text-accent-emerald">
              SDG 15
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-bg-elevated/70 border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-accent-green" />
              Revenue Share Ratio
            </span>
            <span className="text-[10px] font-bold text-accent-green px-2 py-0.5 rounded bg-accent-green/15">
              30% Mandate
            </span>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            30% of all gross voluntary carbon market revenues directly ring-fenced for grassroots
            local health, education, and forest cooperatives.
          </p>
        </div>
      </div>

      {/* Disbursement Ledger Table */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Community Fund Disbursement Ledger
        </h4>

        <div className="border border-border rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-bg-elevated text-text-secondary font-semibold border-b border-border">
              <tr>
                <th className="py-2.5 px-3.5">Community Project Initiative</th>
                <th className="py-2.5 px-3.5">Beneficiary Hamlet</th>
                <th className="py-2.5 px-3.5">Date Disbursed</th>
                <th className="py-2.5 px-3.5">Amount (USD)</th>
                <th className="py-2.5 px-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {disbursements.map((d) => (
                <tr key={d.id} className="hover:bg-bg-elevated/40">
                  <td className="py-2.5 px-3.5 font-bold text-text-primary">{d.initiative}</td>
                  <td className="py-2.5 px-3.5 text-text-muted">{d.beneficiaryCommunity}</td>
                  <td className="py-2.5 px-3.5 text-text-muted">{d.date}</td>
                  <td className="py-2.5 px-3.5 font-bold text-accent-purple font-mono">
                    ${d.amountUsd.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-accent-green/15 text-accent-green">
                      <CheckCircle2 className="w-3 h-3" /> Disbursed
                    </span>
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
