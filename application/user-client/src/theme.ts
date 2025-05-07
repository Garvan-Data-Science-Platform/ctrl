import { Color, createTheme, PaletteColorOptions } from '@mui/material'

interface ThemeProps {
  primary: string
  secondary: string
}

function customTheme(props: ThemeProps) {
  return createTheme({
    palette: {
      primary: { main: props.primary },
      secondary: { main: props.secondary },
      text: { primary: '#272952' },
    },
    typography: {
      h3: { color: '#272952', fontSize: 40 },
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
