import './App.css'
import { Box, ThemeProvider } from '@mui/material'
import customTheme from './theme'
import { blue, red } from '@mui/material/colors'

import { RouterProvider } from 'react-router-dom'
import router from './router.tsx'
import { AuthProvider } from './auth'
import { useAppStore } from './store.ts'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function App() {
  const bears = useAppStore((state) => state.bears)
  const theme = customTheme({ primary: bears >= 3 ? red : blue, secondary: blue })
  const queryClient = new QueryClient()
  console.log('APP RENDER')

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <Box
            sx={{
              backgroundColor: '#f8fbff',
              minHeight: '100vh',
              height: '100%',
              pb: 3,
              pl: 1,
              pr: 1,
            }}
          >
            <RouterProvider router={router} />
          </Box>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
