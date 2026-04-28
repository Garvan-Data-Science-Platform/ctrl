import { ColorModeContext } from '../contexts/color-mode'
import { useContext } from 'react'


export const RedcapLogo = () => {
    const { mode } = useContext(ColorModeContext)

    return mode === 'dark' ? (
        <img src="/redcap-logo-dark.png" alt="REDCap Logo" style={{ height: '100px' }} />
    ) : (
        <img src="/redcap-logo-light.png" alt="REDCap Logo" style={{ height: '100px' }} />
    )
}