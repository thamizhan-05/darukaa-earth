import apiClient from './api'
import type { LoginRequest, RegisterRequest, TokenResponse, User } from '@/types/auth'

export const authService = {
  async register(data: RegisterRequest): Promise<TokenResponse> {
    const res = await apiClient.post<TokenResponse>('/auth/register', data)
    return res.data
  },

  async login(data: LoginRequest): Promise<TokenResponse> {
    const res = await apiClient.post<TokenResponse>('/auth/login', data)
    return res.data
  },

  async me(): Promise<User> {
    const res = await apiClient.get<User>('/auth/me')
    return res.data
  },

  async refresh(refreshToken: string): Promise<TokenResponse> {
    const res = await apiClient.post<TokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    })
    return res.data
  },

  saveTokens(tokens: TokenResponse) {
    localStorage.setItem('access_token', tokens.access_token)
    localStorage.setItem('refresh_token', tokens.refresh_token)
  },

  clearTokens() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },

  getAccessToken(): string | null {
    return localStorage.getItem('access_token')
  },

  async getAuditLogs(orgId: string): Promise<
    Array<{
      id: string
      action: string
      entity_type: string | null
      entity_id: string | null
      metadata: Record<string, any> | null
      created_at: string
    }>
  > {
    const res = await apiClient.get(`/organizations/${orgId}/audit-logs`)
    return res.data
  },
}
