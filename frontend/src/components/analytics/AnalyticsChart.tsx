import { useState, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { format, subMonths } from 'date-fns'
import {
  Leaf,
  Activity,
  Trees,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Info,
  Bug,
  SunMedium,
} from 'lucide-react'
import type { MetricSummary, TimeSeriesPoint } from '@/types/analytics'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

export const CORE_METRIC_CONFIGS = [
  {
    key: 'CARBON_STOCK',
    label: 'Carbon Stock',
    unit: 'tCO₂e/ha',
    color: '#3FB950',
    icon: Leaf,
    description: 'Total above & below-ground carbon density',
  },
  {
    key: 'CARBON_SEQUESTRATION',
    label: 'Carbon Sequestration',
    unit: 'tCO₂e/ha/yr',
    color: '#2EA043',
    icon: TrendingUp,
    description: 'Annual carbon uptake rate per hectare',
  },
  {
    key: 'BIODIVERSITY_INDEX',
    label: 'Biodiversity Index',
    unit: 'index',
    color: '#388BFD',
    icon: Sparkles,
    description: 'Composite Simpson-Shannon biodiversity score (0 - 1.0)',
  },
  {
    key: 'NDVI',
    label: 'NDVI',
    unit: 'index',
    color: '#56D364',
    icon: Activity,
    description: 'Normalized Difference Vegetation Index from Sentinel-2',
  },
  {
    key: 'TREE_DENSITY',
    label: 'Tree Density',
    unit: 'trees/ha',
    color: '#D29922',
    icon: Trees,
    description: 'Estimated mature trees per hectare',
  },
  {
    key: 'SPECIES_COUNT',
    label: 'Species Count',
    unit: 'species',
    color: '#A371F7',
    icon: Bug,
    description: 'Documented flora & fauna species richness',
  },
  {
    key: 'CANOPY_COVER',
    label: 'Canopy Cover',
    unit: '%',
    color: '#39C5CF',
    icon: SunMedium,
    description: 'Percent tree canopy closure from aerial imagery',
  },
] as const

export type MetricKey = (typeof CORE_METRIC_CONFIGS)[number]['key']

export const TIME_PERIODS = ['30D', '3M', '6M', '1Y', 'ALL'] as const
export type PeriodKey = (typeof TIME_PERIODS)[number]

interface AnalyticsChartProps {
  timeSeries: Record<string, TimeSeriesPoint[]>
  metricSummaries?: Record<string, MetricSummary>
  isSynthetic?: boolean
  dataSourceNote?: string
  title?: string
  subtitle?: string
  defaultMetric?: MetricKey
  className?: string
}

export function AnalyticsChart({
  timeSeries,
  metricSummaries = {},
  isSynthetic = true,
  dataSourceNote = 'Synthetic Demo Dataset — Calibrated for Hackathon Demonstration',
  title,
  subtitle,
  defaultMetric = 'CARBON_STOCK',
  className = '',
}: AnalyticsChartProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>(defaultMetric)
  const [period, setPeriod] = useState<PeriodKey>('6M')

  const metricConfig = useMemo(() => {
    return CORE_METRIC_CONFIGS.find((m) => m.key === activeMetric) || CORE_METRIC_CONFIGS[0]
  }, [activeMetric])

  const rawPoints = useMemo(() => timeSeries[activeMetric] || [], [timeSeries, activeMetric])

  // Filter time-series by selected period
  const filteredPoints = useMemo(() => {
    if (period === 'ALL' || rawPoints.length === 0) return rawPoints
    const now = new Date()
    const cutoff = {
      '30D': subMonths(now, 1),
      '3M': subMonths(now, 3),
      '6M': subMonths(now, 6),
      '1Y': subMonths(now, 12),
    }[period]
    return rawPoints.filter((p) => new Date(p.date) >= cutoff)
  }, [rawPoints, period])

  // Statistics calculation for the current period
  const stats = useMemo(() => {
    const summary = metricSummaries[activeMetric]
    if (filteredPoints.length === 0) {
      return {
        current: summary?.current ?? null,
        previous: summary?.previous ?? null,
        changePct: summary?.change_pct ?? null,
        trendDirection: summary?.trend_direction ?? 'flat',
        min: summary?.min_value ?? null,
        max: summary?.max_value ?? null,
        avg: summary?.avg_value ?? null,
      }
    }
    const vals = filteredPoints.map((p) => p.value)
    const current = vals[vals.length - 1]
    const previous = vals.length >= 2 ? vals[vals.length - 2] : null
    const changePct =
      previous !== null && previous !== 0
        ? roundNum(((current - previous) / previous) * 100, 2)
        : null
    const trendDirection =
      changePct !== null ? (changePct > 0.5 ? 'up' : changePct < -0.5 ? 'down' : 'flat') : 'flat'

    return {
      current,
      previous,
      changePct,
      trendDirection,
      min: roundNum(Math.min(...vals), 3),
      max: roundNum(Math.max(...vals), 3),
      avg: roundNum(vals.reduce((a, b) => a + b, 0) / vals.length, 3),
    }
  }, [filteredPoints, metricSummaries, activeMetric])

  const chartData = useMemo(() => {
    const color = metricConfig.color
    return {
      labels: filteredPoints.map((p) => {
        try {
          return format(new Date(p.date), 'dd MMM yy')
        } catch {
          return p.date
        }
      }),
      datasets: [
        {
          label: metricConfig.label,
          data: filteredPoints.map((p) => p.value),
          borderColor: color,
          backgroundColor: (context: any) => {
            const chart = context.chart
            const { ctx, chartArea } = chart
            if (!chartArea) return `${color}20`
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
            gradient.addColorStop(0, `${color}45`)
            gradient.addColorStop(0.7, `${color}10`)
            gradient.addColorStop(1, `${color}00`)
            return gradient
          },
          fill: true,
          tension: 0.35,
          pointRadius: filteredPoints.length > 30 ? 2 : 4,
          pointHoverRadius: 7,
          pointBackgroundColor: color,
          pointBorderColor: '#0D1117',
          pointBorderWidth: 2,
          borderWidth: 2.5,
        },
      ],
    }
  }, [filteredPoints, metricConfig])

  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#161B22',
          borderColor: '#30363D',
          borderWidth: 1,
          titleColor: '#E6EDF3',
          bodyColor: '#8B949E',
          padding: 10,
          displayColors: false,
          callbacks: {
            title: (items: any[]) => items[0]?.label || '',
            label: (ctx: any) => {
              const val = ctx.parsed.y
              return ` ${metricConfig.label}: ${val.toFixed(3)} ${metricConfig.unit}`
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
          },
          ticks: {
            color: '#8B949E',
            font: { size: 11 },
            maxTicksLimit: 8,
          },
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
          },
          ticks: {
            color: '#8B949E',
            font: { size: 11 },
          },
        },
      },
    }
  }, [metricConfig])

  return (
    <div className={`card p-5 space-y-5 ${className}`}>
      {/* Header & Synthetic Data Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          {title && <h3 className="text-base font-semibold text-text-primary">{title}</h3>}
          {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
        </div>

        {isSynthetic && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warning/10 border border-warning/30 text-warning text-xs font-medium self-start md:self-center shadow-sm">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate max-w-xs">{dataSourceNote}</span>
          </div>
        )}
      </div>

      {/* Metric Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CORE_METRIC_CONFIGS.map((m) => {
          const Icon = m.icon
          const isSelected = activeMetric === m.key
          return (
            <button
              key={m.key}
              onClick={() => setActiveMetric(m.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap border ${
                isSelected
                  ? 'bg-bg-elevated text-text-primary border-border shadow-sm'
                  : 'text-text-muted hover:text-text-secondary border-transparent hover:bg-bg-elevated/50'
              }`}
              style={{
                borderLeftColor: isSelected ? m.color : undefined,
                borderLeftWidth: isSelected ? '3px' : undefined,
              }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
              <span>{m.label}</span>
            </button>
          )
        })}
      </div>

      {/* Controls Bar: Time Range and Trend Badges */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted">{metricConfig.description}</span>
        </div>

        {/* Time Period Filter Pills */}
        <div className="flex items-center bg-bg-surface p-0.5 rounded-lg border border-border">
          {TIME_PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                period === p
                  ? 'bg-accent-emerald text-white shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full relative">
        {filteredPoints.length > 0 ? (
          <Line data={chartData} options={chartOptions as any} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-text-muted text-xs gap-2">
            <Activity className="w-6 h-6 text-text-muted/40" />
            <span>No observation telemetry found for the selected {period} period.</span>
          </div>
        )}
      </div>

      {/* Statistics Row: Current, Previous, Trend, Min, Max, Avg */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-3 border-t border-border/60 text-xs">
        <div className="p-2.5 rounded-lg bg-bg-elevated/40 border border-border/40">
          <div className="text-text-muted text-[11px]">Current</div>
          <div className="text-sm font-semibold text-text-primary tabular-nums mt-0.5">
            {stats.current !== null ? stats.current.toFixed(3) : '—'}{' '}
            <span className="text-[10px] text-text-muted font-normal">{metricConfig.unit}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-bg-elevated/40 border border-border/40">
          <div className="text-text-muted text-[11px]">Period Change</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {stats.trendDirection === 'up' && (
              <TrendingUp className="w-3.5 h-3.5 text-accent-green" />
            )}
            {stats.trendDirection === 'down' && (
              <TrendingDown className="w-3.5 h-3.5 text-danger" />
            )}
            {stats.trendDirection === 'flat' && <Minus className="w-3.5 h-3.5 text-text-muted" />}
            <span
              className={`text-sm font-semibold tabular-nums ${
                stats.trendDirection === 'up'
                  ? 'text-accent-green'
                  : stats.trendDirection === 'down'
                    ? 'text-danger'
                    : 'text-text-muted'
              }`}
            >
              {stats.changePct !== null
                ? `${stats.changePct > 0 ? '+' : ''}${stats.changePct.toFixed(1)}%`
                : '—'}
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-bg-elevated/40 border border-border/40">
          <div className="text-text-muted text-[11px]">Previous</div>
          <div className="text-sm font-medium text-text-secondary tabular-nums mt-0.5">
            {stats.previous !== null ? stats.previous.toFixed(3) : '—'}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-bg-elevated/40 border border-border/40">
          <div className="text-text-muted text-[11px]">Min</div>
          <div className="text-sm font-medium text-text-secondary tabular-nums mt-0.5">
            {stats.min !== null ? stats.min.toFixed(3) : '—'}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-bg-elevated/40 border border-border/40">
          <div className="text-text-muted text-[11px]">Max</div>
          <div className="text-sm font-medium text-text-secondary tabular-nums mt-0.5">
            {stats.max !== null ? stats.max.toFixed(3) : '—'}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-bg-elevated/40 border border-border/40">
          <div className="text-text-muted text-[11px]">Average</div>
          <div className="text-sm font-medium text-text-secondary tabular-nums mt-0.5">
            {stats.avg !== null ? stats.avg.toFixed(3) : '—'}
          </div>
        </div>
      </div>
    </div>
  )
}

function roundNum(val: number, decimals: number): number {
  return Number(Math.round(Number(val + 'e' + decimals)) + 'e-' + decimals)
}
