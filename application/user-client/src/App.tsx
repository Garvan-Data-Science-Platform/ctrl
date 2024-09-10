import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

import './App.css'
import { Button, ThemeProvider } from '@mui/material'
import customTheme from './theme'
import { blue, red } from '@mui/material/colors'

import { RouterProvider } from 'react-router-dom'
import router from './router.tsx'

function App() {
  const [count, setCount] = useState(0)
  const theme = customTheme({ primary: count >= 0 ? red : blue, secondary: blue })

  return (
    <ThemeProvider theme={theme}>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

export default App
