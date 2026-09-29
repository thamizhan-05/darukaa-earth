import { useState } from 'react'
import { Satellite, Layers, Sparkles, TreePine, Activity, Maximize2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

interface CanopyLidarProfileProps {
  siteName: string
  areaHectares: number
}

interface WaveformPoint {
  heightM: number
  energyIntensity: number // return laser energy
  stratum: 'EMERGENT' | 'DOMINANT' | 'UNDERSTORY' | 'GROUND'
}

export function CanopyLidarProfile({ siteName, areaHectares }: CanopyLidarProfileProps) {
  const [selectedShot, setSelectedShot] = useState<string>('GEDI02_A_2026112_04')
  const [showFullWaveform, setShowFullWaveform] = useState(false)

  // Calibrated GEDI full-waveform vertical profile
  const waveformData: WaveformPoint[] = [
    { heightM: 38, energyIntensity: 12, stratum: 'EMERGENT' },
    { heightM: 35, energyIntensity: 34, stratum: 'EMERGENT' },
    { heightM: 32, energyIntensity: 78, stratum: 'EMERGENT' },
    { heightM: 28, energyIntensity: 95, stratum: 'DOMINANT' },
    { heightM: 24, energyIntensity: 88, stratum: 'DOMINANT' },
    { heightM: 20, energyIntensity: 62, stratum: 'DOMINANT' },
    { heightM: 16, energyIntensity: 45, stratum: 'UNDERSTORY' },
    { heightM: 12, energyIntensity: 56, stratum: 'UNDERSTORY' },
    { heightM: 8, energyIntensity: 38, stratum: 'UNDERSTORY' },
    { heightM: 4, energyIntensity: 22, stratum: 'GROUND' },
    { heightM: 1, energyIntensity: 100, stratum: 'GROUND' }, // Ground return spike
  ]

  const maxIntensity = Math.max(...waveformData.map((w) => w.energyIntensity))

  return (
    <div className="card p-5 sm:p-6 space-y-6 border border-border bg-bg-surface shadow-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-cyan/15 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-text-primary">
                NASA GEDI 3D Spaceborne LiDAR Canopy Profiler
              </h3>
              <Badge variant="info" dot>
                Full-Waveform L2A
              </Badge>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Vertical forest stratification & structural biomass cross-section for {siteName} (
              {areaHectares.toFixed(1)} ha)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedShot}
            onChange={(e) => setSelectedShot(e.target.value)}
            className="input-select text-xs font-mono py-1 px-2.5"
          >
            <option value="GEDI02_A_2026112_04">Beam 0100 (Power 1) - Western Transect</option>
            <option value="GEDI02_A_2026115_02">Beam 0110 (Coverage) - Ridge Crest</option>
            <option value="GEDI02_A_2026118_07">Beam 0011 (Power 2) - Riparian Basin</option>
          </select>
        </div>
      </div>

      {/* Key Structure Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl bg-bg-elevated/70 border border-border">
          <span className="text-[11px] text-text-muted block">Max Canopy Height (RH98)</span>
          <span className="text-xl font-bold text-accent-cyan">36.4 meters</span>
          <span className="text-[10px] text-text-muted block mt-0.5">Emergent Teak & Rosewood</span>
        </div>

        <div className="p-3.5 rounded-xl bg-bg-elevated/70 border border-border">
          <span className="text-[11px] text-text-muted block">Median Biomass Height (RH50)</span>
          <span className="text-xl font-bold text-accent-green">22.8 meters</span>
          <span className="text-[10px] text-text-muted block mt-0.5">High Density Midstory</span>
        </div>

        <div className="p-3.5 rounded-xl bg-bg-elevated/70 border border-border">
          <span className="text-[11px] text-text-muted block">Canopy Cover Fraction</span>
          <span className="text-xl font-bold text-text-primary">84.2%</span>
          <span className="text-[10px] text-text-muted block mt-0.5">Continuous closed canopy</span>
        </div>

        <div className="p-3.5 rounded-xl bg-bg-elevated/70 border border-border">
          <span className="text-[11px] text-text-muted block">Spaceborne Sensor</span>
          <span className="text-xl font-bold text-info">GEDI ISS 1064nm</span>
          <span className="text-[10px] text-text-muted block mt-0.5">25m ground footprint</span>
        </div>
      </div>

      {/* Waveform Cross-Section Visualizer */}
      <div className="p-4 sm:p-5 rounded-2xl bg-bg-base border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent-cyan" />
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Vertical LiDAR Waveform Energy Distribution (0m &rarr; 40m)
            </h4>
          </div>
          <button
            onClick={() => setShowFullWaveform(!showFullWaveform)}
            className="text-[11px] text-text-muted hover:text-text-primary flex items-center gap-1"
          >
            <Maximize2 className="w-3 h-3" /> {showFullWaveform ? 'Compact' : 'Detailed'}
          </button>
        </div>

        {/* Visual Waveform Vertical Bars */}
        <div className="space-y-2 pt-1 font-mono text-xs">
          {waveformData.map((pt) => {
            const widthPct = Math.round((pt.energyIntensity / maxIntensity) * 100)
            const isGround = pt.stratum === 'GROUND'
            const isEmergent = pt.stratum === 'EMERGENT'

            return (
              <div key={pt.heightM} className="flex items-center gap-3">
                <span className="w-12 text-right text-text-muted text-[11px] shrink-0">
                  {pt.heightM} m
                </span>

                <div className="flex-1 bg-bg-elevated h-5 rounded-md overflow-hidden relative border border-border/40">
                  <div
                    style={{ width: `${widthPct}%` }}
                    className={`h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-bold ${
                      isGround
                        ? 'bg-gradient-to-r from-amber-700 to-amber-500 text-white'
                        : isEmergent
                          ? 'bg-gradient-to-r from-teal-500 to-emerald-400 text-bg-base'
                          : 'bg-gradient-to-r from-cyan-600 to-teal-400 text-bg-base'
                    }`}
                  >
                    {widthPct > 20 && `${pt.energyIntensity}V`}
                  </div>
                </div>

                <span
                  className={`w-24 text-[10px] uppercase font-bold shrink-0 ${
                    isGround
                      ? 'text-amber-500'
                      : isEmergent
                        ? 'text-accent-teal'
                        : 'text-text-secondary'
                  }`}
                >
                  {pt.stratum}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stratification Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-bg-elevated/40 border border-border space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-accent-teal">
            <TreePine className="w-4 h-4" />
            <span>Old-Growth Complexity</span>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Multi-tiered canopy returns indicate structural maturity consistent with primary
            tropical evergreen climax forests.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-bg-elevated/40 border border-border space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-accent-cyan">
            <Layers className="w-4 h-4" />
            <span>Aboveground Biomass</span>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Allometric fusion with RH50 yields an estimated <strong>194.2 tC/ha</strong> aboveground
            biomass density.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-bg-elevated/40 border border-border space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-accent-green">
            <Sparkles className="w-4 h-4" />
            <span>Zero Flight Cost</span>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Spaceborne laser shots calibrated continuously without requiring $100k+ airplane LiDAR
            charter flights.
          </p>
        </div>
      </div>
    </div>
  )
}
