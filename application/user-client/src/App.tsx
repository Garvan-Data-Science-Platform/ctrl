import './App.css'
import { ThemeProvider } from '@mui/material'
import customTheme from './theme'

import { RouterProvider } from 'react-router-dom'
import router from './router.tsx'
import { AuthProvider } from './auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { apiClient } from './apiClient.ts'
import { useAppStore } from './store.ts'

function App() {
  const queryClient = new QueryClient()
  const [loading, setLoading] = useState(true)
  const store = useAppStore()
  const theme = customTheme({
    primary: store.primaryColour || '#2196f3',
    secondary: store.secondaryColour || '#2196f3',
  })

  useEffect(() => {
    apiClient.get('/settings/theme').then((res) => {
      store.updateTheme(res.data.data.primaryColour, res.data.data.secondaryColour)
      setLoading(false)
    })
  }, [])

  return (
    !loading && (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider theme={theme}>
            <RouterProvider router={router} />
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    )
  )
}

export default App
