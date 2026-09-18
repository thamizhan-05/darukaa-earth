import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 — clear tokens and redirect to login only if not a portfolio demo session
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const isDemo = localStorage.getItem('is_demo_session') === 'true'
    const status = error.response?.status
    if (status === 401 && !isDemo) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default apiClient
