import './App.css'
import { Theme, ThemeProvider } from '@mui/material'
import customTheme from './theme'

import { RouterProvider } from 'react-router-dom'
import router from './router.tsx'
import { AuthProvider } from './auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { apiClient } from './apiClient.ts'

const queryClient = new QueryClient()

function App() {
  const [theme, setTheme] = useState<Theme | null>(null)

  function standardize_color(str: string) {
    const ctx = document.createElement('canvas').getContext('2d')!
    ctx.fillStyle = str
    return ctx.fillStyle
  }

  useEffect(() => {
    apiClient.get('/settings/theme').then((res) => {
      const { primaryColour: primary, secondaryColour: secondary } = res.data.data
      setTheme(
        customTheme({
          primary: primary ? standardize_color(primary) : '#2196f3',
          secondary: secondary ? standardize_color(secondary) : '#2196f3',
        }),
      )
    })
  }, [])

  return (
    theme && (
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
