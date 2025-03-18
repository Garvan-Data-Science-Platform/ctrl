import {
  Box,
  Button,
  Typography,
  TextField,
  Divider,
  Modal,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import { useState } from 'react'
import { axiosInstance } from '../../providers/dataProvider'
import { Close, ArrowBack } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { instrumentUploadCSVDocumentation } from './getInstrumentFromRedcap'
import { useNotification, useBack, useInvalidate } from '@refinedev/core'

const ConfirmImportDialog = ({
  open,
  onClose,
  onConfirm,
  dataLocation,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  dataLocation: string
}) => {
  return (
    <Dialog open={open} onClose={onClose} data-cy="confirmDialog">
      <DialogTitle>{'Confirm Survey Import'}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Warning: This action will overwrite the current draft survey. The imported data from "
          {dataLocation}" will replace any existing content. Do you want to continue?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="error" autoFocus>
          Yes, Overwrite
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export const SurveyImport = () => {
  // States
  const [file, setFile] = useState<File | null>(null)
  const [formName, setFormName] = useState<string>('')
  const [redcapAPIToken, setRedcapAPIToken] = useState<string>('')
  const [openHelpPage, setHelpPageOpen] = useState(false)
  const [confirmFileDialogOpen, setConfirmFileDialogOpen] = useState(false)
  const [confirmApiDialogOpen, setConfirmApiDialogOpen] = useState(false)

  const navigate = useNavigate()
  const { open } = useNotification()
  const back = useBack()
  const invalidate = useInvalidate()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0])
    }
  }

  // File Submission
  const onSubmitFile = () => {
    handleFileDialogClose()
    if (!file) {
      open?.({ type: 'error', message: 'Please upload a file before proceeding' })
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    axiosInstance
      .post('/integrations/redcap/instrument/upload/csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then(async (response) => {
        const data = response.data
        invalidate({ resource: 'surveys', invalidates: ['resourceAll'] })
        navigate(`/surveys/edit/${data.id}`)
      })
      .catch(() => {
        open?.({ type: 'error', message: 'Error uploading file' })
        return
      })
  }

  // API Submission
  const onSubmitApi = () => {
    handleApiDialogClose()

    if (!formName) {
      open?.({ type: 'error', message: 'Please enter a form to pull from REDCap' })
      return
    } else if (!redcapAPIToken) {
      open?.({ type: 'error', message: 'Please enter a REDCap API Token' })
      return
    }

    axiosInstance
      .post('/integrations/redcap/instrument/upload/api', {
        formName,
        redcapAPIToken,
      })
      .then((response) => {
        const data = response.data
        invalidate({ resource: 'surveys', invalidates: ['resourceAll'] })
        navigate(`/surveys/edit/${data.id}`)
      })
      .catch((response) => {
        open?.({
          type: 'error',
          message: `Internal Server Error: ${response.response.data.message}`,
        })
      })
  }

  // Handlers
  const handleFileDialogOpen = () => {
    setConfirmFileDialogOpen(true)
  }

  const handleFileDialogClose = () => {
    setConfirmFileDialogOpen(false)
  }

  const handleApiDialogOpen = () => {
    setConfirmApiDialogOpen(true)
  }

  const handleApiDialogClose = () => {
    setConfirmApiDialogOpen(false)
  }

  const handleHelpPageOpen = () => setHelpPageOpen(true)
  const handleHelpPageClose = () => setHelpPageOpen(false)

  return (
    <Box>
      <IconButton
        sx={{
          position: 'relative',
        }}
        onClick={() => back()}
      >
        <ArrowBack />
      </IconButton>
      <Box
        component="form"
        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        autoComplete="off"
      >
        <img
          src="/redcap.png"
          alt="REDCap Logo"
          style={{ height: '100px', marginBottom: '16px' }}
        />
        <Typography variant="body2" color="error" gutterBottom>
          Note: This will overwrite the current draft survey.
        </Typography>
        <Box sx={{ mt: 1, display: 'flex', width: '100%', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Upload Instrument File
            </Typography>
            <Button variant="outlined" component="label">
              UPLOAD FILE
              <input
                type="file"
                hidden
                accept=".csv"
                onChange={handleFileChange}
                data-cy="instrumentAttach"
              />
            </Button>
            {file && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body1" gutterBottom>
                    File uploaded: {file.name}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleFileDialogOpen}
                  sx={{ mt: 2 }}
                >
                  Confirm
                </Button>
                <ConfirmImportDialog
                  open={confirmFileDialogOpen}
                  onClose={handleFileDialogClose}
                  onConfirm={onSubmitFile}
                  dataLocation={file.name}
                />
              </Box>
            )}
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Need help?{' '}
              <span
                style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
                onClick={handleHelpPageOpen}
              >
                How to export instruments from REDCap
              </span>
            </Typography>

            <Modal open={openHelpPage} onClose={handleHelpPageClose} data-cy="helpPage">
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '75%',
                  maxHeight: '80vh',
                  bgcolor: 'background.paper',
                  border: '2px solid #000',
                  boxShadow: 24,
                  p: 4,
                  overflow: 'auto',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <IconButton onClick={handleHelpPageClose} data-cy="closeHelpPage">
                    <Close />
                  </IconButton>
                </Box>
                <Box sx={{ mt: 2, maxWidth: '100%' }}>
                  <ReactMarkdown>{instrumentUploadCSVDocumentation}</ReactMarkdown>
                </Box>
              </Box>
            </Modal>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Import from REDCap API
            </Typography>
            <TextField
              label="REDCap API Token"
              variant="outlined"
              value={redcapAPIToken}
              onChange={(e) => setRedcapAPIToken(e.target.value)}
              sx={{ mb: 2 }}
              type="password"
              data-cy="redcapAPIToken"
            />
            <TextField
              label="Form Name"
              variant="outlined"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              sx={{ mb: 2 }}
              data-cy="formName"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleApiDialogOpen}
              disabled={!formName || !redcapAPIToken}
              data-cy="apiSubmit"
            >
              Import from API
            </Button>
            <ConfirmImportDialog
              open={confirmApiDialogOpen}
              onClose={handleApiDialogClose}
              onConfirm={onSubmitApi}
              dataLocation={formName}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
