import './App.css'
import { ThemeProvider } from '@mui/material'
import customTheme from './theme'
import { blue } from '@mui/material/colors'

import { RouterProvider } from 'react-router-dom'
import router from './router.tsx'
import { AuthProvider } from './auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function App() {
  const theme = customTheme({ primary: blue, secondary: blue })
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <RouterProvider router={router} />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
