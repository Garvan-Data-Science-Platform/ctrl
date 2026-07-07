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
import { useEffect, useState } from 'react'
import { Close, ArrowBack } from '@mui/icons-material'
import ReactMarkdown from 'react-markdown'
import { useNotification, useBack } from '@refinedev/core'
import { Link } from 'react-router-dom'
import { useCurrentStudyId, useStudyStore } from '../studyStore'
import { RedcapLogo } from './RedcapLogo'

interface RedcapImportProps {
  type: 'survey' | 'participant'
  helpDocumentation: string
  warningMessage?: string
  onSubmitFile: (file: File) => void
  onSubmitApi: (formName?: string) => void
  confirmDialog?: boolean
  formNameInput?: boolean
}

export const RedcapImport = ({
  type,
  helpDocumentation,
  warningMessage,
  onSubmitFile,
  onSubmitApi,
  confirmDialog = true,
  formNameInput = true,
}: RedcapImportProps) => {
  const [file, setFile] = useState<File | null>(null)
  const [formName, setFormName] = useState<string>('')
  const [openHelpPage, setHelpPageOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'FILE' | 'API'>('FILE')

  const { open } = useNotification()
  const back = useBack()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0])
    }
  }

  const handleFileSubmission = () => {
    closeDialog()
    if (!file) {
      open?.({ type: 'error', message: 'Please upload a file before proceeding' })
      return
    }

    onSubmitFile(file)
  }

  const handleApiSubmission = () => {
    closeDialog()

    if (formNameInput && !formName) {
      open?.({ type: 'error', message: 'Please enter a form to pull from REDCap' })
      return
    }

    onSubmitApi(formName)
  }

  const handleHelpPageOpen = () => setHelpPageOpen(true)
  const handleHelpPageClose = () => setHelpPageOpen(false)
  const openDialog = () => setDialogOpen(true)
  const closeDialog = () => setDialogOpen(false)

  const [redcapIsSetup, setRedcapIsSetup] = useState(true)

  const { studies } = useStudyStore()
  const studyId = useCurrentStudyId()

  useEffect(() => {
    const currentStudy = studies.find((val) => val.id == studyId)
    if (!currentStudy?.hasRedcapToken || !currentStudy?.redcapURL) {
      setRedcapIsSetup(false)
    } else {
      setRedcapIsSetup(true)
    }
  }, [studies, studyId])

  return (
    <Box>
      {confirmDialog && (
        <Dialog open={dialogOpen} onClose={closeDialog} data-cy="confirmDialog">
          <DialogTitle sx={{ textTransform: 'capitalize' }}>{`Confirm ${type} Import`}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Warning: {warningMessage} The imported data from "
              {dialogType == 'API' ? formName : file?.name}" will replace any existing content. Do
              you want to continue?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button
              onClick={dialogType == 'API' ? handleApiSubmission : handleFileSubmission}
              color="error"
              autoFocus
            >
              Yes, Overwrite
            </Button>
          </DialogActions>
        </Dialog>
      )}
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
        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault()
          if (confirmDialog) {
            setDialogType('API')
            openDialog()
          } else {
            handleApiSubmission()
          }
        }}
      >
        <RedcapLogo />
        <Typography variant="body2" color="error" gutterBottom>
          {warningMessage}
        </Typography>
        <Box sx={{ mt: 1, display: 'flex', width: '100%', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize' }}>
              Upload {type} File
            </Typography>
            {type == 'participant' ? (
              <Button
                variant="outlined"
                component={Link}
                to="/participants"
                state={{ openCsvModal: true }}
                data-cy="upload-button"
              >
                UPLOAD FILE
              </Button>
            ) : (
              <Button variant="outlined" component="label">
                UPLOAD FILE
                <input
                  type="file"
                  hidden
                  accept=".csv"
                  onChange={handleFileChange}
                  data-cy={`${type}Attach`}
                />
              </Button>
            )}

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
                  onClick={() => {
                    if (confirmDialog) {
                      setDialogType('FILE')
                      openDialog()
                    } else {
                      handleFileSubmission()
                    }
                  }}
                  sx={{ mt: 2 }}
                >
                  Confirm
                </Button>
              </Box>
            )}
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Need help?{' '}
              <Typography
                component="span"
                sx={{ color: 'primary.main', textDecoration: 'underline', cursor: 'pointer' }}
                onClick={handleHelpPageOpen}
              >
                How to export {type}s from REDCap
              </Typography>
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
                  border: 1,
                  borderColor: 'divider',
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
                  <ReactMarkdown>{helpDocumentation}</ReactMarkdown>
                </Box>
              </Box>
            </Modal>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Import from REDCap API
            </Typography>
            {redcapIsSetup ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {formNameInput && (
                  <TextField
                    label="Form Name"
                    variant="outlined"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    sx={{ mb: 2 }}
                    data-cy="formName"
                  />
                )}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    if (confirmDialog) {
                      setDialogType('API')
                      openDialog()
                    } else {
                      handleApiSubmission()
                    }
                  }}
                  disabled={formNameInput && !formName}
                  data-cy="apiSubmit"
                >
                  Import from API
                </Button>
              </Box>
            ) : (
              <>
                <Typography>Redcap API is not set up</Typography>
                {/* 
                // @ts-ignore */}
                <Button component={Link} to={`/studies?advanced=${studyId}`}>
                  Redcap settings
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
