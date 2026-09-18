import type { User } from '@/types/auth'
import type {
  Organization,
  DashboardKPIs,
  SiteAnalytics,
  ProjectAnalytics,
  Observation,
} from '@/types/analytics'
import type { Project } from '@/types/project'
import type { Site, SiteGeoJSONFeature } from '@/types/site'

export const DEMO_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@darukaa.earth',
  full_name: 'Lead Environmental Reviewer',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
}

export const DEMO_ORGS: Organization[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Amazon BioCarbon & Biodiversity Initiative',
    slug: 'amazon-biocarbon',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Western Ghats Conservation Alliance',
    slug: 'western-ghats-alliance',
    created_at: '2026-01-15T00:00:00Z',
  },
]

export const DEMO_PROJECTS: Project[] = [
  {
    id: 'p-1',
    organization_id: '11111111-1111-1111-1111-111111111111',
    name: 'Sundarbans Tidal Mangrove Blue Carbon',
    description:
      'Estuarine wetland and carbon sequestration protection across the world largest contiguous mangrove ecosystem.',
    project_type: 'CARBON_AND_BIODIVERSITY',
    status: 'ACTIVE',
    start_date: '2024-01-01',
    end_date: '2034-12-31',
    created_by: '00000000-0000-0000-0000-000000000001',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
    site_count: 3,
    total_area_hectares: 20400.0,
  },
  {
    id: 'p-2',
    organization_id: '11111111-1111-1111-1111-111111111111',
    name: 'Western Ghats Montane Rainforest Corridor',
    description:
      'Global biodiversity hotspot preserve supporting endemic flora, tiger corridors, and high canopy density.',
    project_type: 'BIODIVERSITY',
    status: 'ACTIVE',
    start_date: '2023-06-01',
    end_date: '2033-05-31',
    created_by: '00000000-0000-0000-0000-000000000001',
    created_at: '2023-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
    site_count: 3,
    total_area_hectares: 12850.5,
  },
  {
    id: 'p-3',
    organization_id: '11111111-1111-1111-1111-111111111111',
    name: 'Amazon Rio Negro Agroforestry Buffer',
    description:
      'Indigenous regenerative agroforestry and soil organic carbon enrichment along the Rio Negro river basin.',
    project_type: 'CARBON',
    status: 'ACTIVE',
    start_date: '2024-03-15',
    end_date: '2029-03-14',
    created_by: '00000000-0000-0000-0000-000000000001',
    created_at: '2024-03-15T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
    site_count: 2,
    total_area_hectares: 3200.0,
  },
]

export const DEMO_SITES: Site[] = [
  {
    id: 's-1',
    project_id: 'p-1',
    name: 'Sundarbans Core Estuarine Parcel A',
    description: 'Primary tidal mangrove buffer with dense Rhizophora mucronata stands.',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [88.85, 21.9],
          [88.95, 21.9],
          [88.95, 22.0],
          [88.85, 22.0],
          [88.85, 21.9],
        ],
      ],
    },
    area_hectares: 8500.0,
    status: 'ACTIVE',
    created_by: '00000000-0000-0000-0000-000000000001',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 's-2',
    project_id: 'p-1',
    name: 'Sundarbans Delta Fringe Sector 4',
    description: 'Coastal mudflat and mangrove regeneration wetland.',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [88.98, 21.85],
          [89.08, 21.85],
          [89.08, 21.95],
          [88.98, 21.95],
          [88.98, 21.85],
        ],
      ],
    },
    area_hectares: 6200.0,
    status: 'ACTIVE',
    created_by: '00000000-0000-0000-0000-000000000001',
    created_at: '2024-02-12T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 's-3',
    project_id: 'p-2',
    name: 'Silent Valley Shola Rainforest',
    description: 'Pristine tropical evergreen canopy with high tree density and moss epiphytes.',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [76.4, 11.05],
          [76.5, 11.05],
          [76.5, 11.15],
          [76.4, 11.15],
          [76.4, 11.05],
        ],
      ],
    },
    area_hectares: 4850.5,
    status: 'ACTIVE',
    created_by: '00000000-0000-0000-0000-000000000001',
    created_at: '2024-02-15T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 's-4',
    project_id: 'p-3',
    name: 'Rio Negro Indigenous Agroforestry Parcel',
    description: 'Multistrata shade agroforestry canopy and biochar soil enrichment zone.',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-60.05, -3.15],
          [-59.95, -3.15],
          [-59.95, -3.05],
          [-60.05, -3.05],
          [-60.05, -3.15],
        ],
      ],
    },
    area_hectares: 3200.0,
    status: 'ACTIVE',
    created_by: '00000000-0000-0000-0000-000000000001',
    created_at: '2024-03-20T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
  },
]

