import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { authService } from '@/services/auth'
import { databaseService, type QueryResult } from '@/services/database'
import {
  ShieldCheck,
  Building,
  User as UserIcon,
  Satellite,
  Database,
  History,
  Terminal,
  Play,
  Copy,
  CheckCircle2,
  Table as TableIcon,
  HardDrive,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'

export default function SettingsPage() {
  const { user, activeOrg } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'database' | 'audit' | 'integrations'>(
    'profile',
  )

  // Audit Logs query
  const { data: auditLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['audit-logs', activeOrg?.id],
    queryFn: () => authService.getAuditLogs(activeOrg!.id),
    enabled: !!activeOrg && activeTab === 'audit',
  })

  // Database Overview query
  const { data: dbOverview, refetch: refetchDb } = useQuery({
    queryKey: ['database-overview'],
    queryFn: () => databaseService.getOverview(),
    enabled: activeTab === 'database',
  })

  // Selected Table for browsing
  const [selectedTable, setSelectedTable] = useState<string>('users')
  const {
    data: tableData,
    isLoading: loadingTableData,
    refetch: refetchTableData,
  } = useQuery({
    queryKey: ['database-table-data', selectedTable],
    queryFn: () => databaseService.getTableData(selectedTable, 0, 50),
    enabled: activeTab === 'database' && !!selectedTable,
  })

  // SQL Console state
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM users LIMIT 10;')
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)

  const queryMutation = useMutation({
    mutationFn: (query: string) => databaseService.executeQuery(query),
    onSuccess: (data) => {
      setQueryResult(data)
      toast.success(`Query executed in ${data.execution_time_ms}ms`)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Query execution failed')
    },
  })

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  return (
    <AppShell>
      <TopBar title="Settings & Administration" subtitle={activeOrg?.name} />

      <div className="flex-1 p-6 space-y-6 max-w-6xl animate-fade-in">
        {/* Navigation Tabs */}
        <div className="flex gap-1 border-b border-border overflow-x-auto">
          {(
            [
              { key: 'profile', label: 'Organization & Profile', icon: Building },
              { key: 'database', label: 'Database Explorer & SQL Console', icon: Database },
              { key: 'audit', label: 'System Audit Log', icon: History },
              { key: 'integrations', label: 'Data Providers & GIS', icon: Satellite },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 -mb-px transition-colors whitespace-nowrap ${
                activeTab === key
                  ? 'border-accent-green text-accent-green'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: Profile ────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* Account Card */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-border pb-3">
                <UserIcon className="w-4 h-4 text-accent-green" />
                <h3 className="text-text-primary font-semibold text-sm">Account Credentials</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-border-muted">
                  <span className="text-text-muted">Full Name</span>
                  <span className="text-text-primary font-medium">{user?.full_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-muted">
                  <span className="text-text-muted">Email Address</span>
                  <span className="text-text-primary font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-text-muted">Authentication</span>
                  <Badge variant="success">Active JWT Session</Badge>
                </div>
              </div>
            </div>

            {/* Organization Card */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-border pb-3">
                <Building className="w-4 h-4 text-accent-teal" />
                <h3 className="text-text-primary font-semibold text-sm">Organization Workspace</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-border-muted">
                  <span className="text-text-muted">Organization Name</span>
                  <span className="text-text-primary font-medium">{activeOrg?.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-muted">
                  <span className="text-text-muted">Slug Identifier</span>
                  <span className="text-text-primary font-mono">{activeOrg?.slug}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-text-muted">Tenancy Scope</span>
                  <span className="text-text-secondary font-mono text-[11px] truncate max-w-[200px]">
                    {activeOrg?.id}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: Database Explorer & SQL Console ─────────────────── */}
        {activeTab === 'database' && (
          <div className="space-y-6 animate-fade-in">
            {/* Database Metadata Header Card */}
            <div className="card p-5 bg-gradient-to-r from-bg-surface via-bg-elevated to-bg-surface border border-accent-green/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-green/15 text-accent-green border border-accent-green/30">
                      <HardDrive className="w-3.5 h-3.5" />
                      {dbOverview?.engine || 'SQLite'} Database
                    </span>
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-accent-green" />
                      Live Connection
                    </span>
                  </div>
                  <h3 className="text-text-primary font-bold text-base">
                    Direct Database Storage Node
                  </h3>
                  <p className="text-text-secondary text-xs mt-1">
                    Manage and inspect data tables, query records, or connect external SQL GUI
                    tools.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                    onClick={() => {
                      refetchDb()
                      refetchTableData()
                      toast.success('Database status refreshed')
                    }}
                  >
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Database Connection Specs */}
              {dbOverview && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/60 text-xs">
                  <div className="bg-bg-base/60 p-3 rounded-lg border border-border/50">
                    <span className="text-text-muted block text-[11px] mb-1">
                      Local Database Path
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="font-mono text-[11px] text-text-primary truncate"
                        title={dbOverview.database_path}
                      >
                        {dbOverview.database_path}
                      </span>
                      <button
                        onClick={() => copyToClipboard(dbOverview.database_path, 'Database path')}
                        className="text-text-muted hover:text-text-primary p-1"
                        title="Copy file path"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-bg-base/60 p-3 rounded-lg border border-border/50">
                    <span className="text-text-muted block text-[11px] mb-1">
                      Connection String
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="font-mono text-[11px] text-accent-green truncate"
                        title={dbOverview.connection_url}
                      >
                        {dbOverview.connection_url}
                      </span>
                      <button
                        onClick={() => copyToClipboard(dbOverview.connection_url, 'Connection URL')}
                        className="text-text-muted hover:text-text-primary p-1"
                        title="Copy connection string"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-bg-base/60 p-3 rounded-lg border border-border/50">
                    <span className="text-text-muted block text-[11px] mb-1">Storage & Schema</span>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-primary">
                        {dbOverview.file_size_bytes
                          ? `${Math.round(dbOverview.file_size_bytes / 1024)} KB on disk`
                          : 'Connected'}
                      </span>
                      <span className="text-[11px] text-text-muted">
                        {dbOverview.tables.length} Total Tables
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Table Navigation & Browser */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-text-primary font-semibold text-sm flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-accent-green" />
                  Database Tables ({dbOverview?.tables.length || 0})
                </h4>
                <span className="text-xs text-text-muted">Click any table to browse live rows</span>
              </div>

              {/* Table Buttons Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {dbOverview?.tables.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => setSelectedTable(t.name)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      selectedTable === t.name
                        ? 'bg-accent-green/15 border-accent-green text-text-primary shadow-sm'
                        : 'bg-bg-surface border-border text-text-secondary hover:border-border-muted hover:bg-bg-elevated'
                    }`}
                  >
                    <span className="block text-xs font-semibold truncate" title={t.name}>
                      {t.name}
                    </span>
                    <span className="text-[11px] text-text-muted mt-0.5 block">
                      {t.row_count} {t.row_count === 1 ? 'row' : 'rows'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Live Table Data Viewer */}
              <div className="card p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-accent-green">
                      {selectedTable}
                    </span>
                    <span className="text-xs text-text-muted">
                      ({tableData?.total_rows || 0} total records)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => setSqlQuery(`SELECT * FROM ${selectedTable} LIMIT 25;`)}
                      className="text-accent-teal hover:underline flex items-center gap-1"
                    >
                      <Terminal className="w-3 h-3" /> Load in SQL Console
                    </button>
                  </div>
                </div>

                {loadingTableData ? (
                  <div className="p-8 text-center text-text-muted text-xs">Loading table data…</div>
                ) : tableData && tableData.rows.length > 0 ? (
                  <div className="overflow-x-auto max-h-72 border border-border rounded-lg">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-bg-elevated text-text-muted uppercase text-[10px] sticky top-0 border-b border-border">
                        <tr>
                          {tableData.columns.map((col) => (
                            <th key={col} className="p-2.5 font-semibold whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-muted bg-bg-surface">
                        {tableData.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-bg-elevated/50 transition-colors">
                            {tableData.columns.map((col) => (
                              <td
                                key={col}
                                className="p-2.5 whitespace-nowrap text-text-primary text-[11px] max-w-xs truncate"
                                title={String(row[col] ?? '')}
                              >
                                {row[col] !== null ? (
                                  String(row[col])
                                ) : (
                                  <span className="text-text-muted italic">NULL</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-text-muted">
                    No rows currently present in table <strong>{selectedTable}</strong>.
                  </div>
                )}
              </div>
            </div>

            {/* Interactive SQL Console */}
            <div className="card p-5 space-y-4 border border-border">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-accent-green" />
                  <h4 className="text-text-primary font-semibold text-sm">
                    Interactive SQL Console
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">Preset queries:</span>
                  <button
                    onClick={() =>
                      setSqlQuery('SELECT id, email, full_name, is_active FROM users;')
                    }
                    className="text-[11px] bg-bg-elevated hover:bg-bg-overlay px-2 py-0.5 rounded text-text-secondary transition-colors"
                  >
                    Users
                  </button>
                  <button
                    onClick={() => setSqlQuery('SELECT id, name, slug FROM organizations;')}
                    className="text-[11px] bg-bg-elevated hover:bg-bg-overlay px-2 py-0.5 rounded text-text-secondary transition-colors"
                  >
                    Orgs
                  </button>
                  <button
                    onClick={() =>
                      setSqlQuery('SELECT id, name, project_type, status FROM projects;')
                    }
                    className="text-[11px] bg-bg-elevated hover:bg-bg-overlay px-2 py-0.5 rounded text-text-secondary transition-colors"
                  >
                    Projects
                  </button>
                  <button
                    onClick={() =>
                      setSqlQuery('SELECT id, name, area_hectares, status FROM sites;')
                    }
                    className="text-[11px] bg-bg-elevated hover:bg-bg-overlay px-2 py-0.5 rounded text-text-secondary transition-colors"
                  >
                    Sites
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  rows={3}
                  placeholder="Enter custom SQL query (e.g. SELECT * FROM users;)"
                  className="w-full bg-bg-elevated font-mono text-xs text-text-primary p-3 rounded-lg border border-border focus:border-accent-green focus:outline-none transition-colors"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-text-muted">
                    Supports all standard SQLite & PostgreSQL query syntax.
                  </span>
                  <Button
                    size="sm"
                    leftIcon={<Play className="w-3.5 h-3.5" />}
                    onClick={() => queryMutation.mutate(sqlQuery)}
                    isLoading={queryMutation.isPending}
                  >
                    Execute Query
                  </Button>
                </div>
              </div>

              {/* SQL Result Table */}
              {queryResult && (
                <div className="space-y-2 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-primary font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />
                      Results ({queryResult.row_count} rows)
                    </span>
                    <span className="text-text-muted font-mono text-[11px]">
                      Execution Time: {queryResult.execution_time_ms} ms
                    </span>
                  </div>

                  {queryResult.rows.length > 0 ? (
                    <div className="overflow-x-auto max-h-64 border border-border rounded-lg">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-bg-elevated text-text-muted uppercase text-[10px] sticky top-0 border-b border-border">
                          <tr>
                            {queryResult.columns.map((col) => (
                              <th key={col} className="p-2.5 font-semibold whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-muted bg-bg-surface">
                          {queryResult.rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-bg-elevated/50 transition-colors">
                              {queryResult.columns.map((col) => (
                                <td
                                  key={col}
                                  className="p-2.5 whitespace-nowrap text-text-primary text-[11px] max-w-xs truncate"
                                >
                                  {row[col] !== null ? (
                                    String(row[col])
                                  ) : (
                                    <span className="text-text-muted italic">NULL</span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 bg-bg-elevated rounded-lg text-xs text-text-muted">
                      {queryResult.message || 'Query completed with 0 rows returned.'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* External Tool Connection Guide */}
            <div className="card p-5 space-y-3 bg-bg-surface/70 border border-border">
              <h4 className="text-text-primary font-semibold text-xs uppercase tracking-wider flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-accent-green" />
                Connecting External Database GUIs & CLI Tools
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-text-secondary">
                <div className="p-3 rounded-lg bg-bg-elevated/60 border border-border/50 space-y-1.5">
                  <span className="font-semibold text-text-primary block">
                    Option 1: Interactive Terminal CLI
                  </span>
                  <p className="text-[11px] text-text-muted">
                    Run our built-in Python database shell directly in PowerShell:
                  </p>
                  <code className="block p-2 bg-bg-base rounded text-accent-green font-mono text-[11px]">
                    py -3.11 scripts/db_cli.py --interactive
                  </code>
                </div>
                <div className="p-3 rounded-lg bg-bg-elevated/60 border border-border/50 space-y-1.5">
                  <span className="font-semibold text-text-primary block">
                    Option 2: DB Browser for SQLite / DBeaver
                  </span>
                  <p className="text-[11px] text-text-muted">
                    Open SQLite database file directly in any GUI database viewer:
                  </p>
                  <code className="block p-2 bg-bg-base rounded text-accent-green font-mono text-[11px] truncate">
                    backend/darukaa_dev.db
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: Audit ──────────────────────────────────────────── */}
        {activeTab === 'audit' && (
          <div className="card p-5 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-text-primary font-semibold text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-accent-green" />
                System Audit Trail
              </h3>
              <span className="text-xs text-text-muted">{auditLogs.length} events logged</span>
            </div>

            {loadingLogs ? (
              <div className="p-8 text-center text-text-muted text-xs">Loading audit logs…</div>
            ) : auditLogs.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-xs">
                No audit events recorded yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {auditLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg bg-bg-elevated border border-border flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-text-primary">{log.action}</span>
                      <span className="text-text-muted ml-2">on {log.entity_type}</span>
                    </div>
                    <span className="text-text-muted font-mono text-[11px]">
                      {log.created_at ? format(new Date(log.created_at), 'dd MMM yyyy, HH:mm') : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: Integrations ────────────────────────────────────── */}
        {activeTab === 'integrations' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Satellite className="w-4 h-4 text-accent-green" />
                  <h3 className="text-text-primary font-semibold text-sm">
                    Earth Observation Pipeline
                  </h3>
                </div>
                <Badge variant="success">Copernicus Sentinel-2 & SAR</Badge>
              </div>
              <p className="text-xs text-text-secondary">
                Processes multispectral satellite bands and C-band SAR to estimate NDVI vegetation
                vigor, tree canopy density, and real-time NASA FIRMS wildfire tracking across
                polygon boundaries.
              </p>
              <div className="text-[11px] text-text-muted bg-bg-elevated p-2.5 rounded border border-border">
                Providers: <code>Microsoft Planetary Computer STAC · NASA FIRMS</code>
              </div>
            </div>

            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-accent-green" />
                  <h3 className="text-text-primary font-semibold text-sm">
                    PostGIS Spatial Engine
                  </h3>
                </div>
                <Badge variant="success">ST_Transform · ST_Area</Badge>
              </div>
              <p className="text-xs text-text-secondary">
                Geodetic area calculations, polygon boundary validation, and spatial viewport
                intersection queries executed on the database server.
              </p>
              <div className="text-[11px] text-text-muted bg-bg-elevated p-2.5 rounded border border-border">
                Projection: <code>EPSG:4326 (WGS84) &rarr; EPSG:3857 (Meters)</code>
              </div>
            </div>

            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-accent-teal" />
                  <h3 className="text-text-primary font-semibold text-sm">Security & Tenancy</h3>
                </div>
                <Badge variant="default">Multi-Tenant</Badge>
              </div>
              <p className="text-xs text-text-secondary">
                All data access is gated by organization membership and authenticated via HS256 JWT
                tokens. Password hashes secured with bcrypt.
              </p>
              <div className="text-[11px] text-text-muted bg-bg-elevated p-2.5 rounded border border-border">
                Auth: <code>Bearer JWT with Claims Isolation</code>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
