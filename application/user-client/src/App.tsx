import './App.css'
import { Box, Theme, ThemeProvider, Typography } from '@mui/material'
import customTheme from './theme'

import { RouterProvider } from 'react-router-dom'
import router from './router.tsx'
import { AuthProvider } from './auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { apiClient } from './apiClient.ts'
import { useAppStore } from './store.ts'

const queryClient = new QueryClient()

function App() {
  const [theme, setTheme] = useState<Theme | null>(null)
  const { setNewsLink } = useAppStore()

  function standardize_color(str: string) {
    const ctx = document.createElement('canvas').getContext('2d') as any
    ctx.fillStyle = str
    return ctx.fillStyle
  }

  useEffect(() => {
    apiClient.get('/settings/userportal').then((res) => {
      const { primaryColour: primary, secondaryColour: secondary, newsLink } = res.data.data
      setNewsLink(newsLink)
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
      <Box sx={{ minHeight: '98vh', display: 'flex', flexDirection: 'column' }}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemeProvider theme={theme}>
              <RouterProvider router={router} />
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
        <Box sx={{ flex: '1 0 auto' }} />
        <footer
          style={{
            bottom: 0,
            left: 0,
            marginTop: 12,
            marginBottom: 12,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <Typography variant="body2">
            {import.meta.env['VITE_APP_VERSION']} © 2025 Garvan Institute of Medical Research
          </Typography>
        </footer>
      </Box>
    )
  )
}

export default App
