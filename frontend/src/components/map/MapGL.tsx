import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { SiteGeoJSONFeature } from '@/types/site'
import type { WildfireAnomaly } from '@/services/satellite'
import { getMapboxToken, getResolvedMapStyle, type MapStyleKey } from '@/config/mapbox'

export interface MapGLHandle {
  flyTo: (coords: [number, number], zoom?: number) => void
  fitBounds: (bounds: [[number, number], [number, number]]) => void
  highlightSite: (siteId: string) => void
}

interface MapGLProps {
  features?: SiteGeoJSONFeature[]
  selectedSiteId?: string | null
  onSiteClick?: (feature: SiteGeoJSONFeature) => void
  onBoundsChange?: (bbox: string) => void
  center?: [number, number]
  zoom?: number
  style?: MapStyleKey
  className?: string
  showLabels?: boolean
  showOutlines?: boolean
  autoFit?: boolean
  // Copernicus Raster Satellite Overlay (Sentinel-2 Optical or Sentinel-1 SAR Radar)
  rasterTileUrl?: string | null
  rasterOpacity?: number
  // Vector Tile Engine (GeoJSON vs PostGIS MVT)
  renderingMode?: 'geojson' | 'mvt'
  mvtSourceUrl?: string | null
  // NASA FIRMS Active Wildfire Thermal Anomalies
  wildfires?: WildfireAnomaly[]
  showWildfires?: boolean
}

function computeGeoJSONBounds(
  features: SiteGeoJSONFeature[],
): [[number, number], [number, number]] | null {
  let minLng = Infinity,
    minLat = Infinity,
    maxLng = -Infinity,
    maxLat = -Infinity
  let count = 0

  const traverse = (coords: any) => {
    if (Array.isArray(coords) && typeof coords[0] === 'number') {
      const [lng, lat] = coords
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
      count++
    } else if (Array.isArray(coords)) {
      coords.forEach(traverse)
    }
  }

  for (const f of features) {
    if (f.geometry?.coordinates) {
      traverse(f.geometry.coordinates)
    }
  }

  if (count === 0 || !isFinite(minLng)) return null
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ]
}

