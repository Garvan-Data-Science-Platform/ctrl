import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Typography,
} from '@mui/material'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd'
import { useNavigate } from 'react-router-dom'
import { SensitiveTextField } from '../../components/SensitiveTextField'
import { useCustom } from '@refinedev/core'
import { GetElsaTokenResponse } from '@common/types/api/integrations/getElsaToken'
import { axiosInstance } from '../../providers/dataProvider'
import { useState } from 'react'

export const IntegrationsHome = () => {
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)

  // Add a queryKey for invalidation
  const { data, refetch } = useCustom<GetElsaTokenResponse>({
    url: `elsa/token`,
    method: 'get',
  })

  const enabled = Boolean(data?.data.token)

  const handleCheckboxChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked
    if (checked) {
      await axiosInstance.post('elsa/enable')
      refetch()
    } else {
      setDialogOpen(true)
    }
  }

  const handleConfirmDisable = async () => {
    await axiosInstance.post('elsa/disable')
    setDialogOpen(false)
    refetch()
  }

  const handleCancelDisable = () => {
    setDialogOpen(false)
  }

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
            Import Survey
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
      <Box sx={{ mt: 4 }}>
        <Typography variant="h3">Elsa</Typography>
        <FormControl>
          <FormControlLabel
            control={
              <Checkbox data-cy="elsa-checkbox" checked={enabled} onChange={handleCheckboxChange} />
            }
            label={<Typography>Enable Elsa Integration</Typography>}
          />
        </FormControl>
      </Box>
      {enabled && (
        <SensitiveTextField
          margin="dense"
          InputLabelProps={{ shrink: true }}
          label={'Elsa API Key'}
          data-cy="elsaToken"
          value={data?.data.token}
        />
      )}
      <Dialog open={dialogOpen} onClose={handleCancelDisable}>
        <DialogTitle>Disable Elsa Integration?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to disable Elsa integration? This will remove your existing API
            key.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDisable}>Cancel</Button>
          <Button onClick={handleConfirmDisable} color="error" autoFocus data-cy="confirm">
            Disable
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export { SurveyImport } from './surveyImport'
export { ParticipantImport } from './participantImport'
