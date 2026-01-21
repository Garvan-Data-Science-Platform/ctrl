import React, { PropsWithChildren, createContext } from 'react'
import { ThemeProvider, useMediaQuery } from '@mui/material'
import { RefineThemes } from '@refinedev/mui'

type ColorModeContextType = {
  mode: 'light' | 'dark'
}

export const ColorModeContext = createContext<ColorModeContextType>({} as ColorModeContextType)

export const ColorModeContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
  const mode = 'light' // Force light mode for now. TODO: resolve dark mode issues prefersDarkMode ? 'dark' : 'light'

  return (
    <ColorModeContext.Provider value={{ mode }}>
      <ThemeProvider theme={mode === 'light' ? RefineThemes.Blue : RefineThemes.BlueDark}>
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}
