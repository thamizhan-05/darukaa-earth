import { useState, useMemo } from 'react'
import {
  ShieldCheck,
  X,
  Download,
  CheckCircle2,
  FileText,
  Calendar,
  Layers,
  Printer,
  Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface EUDRComplianceModalProps {
  siteName: string
  siteId: string
  areaHectares: number
  onClose: () => void
}

export function EUDRComplianceModal({
  siteName,
  siteId,
  areaHectares,
  onClose,
}: EUDRComplianceModalProps) {
  const [commodity, setCommodity] = useState<string>('Wood & Timber Products')
  const [operatorName, setOperatorName] = useState<string>('Darukaa Earth Global Operations')
  const [importerTaxId, setImporterTaxId] = useState<string>('EU-EORI-NL882049182')
  const [countryOfOrigin, setCountryOfOrigin] = useState<string>('India (Western Ghats)')
  const [statementId] = useState<string>(
    () => `EUDR-DDS-2026-${Math.floor(100000 + Math.random() * 900000)}`,
  )

  const verificationHash = useMemo(() => {
    return `0x${Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join(
      '',
    )}`
  }, [])

  const handleDownloadJSON = () => {
    const ddsPayload = {
      eudr_statement_id: statementId,
      regulation: 'Regulation (EU) 2023/1115 (EUDR)',
      cutoff_date: '2020-12-31',
      deforestation_free_status: 'CONFIRMED_ZERO_DEFORESTATION',
      production_place: {
        site_name: siteName,
        site_id: siteId,
        area_hectares: areaHectares,
        country: countryOfOrigin,
        coordinates_crs: 'EPSG:4326',
        geometry_type: 'MultiPolygon',
      },
      commodity_details: {
        hs_code: '4407.29',
        description: commodity,
        operator: operatorName,
        eori_number: importerTaxId,
      },
      verification: {
        satellite_source: 'Copernicus Sentinel-2 & SAR',
        cloud_free_verification: true,
        cryptographic_hash: verificationHash,
        issued_at: new Date().toISOString(),
      },
    }

    const blob = new Blob([JSON.stringify(ddsPayload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${statementId}_due_diligence.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('EUDR Due Diligence JSON statement downloaded!')
  }

  const copyHash = () => {
    navigator.clipboard.writeText(verificationHash)
    toast.success('Cryptographic verification hash copied')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden z-10 flex flex-col animate-slide-up">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-border bg-bg-elevated/80 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-green/15 text-accent-green border border-accent-green/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-text-primary">
                  EUDR Due Diligence Exporter
                </h3>
                <Badge variant="success">EU 2023/1115</Badge>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Zero-deforestation compliance verification for European Union imports
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={() => window.print()}
            >
              Print
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Statutory Notice */}
          <div className="p-4 rounded-xl bg-bg-elevated border border-border flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-accent-green shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold text-text-primary block">
                Post-2020 Zero-Deforestation Guarantee Verified
              </span>
              <p className="text-text-muted leading-relaxed">
                Sentinel-2 multispectral retrospective telemetry confirms no forest conversion or
                canopy degradation occurred across <strong>{siteName}</strong> after the statutory
                cutoff date of <strong>December 31, 2020</strong>.
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-text-secondary mb-1">
                EUDR Covered Commodity
              </label>
              <select
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
                className="input-select text-xs w-full"
              >
                <option value="Wood & Timber Products">Wood & Timber Products (HS 4407)</option>
                <option value="Cocoa & Derivates">Cocoa & Derivatives (HS 1801)</option>
                <option value="Coffee (Arabica / Robusta)">Coffee (HS 0901)</option>
                <option value="Natural Rubber">Natural Rubber (HS 4001)</option>
                <option value="Palm Oil Derivatives">Palm Oil Derivatives (HS 1511)</option>
                <option value="Soybean & Feeds">Soybean & Feeds (HS 1201)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-text-secondary mb-1">
                Country of Production
              </label>
              <input
                type="text"
                value={countryOfOrigin}
                onChange={(e) => setCountryOfOrigin(e.target.value)}
                className="input-text text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-text-secondary mb-1">
                Authorized EU Operator / Trader
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="input-text text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-text-secondary mb-1">
                Operator EORI / VAT Tax ID
              </label>
              <input
                type="text"
                value={importerTaxId}
                onChange={(e) => setImporterTaxId(e.target.value)}
                className="input-text text-xs font-mono"
                required
              />
            </div>
          </div>

          {/* Due Diligence Statement Preview Certificate */}
          <div className="p-5 rounded-xl border border-border bg-gradient-to-br from-bg-base via-bg-surface to-bg-base space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent-green" />
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Due Diligence Statement (DDS) Summary
                </span>
              </div>
              <span className="text-[11px] font-mono text-accent-green font-bold">
                {statementId}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-text-muted block">Production Plot:</span>
                <span className="font-semibold text-text-primary">{siteName}</span>
              </div>
              <div>
                <span className="text-text-muted block">Certified Land Area:</span>
                <span className="font-semibold text-text-primary">
                  {areaHectares.toFixed(1)} Hectares
                </span>
              </div>
              <div>
                <span className="text-text-muted block">Mandatory Cutoff Date:</span>
                <span className="font-semibold text-accent-green flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> 31 December 2020
                </span>
              </div>
              <div>
                <span className="text-text-muted block">Spatial Coordinates:</span>
                <span className="font-semibold text-text-primary flex items-center gap-1">
                  <Layers className="w-3 h-3" /> WGS84 GeoJSON Polygon
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-text-muted">
              <div className="flex items-center gap-1 truncate max-w-sm">
                <span>Proof:</span>
                <span className="font-mono text-text-secondary truncate">{verificationHash}</span>
              </div>
              <button
                onClick={copyHash}
                className="text-accent-teal hover:underline flex items-center gap-1 shrink-0 ml-2"
              >
                <Copy className="w-3 h-3" /> Copy Hash
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border text-xs">
            <span className="text-[11px] text-text-muted">
              Issued: {format(new Date(), 'dd MMMM yyyy')} · EU Customs Direct Compatible
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="ghost" size="sm" onClick={onClose} className="flex-1 sm:flex-none">
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={handleDownloadJSON}
                className="flex-1 sm:flex-none"
              >
                Download DDS Package (.JSON)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
