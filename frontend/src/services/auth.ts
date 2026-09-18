import apiClient from './api'
import type { LoginRequest, RegisterRequest, TokenResponse, User } from '@/types/auth'
import { DEMO_USER } from './demoData'

export const authService = {
  async register(data: RegisterRequest): Promise<TokenResponse> {
    try {
      const res = await apiClient.post<TokenResponse>('/auth/register', data)
      return res.data
    } catch {
      // Portfolio/demo fallback: allow any signup to succeed instantly
      const demoTokens: TokenResponse = {
        access_token: 'demo_token_' + Date.now(),
        refresh_token: 'demo_refresh_token',
        token_type: 'bearer',
      }
      this.saveTokens(demoTokens)
      localStorage.setItem('is_demo_session', 'true')
      return demoTokens
    }
  },

  async login(data: LoginRequest): Promise<TokenResponse> {
    try {
      const res = await apiClient.post<TokenResponse>('/auth/login', data)
      return res.data
    } catch {
      // Portfolio/demo fallback: allow any login credentials to succeed instantly
      const demoTokens: TokenResponse = {
        access_token: 'demo_token_' + Date.now(),
        refresh_token: 'demo_refresh_token',
        token_type: 'bearer',
      }
      this.saveTokens(demoTokens)
      localStorage.setItem('is_demo_session', 'true')
      return demoTokens
    }
  },

  loginAsDemo(): TokenResponse {
    const demoTokens: TokenResponse = {
      access_token: 'demo_token_' + Date.now(),
      refresh_token: 'demo_refresh_token',
      token_type: 'bearer',
    }
    this.saveTokens(demoTokens)
    localStorage.setItem('is_demo_session', 'true')
    return demoTokens
  },

  async me(): Promise<User> {
    if (localStorage.getItem('is_demo_session') === 'true') {
      return DEMO_USER
    }
    try {
      const res = await apiClient.get<User>('/auth/me')
      return res.data
    } catch {
      return DEMO_USER
    }
  },

  async refresh(refreshToken: string): Promise<TokenResponse> {
    try {
      const res = await apiClient.post<TokenResponse>('/auth/refresh', {
        refresh_token: refreshToken,
      })
      return res.data
    } catch {
      return {
        access_token: 'demo_token_' + Date.now(),
        refresh_token: 'demo_refresh_token',
        token_type: 'bearer',
      }
    }
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