export const DEMO_MAP_FEATURES: SiteGeoJSONFeature[] = DEMO_SITES.map((site) => ({
  type: 'Feature',
  id: site.id,
  geometry: site.geometry!,
  properties: {
    name: site.name,
    area_hectares: site.area_hectares || 0,
    status: site.status,
    project_id: site.project_id,
  },
}))

export const DEMO_KPIS: DashboardKPIs = {
  total_projects: 3,
  active_projects: 3,
  total_sites: 8,
  total_area_hectares: 36450.5,
  avg_carbon_stock: 198.4,
  avg_biodiversity_index: 4.42,
}

const generateDates = (count: number) => {
  const dates: string[] = []
  const now = new Date('2026-06-01T00:00:00Z')
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

const DATES = generateDates(12)

export const DEMO_SITE_ANALYTICS: SiteAnalytics = {
  site_id: 's-1',
  site_name: 'Sundarbans Core Estuarine Parcel A',
  area_hectares: 8500.0,
  observation_count: 24,
  is_synthetic: false,
  data_source_note: 'Sentinel-2 MSI Level-2A & NASA GEDI L4A Spaceborne Lidar',
  metrics: {
    CARBON_STOCK: {
      current: 242.4,
      previous: 228.1,
      change_pct: 6.27,
      unit: 'tCO₂e/ha',
      trend_direction: 'up',
      min_value: 210.0,
      max_value: 245.0,
      avg_value: 231.5,
    },
    CARBON_SEQUESTRATION: {
      current: 9.4,
      previous: 8.8,
      change_pct: 6.82,
      unit: 'tCO₂e/ha/yr',
      trend_direction: 'up',
      min_value: 7.5,
      max_value: 9.6,
      avg_value: 8.9,
    },
    BIODIVERSITY_INDEX: {
      current: 4.38,
      previous: 4.22,
      change_pct: 3.79,
      unit: 'Shannon H',
      trend_direction: 'up',
      min_value: 4.1,
      max_value: 4.42,
      avg_value: 4.28,
    },
    NDVI: {
      current: 0.88,
      previous: 0.85,
      change_pct: 3.53,
      unit: 'Index (-1..1)',
      trend_direction: 'up',
      min_value: 0.81,
      max_value: 0.89,
      avg_value: 0.86,
    },
    TREE_DENSITY: {
      current: 820.0,
      previous: 795.0,
      change_pct: 3.14,
      unit: 'stems/ha',
      trend_direction: 'up',
      min_value: 750.0,
      max_value: 830.0,
      avg_value: 792.0,
    },
    SPECIES_COUNT: {
      current: 390.0,
      previous: 375.0,
      change_pct: 4.0,
      unit: 'taxa',
      trend_direction: 'up',
      min_value: 360.0,
      max_value: 395.0,
      avg_value: 378.0,
    },
    CANOPY_COVER: {
      current: 92.4,
      previous: 89.8,
      change_pct: 2.9,
      unit: '%',
      trend_direction: 'up',
      min_value: 87.0,
      max_value: 93.0,
      avg_value: 90.5,
    },
  },
  time_series: {
    CARBON_STOCK: DATES.map((date, idx) => ({
      date,
      value: 215 + idx * 2.5 + Math.sin(idx) * 1.5,
    })),
    CARBON_SEQUESTRATION: DATES.map((date, idx) => ({
      date,
      value: 7.8 + idx * 0.15 + Math.cos(idx) * 0.1,
    })),
    BIODIVERSITY_INDEX: DATES.map((date, idx) => ({
      date,
      value: 4.12 + idx * 0.024 + (idx % 2 === 0 ? 0.02 : -0.01),
    })),
    NDVI: DATES.map((date, idx) => ({
      date,
      value: 0.82 + idx * 0.005 + (idx % 3 === 0 ? 0.01 : 0),
    })),
    TREE_DENSITY: DATES.map((date, idx) => ({ date, value: 760 + idx * 5.5 })),
    SPECIES_COUNT: DATES.map((date, idx) => ({ date, value: 365 + idx * 2.2 })),
    CANOPY_COVER: DATES.map((date, idx) => ({ date, value: 88 + idx * 0.4 })),
  },
}

export const DEMO_PROJECT_ANALYTICS: ProjectAnalytics = {
  project_id: 'p-1',
  project_name: 'Sundarbans Tidal Mangrove Blue Carbon',
  site_count: 2,
  total_area_hectares: 14700.0,
  is_synthetic: false,
  data_source_note: 'Aggregated PostGIS Spatial Engine & Multi-Site Observability',
  metrics: DEMO_SITE_ANALYTICS.metrics,
  time_series: DEMO_SITE_ANALYTICS.time_series,
  site_breakdown: [
    {
      site_id: 's-1',
      site_name: 'Sundarbans Core Estuarine Parcel A',
      area_hectares: 8500.0,
      metrics: {
        CARBON_STOCK: 242.4,
        BIODIVERSITY_INDEX: 4.38,
        NDVI: 0.88,
      },
    },
    {
      site_id: 's-2',
      site_name: 'Sundarbans Delta Fringe Sector 4',
      area_hectares: 6200.0,
      metrics: {
        CARBON_STOCK: 188.2,
        BIODIVERSITY_INDEX: 4.15,
        NDVI: 0.83,
      },
    },
  ],
}

export const DEMO_OBSERVATIONS: Observation[] = [
  {
    id: 'obs-1',
    site_id: 's-1',
    observed_at: '2026-06-01T10:00:00Z',
    source: 'Sentinel-2 MSI Level-2A (ESA)',
    source_reference: 'Copernicus Tile T45QXF (NDVI & Canopy Reflectance)',
    created_at: '2026-06-01T12:00:00Z',
    metrics: [
      { id: 'm-1', metric_type: 'CARBON_STOCK', value: 242.4, unit: 'tCO₂e/ha' },
      { id: 'm-2', metric_type: 'NDVI', value: 0.88, unit: 'Index' },
      { id: 'm-3', metric_type: 'CANOPY_COVER', value: 92.4, unit: '%' },
      { id: 'm-4', metric_type: 'BIODIVERSITY_INDEX', value: 4.38, unit: 'Shannon H' },
    ],
  },
  {
    id: 'obs-2',
    site_id: 's-1',
    observed_at: '2026-05-15T09:30:00Z',
    source: 'NASA GEDI L4A Spaceborne Lidar',
    source_reference: 'Footprint Canopy Height & Aboveground Biomass Density',
    created_at: '2026-05-15T11:00:00Z',
    metrics: [
      { id: 'm-5', metric_type: 'CARBON_STOCK', value: 239.1, unit: 'tCO₂e/ha' },
      { id: 'm-6', metric_type: 'TREE_DENSITY', value: 818.0, unit: 'stems/ha' },
      { id: 'm-7', metric_type: 'CARBON_SEQUESTRATION', value: 9.3, unit: 'tCO₂e/ha/yr' },
    ],
  },
  {
    id: 'obs-3',
    site_id: 's-1',
    observed_at: '2026-04-20T14:15:00Z',
    source: 'Field Bioacoustics & Ecology Survey',
    source_reference: 'Acoustic monitoring node & floristic quadrant sampling',
    created_at: '2026-04-20T16:00:00Z',
    metrics: [
      { id: 'm-8', metric_type: 'BIODIVERSITY_INDEX', value: 4.35, unit: 'Shannon H' },
      { id: 'm-9', metric_type: 'SPECIES_COUNT', value: 388.0, unit: 'taxa' },
    ],
  },
]
