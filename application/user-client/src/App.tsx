import './App.css'
import { Box, ThemeProvider } from '@mui/material'
import customTheme from './theme'
import { blue, red } from '@mui/material/colors'

import { RouterProvider } from 'react-router-dom'
import router from './router.tsx'
import { AuthProvider } from './auth'
import { useBearStore } from './store.ts'

function App() {
  const bear = useBearStore()
  const theme = customTheme({ primary: bear.bears >= 3 ? red : blue, secondary: blue })

  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <Box sx={{ backgroundColor: '#f8fbff', height: '100vh' }}>
          <RouterProvider router={router} />
        </Box>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
