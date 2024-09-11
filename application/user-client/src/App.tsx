import { useState } from 'react'
import './App.css'
import { Box, Button, ThemeProvider } from '@mui/material'
import customTheme from './theme'
import { blue, red } from '@mui/material/colors'

import { RouterProvider } from 'react-router-dom'
import router from './router.tsx'
import { AuthProvider } from './auth'

function App() {
  const [count, setCount] = useState(0)
  const theme = customTheme({ primary: count >= 0 ? red : blue, secondary: blue })

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
