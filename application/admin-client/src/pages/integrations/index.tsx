import { Box, Button, Typography } from '@mui/material'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd'
import { useNavigate } from 'react-router-dom'

export const IntegrationsHome = () => {
  const navigate = useNavigate()

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Integrations
      </Typography>

      <Box sx={{ mt: 4 }}>
        <img src="/redcap.png" alt="REDCap Logo" style={{ height: '70px' }} />

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
            <PlaylistAddIcon />
            Import Instruments
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/integrations/redcap/participant/import')}
            sx={{
              minWidth: '200px',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <GroupAddIcon />
            Import Participants
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export { SurveyImport } from './surveyImport'
export { ParticipantImport } from './participantImport'
