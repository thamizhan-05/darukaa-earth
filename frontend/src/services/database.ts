import api from './api'

export interface DatabaseTableColumn {
  name: string
  type: string
  pk: boolean
}

export interface DatabaseTableMeta {
  name: string
  row_count: number
  columns: DatabaseTableColumn[]
}

export interface DatabaseOverview {
  engine: string
  database_path: string
  file_size_bytes: number | null
  connection_url: string
  tables: DatabaseTableMeta[]
}

export interface TableDataResponse {
  table: string
  total_rows: number
  offset: number
  limit: number
  columns: string[]
  rows: Record<string, any>[]
}

export interface QueryResult {
  success: boolean
  columns: string[]
  rows: Record<string, any>[]
  row_count: number
  execution_time_ms: number
  message?: string
}

export const databaseService = {
  async getOverview(): Promise<DatabaseOverview> {
    const res = await api.get('/database/overview')
    return res.data
  },

  async getTableData(tableName: string, offset = 0, limit = 50): Promise<TableDataResponse> {
    const res = await api.get(`/database/tables/${tableName}`, {
      params: { offset, limit },
    })
    return res.data
  },

  async executeQuery(query: string, limit = 100): Promise<QueryResult> {
    const res = await api.post('/database/query', { query, limit })
    return res.data
  },
}
