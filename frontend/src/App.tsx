import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/context/AuthContext'
import { UIProvider } from '@/context/UIContext'
import { AppRouter } from '@/routes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UIProvider>
          <AppRouter />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1C2333',
                color: '#E6EDF3',
                border: '1px solid #30363D',
                borderRadius: '8px',
                fontSize: '14px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              },
              success: {
                iconTheme: { primary: '#3FB950', secondary: '#0D1117' },
              },
              error: {
                iconTheme: { primary: '#F85149', secondary: '#0D1117' },
              },
            }}
          />
        </UIProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
