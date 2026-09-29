import { useState, useRef, useEffect } from 'react'
import { SlidersHorizontal, Calendar, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

interface TemporalSplitMapProps {
  siteName: string
  areaHectares?: number
  baselineYear?: number
  currentYear?: number
}

export function TemporalSplitMap({
  siteName,
  areaHectares: _areaHectares = 1250,
  baselineYear = 2021,
  currentYear = 2026,
}: TemporalSplitMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [sliderPos, setSliderPos] = useState<number>(50) // percentage 0 - 100
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [activeBand, setActiveBand] = useState<'ndvi' | 'optical'>('ndvi')

  const handlePointerDown = () => {
    setIsDragging(true)
  }

  useEffect(() => {
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const x = clientX - rect.left
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100))
      setSliderPos(pct)
    }

    const handlePointerUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener('mousemove', handlePointerMove)
      window.addEventListener('mouseup', handlePointerUp)
      window.addEventListener('touchmove', handlePointerMove)
      window.addEventListener('touchend', handlePointerUp)
    }

    return () => {
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('mouseup', handlePointerUp)
      window.removeEventListener('touchmove', handlePointerMove)
      window.removeEventListener('touchend', handlePointerUp)
    }
  }, [isDragging])

  return (
    <div className="card p-5 sm:p-6 space-y-5 border border-border shadow-card bg-bg-surface">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-cyan/15 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-text-primary">
                Temporal Change Detection · Before vs. After
              </h3>
              <Badge variant="info" dot>
                Multi-Epoch NDVI
              </Badge>
            </div>

            <p className="text-xs text-text-muted mt-0.5">
              Comparative remote sensing analysis: Baseline ({baselineYear}) vs. Current (
              {currentYear}) for {siteName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center bg-bg-elevated p-1 rounded-lg border border-border text-xs">
            <button
              onClick={() => setActiveBand('ndvi')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeBand === 'ndvi'
                  ? 'bg-accent-emerald text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              NDVI Infrared
            </button>
            <button
              onClick={() => setActiveBand('optical')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeBand === 'optical'
                  ? 'bg-accent-emerald text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              True Color RGB
            </button>
          </div>
        </div>
      </div>

      {/* Split-Screen Interactive Visualizer */}
      <div
        ref={containerRef}
        className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden select-none border border-border bg-black cursor-ew-resize"
      >
        {/* RIGHT LAYER: Current Year (e.g. 2026) */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 flex items-center justify-center">
          {/* Simulated Satellite Canvas */}
          <div className="absolute inset-0 opacity-80 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-lg bg-black/75 backdrop-blur-md border border-accent-emerald/40 text-xs font-bold text-accent-emerald flex items-center gap-1.5 shadow-lg">
            <Sparkles className="w-3.5 h-3.5" />
            {currentYear} Current (Sentinel-2 L2A) · NDVI: 0.81
          </div>
          <div className="text-center p-6 space-y-2 max-w-sm pointer-events-none">
            <span className="text-4xl">🌳</span>
            <h4 className="text-sm font-bold text-white tracking-wide">
              Post-Restoration Mature Canopy
            </h4>
            <p className="text-xs text-emerald-200/80">
              High density biomass accumulation, closed canopy topology, +22.8 tCO₂e/ha carbon
              growth.
            </p>
          </div>
        </div>

        {/* LEFT LAYER: Baseline Year (e.g. 2021) with CSS Clip-path */}
        <div
          style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
          className="absolute inset-0 bg-gradient-to-br from-amber-950 via-stone-900 to-amber-900 flex items-center justify-center"
        >
          <div className="absolute inset-0 opacity-60 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-lg bg-black/75 backdrop-blur-md border border-accent-amber/40 text-xs font-bold text-accent-amber flex items-center gap-1.5 shadow-lg">
            <Calendar className="w-3.5 h-3.5" />
            {baselineYear} Historical Baseline · NDVI: 0.62
          </div>
          <div className="text-center p-6 space-y-2 max-w-sm pointer-events-none">
            <span className="text-4xl">🌱</span>
            <h4 className="text-sm font-bold text-amber-100 tracking-wide">
              Pre-Intervention Baseline
            </h4>
            <p className="text-xs text-amber-200/80">
              Sparse vegetative cover, secondary succession, lower moisture retention capacity.
            </p>
          </div>
        </div>

        {/* DRAGGABLE DIVIDER CURTAIN BAR */}
        <div
          style={{ left: `${sliderPos}%` }}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] z-20 flex items-center justify-center -translate-x-1/2 cursor-ew-resize"
        >
          <div className="w-8 h-8 rounded-full bg-white text-black font-bold flex items-center justify-center shadow-2xl text-xs border border-gray-300 transition-transform hover:scale-110">
            ⇄
          </div>
        </div>

        {/* Bottom overlay helper label */}
        <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none z-10">
          <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] text-white/90 border border-white/20">
            Drag slider left / right to compare satellite epochs
          </span>
        </div>
      </div>

      {/* Analytical Change Metrics Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-bg-elevated border border-border">
          <span className="text-[11px] text-text-muted block">NDVI Change (Δ)</span>
          <span className="text-base font-bold text-accent-emerald">+0.19 (+30.6%)</span>
          <span className="text-[10px] text-text-muted block mt-0.5">Vegetative Greening</span>
        </div>

        <div className="p-3 rounded-lg bg-bg-elevated border border-border">
          <span className="text-[11px] text-text-muted block">Carbon Sequestration</span>
          <span className="text-base font-bold text-accent-cyan">+32.4 tCO₂e/ha</span>
          <span className="text-[10px] text-text-muted block mt-0.5">Cumulative 5-Yr Growth</span>
        </div>

        <div className="p-3 rounded-lg bg-bg-elevated border border-border">
          <span className="text-[11px] text-text-muted block">Canopy Closure</span>
          <span className="text-base font-bold text-accent-green">+18.5%</span>
          <span className="text-[10px] text-text-muted block mt-0.5">Structural Expansion</span>
        </div>

        <div className="p-3 rounded-lg bg-bg-elevated border border-border">
          <span className="text-[11px] text-text-muted block">Deforestation Scars</span>
          <span className="text-base font-bold text-accent-emerald">0.0 ha</span>
          <span className="text-[10px] text-text-muted block mt-0.5">Zero Degradation</span>
        </div>
      </div>
    </div>
  )
}
