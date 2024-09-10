import { createTheme, PaletteColorOptions } from '@mui/material'

interface ThemeProps {
  primary?: PaletteColorOptions
  secondary?: PaletteColorOptions
}

function customTheme(props: ThemeProps) {
  return createTheme({
    palette: {
      primary: props.primary,
      secondary: props.secondary,
    },
  })
}

export default customTheme

//Below is needed to customize specific theme variables
declare module '@mui/material/styles' {
  interface Theme {
    status: {
      danger: string
    }
  }
  // allow configuration using `createTheme`
  interface ThemeOptions {
    status?: {
      danger?: string
    }
  }
}