export const MapGL = forwardRef<MapGLHandle, MapGLProps>(
  (
    {
      features = [],
      selectedSiteId = null,
      onSiteClick,
      onBoundsChange,
      center = [78.9629, 20.5937],
      zoom = 5,
      style = 'satellite',
      className = '',
      showLabels = true,
      showOutlines = true,
      autoFit = false,
      rasterTileUrl = null,
      rasterOpacity = 0.85,
      renderingMode = 'geojson',
      mvtSourceUrl = null,
      wildfires = [],
      showWildfires = true,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<mapboxgl.Map | null>(null)
    const popupRef = useRef<mapboxgl.Popup | null>(null)
    const hoveredIdRef = useRef<string | number | null>(null)
    const hasFittedRef = useRef(false)

    const token = getMapboxToken()

    useImperativeHandle(ref, () => ({
      flyTo(coords, z = 12) {
        mapRef.current?.flyTo({ center: coords, zoom: z, duration: 1200, essential: true })
      },
      fitBounds(bounds) {
        mapRef.current?.fitBounds(bounds, { padding: 60, duration: 1000, maxZoom: 15 })
      },
      highlightSite(siteId: string) {
        if (!mapRef.current || !mapRef.current.isStyleLoaded()) return
        const sourceName = renderingMode === 'mvt' && mvtSourceUrl ? 'sites-mvt' : 'sites'
        const source = mapRef.current.getSource(sourceName)
        if (!source) return
        mapRef.current.setFeatureState(
          {
            source: sourceName,
            sourceLayer: renderingMode === 'mvt' ? 'sites' : undefined,
            id: siteId,
          },
          { selected: true },
        )
      },
    }))

    // Helper to safely bind layers and sources to current style
    const setupLayers = useCallback(
      (map: mapboxgl.Map, feats: SiteGeoJSONFeature[], fires: WildfireAnomaly[]) => {
        if (!map.isStyleLoaded()) return

        // 1. Sentinel Raster Layer (Copernicus STAC pipeline: S2 Optical or S1 SAR Radar)
        if (rasterTileUrl) {
          if (map.getSource('sentinel-raster')) {
            if (map.getLayer('sentinel-raster-layer')) {
              map.removeLayer('sentinel-raster-layer')
            }
            map.removeSource('sentinel-raster')
          }
          map.addSource('sentinel-raster', {
            type: 'raster',
            tiles: [rasterTileUrl],
            tileSize: 256,
          })
          map.addLayer({
            id: 'sentinel-raster-layer',
            type: 'raster',
            source: 'sentinel-raster',
            paint: {
              'raster-opacity': rasterOpacity,
              'raster-fade-duration': 300,
            },
          })
        } else {
          if (map.getLayer('sentinel-raster-layer')) {
            map.removeLayer('sentinel-raster-layer')
          }
          if (map.getSource('sentinel-raster')) {
            map.removeSource('sentinel-raster')
          }
        }

        // Clean up existing vector layers before recreating with chosen source
        if (map.getLayer('sites-labels')) map.removeLayer('sites-labels')
        if (map.getLayer('sites-outline')) map.removeLayer('sites-outline')
        if (map.getLayer('sites-fill')) map.removeLayer('sites-fill')

        const isMVT = renderingMode === 'mvt' && !!mvtSourceUrl
        const activeSource = isMVT ? 'sites-mvt' : 'sites'
        const sourceLayerProp = isMVT ? { 'source-layer': 'sites' } : {}

        if (isMVT) {
          if (!map.getSource('sites-mvt')) {
            map.addSource('sites-mvt', {
              type: 'vector',
              tiles: [mvtSourceUrl],
              minzoom: 0,
              maxzoom: 20,
            })
          }
        } else {
          if (!map.getSource('sites')) {
            map.addSource('sites', {
              type: 'geojson',
              promoteId: 'id',
              data: {
                type: 'FeatureCollection',
                features: feats as any,
              },
            })
          } else {
            const s = map.getSource('sites') as mapboxgl.GeoJSONSource
            s.setData({
              type: 'FeatureCollection',
              features: feats as any,
            })
          }
        }

        // 2. Sites Fill Layer
        map.addLayer({
          id: 'sites-fill',
          type: 'fill',
          source: activeSource,
          ...sourceLayerProp,
          paint: {
            'fill-color': [
              'case',
              ['==', ['get', 'status'], 'ACTIVE'],
              'rgba(63, 185, 80, 0.25)',
              ['==', ['get', 'status'], 'UNDER_REVIEW'],
              'rgba(210, 153, 34, 0.25)',
              'rgba(140, 148, 158, 0.18)',
            ],
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.65,
              ['boolean', ['feature-state', 'selected'], false],
              0.5,
              0.3,
            ],
          },
        })

        // 3. Sites Outline Layer
        map.addLayer({
          id: 'sites-outline',
          type: 'line',
          source: activeSource,
          ...sourceLayerProp,
          layout: {
            visibility: showOutlines ? 'visible' : 'none',
          },
          paint: {
            'line-color': [
              'case',
              ['==', ['get', 'status'], 'ACTIVE'],
              '#3FB950',
              ['==', ['get', 'status'], 'UNDER_REVIEW'],
              '#D29922',
              '#8B949E',
            ],
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              3.2,
              ['boolean', ['feature-state', 'hover'], false],
              2.4,
              1.6,
            ],
            'line-opacity': 0.95,
          },
        })

        // 4. Sites Label Layer (Symbol)
        map.addLayer({
          id: 'sites-labels',
          type: 'symbol',
          source: activeSource,
          ...sourceLayerProp,
          minzoom: 6,
          layout: {
            visibility: showLabels ? 'visible' : 'none',
            'text-field': ['get', 'name'],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'text-offset': [0, 0.6],
            'text-anchor': 'top',
          },
          paint: {
            'text-color': '#F0F6FC',
            'text-halo-color': '#0D1117',
            'text-halo-width': 1.5,
          },
        })

        // 5. NASA FIRMS Active Wildfire Anomalies Layer
        const fireFeatures = fires.map((f, idx) => ({
          type: 'Feature' as const,
          id: idx,
          geometry: {
            type: 'Point' as const,
            coordinates: [f.longitude, f.latitude],
          },
          properties: { ...f },
        }))

        if (map.getLayer('wildfires-glow')) map.removeLayer('wildfires-glow')
        if (map.getLayer('wildfires-point')) map.removeLayer('wildfires-point')

        if (map.getSource('wildfires')) {
          const ws = map.getSource('wildfires') as mapboxgl.GeoJSONSource
          ws.setData({
            type: 'FeatureCollection',
            features: fireFeatures as any,
          })
        } else {
          map.addSource('wildfires', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: fireFeatures as any,
            },
          })
        }

        if (showWildfires && fires.length > 0) {
          // Glow Halo
          map.addLayer({
            id: 'wildfires-glow',
            type: 'circle',
            source: 'wildfires',
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 10, 12, 24],
              'circle-color': '#FF3B30',
              'circle-opacity': 0.35,
              'circle-blur': 0.8,
            },
          })

          // Core Hotspot Point
          map.addLayer({
            id: 'wildfires-point',
            type: 'circle',
            source: 'wildfires',
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 4, 12, 8],
              'circle-color': [
                'case',
                ['==', ['get', 'threat_level'], 'CRITICAL_INSIDE_RESERVE'],
                '#FF0033',
                ['==', ['get', 'threat_level'], 'HIGH_PROXIMITY'],
                '#FF4500',
                '#FF9500',
              ],
              'circle-stroke-color': '#FFFFFF',
              'circle-stroke-width': 1.5,
              'circle-opacity': 0.95,
            },
          })
        }
      },
      [
        rasterTileUrl,
        rasterOpacity,
        renderingMode,
        mvtSourceUrl,
        showLabels,
        showOutlines,
        showWildfires,
      ],
    )

    // Map initialization
    useEffect(() => {
      if (!containerRef.current || mapRef.current) return

      if (token) {
        mapboxgl.accessToken = token
      }

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: getResolvedMapStyle(style),
        center,
        zoom,
        attributionControl: false,
      })

      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right')
      map.addControl(new mapboxgl.FullscreenControl(), 'top-right')
      map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
        }),
        'top-right',
      )
      map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left')

      map.on('load', () => {
        setupLayers(map, features, wildfires)
      })

      // Hover interaction on sites
      map.on('mousemove', 'sites-fill', (e) => {
        if (!e.features?.length) return
        map.getCanvas().style.cursor = 'pointer'
        const feat = e.features[0]
        const currentId = feat.id ?? feat.properties?.id
        const isMVT = renderingMode === 'mvt' && !!mvtSourceUrl
        const sourceName = isMVT ? 'sites-mvt' : 'sites'
        const sourceLayer = isMVT ? 'sites' : undefined

        if (hoveredIdRef.current !== null && hoveredIdRef.current !== currentId) {
          map.setFeatureState(
            { source: sourceName, sourceLayer, id: hoveredIdRef.current },
            { hover: false },
          )
        }
        if (currentId) {
          hoveredIdRef.current = currentId
          map.setFeatureState({ source: sourceName, sourceLayer, id: currentId }, { hover: true })
        }
      })

      map.on('mouseleave', 'sites-fill', () => {
        map.getCanvas().style.cursor = ''
        if (hoveredIdRef.current !== null) {
          const isMVT = renderingMode === 'mvt' && !!mvtSourceUrl
          const sourceName = isMVT ? 'sites-mvt' : 'sites'
          const sourceLayer = isMVT ? 'sites' : undefined
          map.setFeatureState(
            { source: sourceName, sourceLayer, id: hoveredIdRef.current },
            { hover: false },
          )
          hoveredIdRef.current = null
        }
      })

      // Click interaction on Wildfire Points
      map.on('click', 'wildfires-point', (e) => {
        if (!e.features?.length) return
        const props = e.features[0].properties as any
        const coords = e.lngLat

        if (popupRef.current) popupRef.current.remove()
        const popup = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: '300px',
          className: 'darukaa-map-popup',
        })
          .setLngLat(coords)
          .setHTML(
            `
            <div style="font-family:Inter,system-ui,sans-serif;padding:6px 4px">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
                <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;background:rgba(255,59,48,0.15);color:#FF3B30;border:1px solid rgba(255,59,48,0.4)">
                  🔥 NASA FIRMS ACTIVE FIRE
                </span>
                <span style="font-size:11px;color:#8B949E">
                  ${coords.lng.toFixed(3)}°E, ${coords.lat.toFixed(3)}°N
                </span>
              </div>
              <h4 style="font-weight:600;font-size:13px;color:#E6EDF3;margin:0 0 4px 0">
                Fire Radiative Power: <span style="color:#FF9500">${props.frp_mw || '—'} MW</span>
              </h4>
              <p style="font-size:11px;color:#8B949E;margin:0 0 4px 0">
                Brightness: <strong style="color:#F0F6FC">${props.brightness_kelvin || '—'} K</strong> · Satellite: <strong style="color:#F0F6FC">${props.sensor || 'VIIRS'}</strong>
              </p>
              <p style="font-size:11px;color:#8B949E;margin:0 0 4px 0">
                Acquired: <strong style="color:#F0F6FC">${props.acquisition_date || ''} ${props.acquisition_time || ''} UTC</strong>
              </p>
              ${
                props.distance_km !== undefined
                  ? `
              <div style="padding-top:4px;border-top:1px solid rgba(255,255,255,0.1);font-size:11px;color:#FF4500;font-weight:600">
                ${props.distance_km === 0 ? '⚠️ INSIDE CONSERVATION BOUNDARY' : `Proximity: ${props.distance_km} km to reserve perimeter`}
              </div>`
                  : ''
              }
            </div>
          `,
          )
          .addTo(map)
        popupRef.current = popup
      })

      // Click interaction on Sites
      map.on('click', 'sites-fill', (e) => {
        if (!e.features?.length) return
        const feat = e.features[0] as unknown as SiteGeoJSONFeature
        onSiteClick?.(feat)

        const featId = feat.id ?? (feat.properties as any)?.id
        const isMVT = renderingMode === 'mvt' && !!mvtSourceUrl
        const sourceName = isMVT ? 'sites-mvt' : 'sites'
        const sourceLayer = isMVT ? 'sites' : undefined
        if (featId) {
          map.setFeatureState({ source: sourceName, sourceLayer, id: featId }, { selected: true })
        }

        if (popupRef.current) popupRef.current.remove()
        const coords = e.lngLat
        const status = (feat.properties as any)?.status || 'ACTIVE'
        const statusColor =
          status === 'ACTIVE' ? '#3FB950' : status === 'UNDER_REVIEW' ? '#D29922' : '#8B949E'

        const areaHa = (feat.properties as any)?.area_hectares
        const name = (feat.properties as any)?.name || 'Conservation Area'
        const projId = (feat.properties as any)?.project_id || ''

        const popup = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: '320px',
          className: 'darukaa-map-popup',
        })
          .setLngLat(coords)
          .setHTML(
            `
            <div style="font-family:Inter,system-ui,sans-serif;padding:6px 4px">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
                <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;background:rgba(255,255,255,0.06);color:${statusColor};border:1px solid ${statusColor}44">
                  ${status}
                </span>
                <span style="font-size:11px;color:#8B949E">
                  ${coords.lng.toFixed(3)}°E, ${coords.lat.toFixed(3)}°N
                </span>
              </div>
              <h4 style="font-weight:600;font-size:14px;color:#E6EDF3;margin:0 0 4px 0">${name}</h4>
              <p style="font-size:12px;color:#8B949E;margin:0 0 8px 0">
                Calculated Area: <strong style="color:#F0F6FC">${areaHa ? Number(areaHa).toFixed(2) + ' ha' : '—'}</strong>
              </p>
              ${
                projId
                  ? `
              <div style="padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);display:flex;justify-content:flex-end">
                <a href="/app/projects/${projId}/sites/${featId}" style="font-size:12px;font-weight:600;color:#3FB950;text-decoration:none;display:inline-flex;align-items:center;gap:4px">
                  Inspect Site Details &rarr;
                </a>
              </div>`
                  : ''
              }
            </div>
          `,
          )
          .addTo(map)
        popupRef.current = popup
      })

      // Viewport bounds reporting on moveend
      const reportBounds = () => {
        const b = map.getBounds()
        if (!b) return
        const bbox = `${b.getWest().toFixed(5)},${b.getSouth().toFixed(5)},${b.getEast().toFixed(5)},${b.getNorth().toFixed(5)}`
        onBoundsChange?.(bbox)
      }
      map.on('moveend', reportBounds)

      mapRef.current = map
      return () => {
        if (popupRef.current) popupRef.current.remove()
        map.remove()
        mapRef.current = null
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // React to Style changes (Satellite / Street / Terrain)
    useEffect(() => {
      const map = mapRef.current
      if (!map) return
      const targetStyle = getResolvedMapStyle(style)

      const onStyleReload = () => {
        setupLayers(map, features, wildfires)
      }
      map.once('style.load', onStyleReload)
      map.setStyle(targetStyle)
    }, [style, setupLayers, features, wildfires])

    // Update layers and source data when features or props change
    useEffect(() => {
      const map = mapRef.current
      if (!map || !map.isStyleLoaded()) return
      setupLayers(map, features, wildfires)

      if (autoFit && features.length > 0 && !hasFittedRef.current) {
        const bounds = computeGeoJSONBounds(features)
        if (bounds) {
          map.fitBounds(bounds, { padding: 40, maxZoom: 14, duration: 800 })
          hasFittedRef.current = true
        }
      }
    }, [
      features,
      wildfires,
      setupLayers,
      autoFit,
      renderingMode,
      mvtSourceUrl,
      rasterTileUrl,
      rasterOpacity,
      showWildfires,
    ])

    // Update selection state
    useEffect(() => {
      const map = mapRef.current
      if (!map || !map.isStyleLoaded()) return
      const isMVT = renderingMode === 'mvt' && !!mvtSourceUrl
      const sourceName = isMVT ? 'sites-mvt' : 'sites'
      const sourceLayer = isMVT ? 'sites' : undefined

      features.forEach((f) => {
        const fid = f.id ?? (f.properties as any)?.id
        if (fid) {
          map.setFeatureState(
            { source: sourceName, sourceLayer, id: fid },
            { selected: fid === selectedSiteId },
          )
        }
      })
    }, [selectedSiteId, features, renderingMode, mvtSourceUrl])

    return (
      <div className={`relative w-full h-full rounded-lg overflow-hidden ${className}`}>
        <div ref={containerRef} className="w-full h-full" />
      </div>
    )
  },
)

MapGL.displayName = 'MapGL'
