import { describe, it, expect } from 'vitest'
import { CORE_METRIC_CONFIGS, TIME_PERIODS } from '@/components/analytics/AnalyticsChart'
import { statusBadgeVariant } from '@/components/ui/Badge'
import { getMapboxToken, MAP_STYLES } from '@/config/mapbox'

describe('Environmental Metrics & Configurations', () => {
  it('supports all 7 core environmental metrics', () => {
    const keys = CORE_METRIC_CONFIGS.map((m) => m.key)
    expect(keys).toContain('CARBON_STOCK')
    expect(keys).toContain('CARBON_SEQUESTRATION')
    expect(keys).toContain('BIODIVERSITY_INDEX')
    expect(keys).toContain('NDVI')
    expect(keys).toContain('TREE_DENSITY')
    expect(keys).toContain('SPECIES_COUNT')
    expect(keys).toContain('CANOPY_COVER')
    expect(CORE_METRIC_CONFIGS.length).toBe(7)
  })

  it('defines valid units and colors for each metric', () => {
    CORE_METRIC_CONFIGS.forEach((m) => {
      expect(m.unit).toBeDefined()
      expect(m.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(m.label).toBeTruthy()
      expect(m.description).toBeTruthy()
    })
  })

  it('includes standard historical time periods', () => {
    expect(TIME_PERIODS).toEqual(['30D', '3M', '6M', '1Y', 'ALL'])
  })
})

describe('Mapbox Configuration', () => {
  it('defines valid map style URIs', () => {
    expect(MAP_STYLES.standard).toContain('mapbox://styles/mapbox/dark-v11')
    expect(MAP_STYLES.satellite).toContain('mapbox://styles/mapbox/satellite-streets-v12')
    expect(MAP_STYLES.terrain).toContain('mapbox://styles/mapbox/outdoors-v12')
  })

  it('safely resolves token without crashing', () => {
    const token = getMapboxToken()
    expect(typeof token).toBe('string')
  })
})

describe('UI Badge Variants', () => {
  it('maps status codes to appropriate badge variants', () => {
    expect(statusBadgeVariant('ACTIVE')).toBe('success')
    expect(statusBadgeVariant('UNDER_REVIEW')).toBe('info')
    expect(statusBadgeVariant('INACTIVE')).toBe('warning')
    expect(statusBadgeVariant('DRAFT')).toBe('default')
  })
})
