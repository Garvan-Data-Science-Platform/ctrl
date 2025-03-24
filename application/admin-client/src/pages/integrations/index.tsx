import { Box, Button, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

export const IntegrationsHome = () => {
  const navigate = useNavigate()

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Integrations
      </Typography>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          REDCap
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            variant="contained"
            onClick={() => navigate('/integrations/redcap/survey/import')}
            sx={{
              minWidth: '200px',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <img src="/redcap.png" alt="REDCap Logo" style={{ height: '40px' }} />
            Import Instrument
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export * from './import'
