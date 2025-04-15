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
import { Close, ArrowBack } from '@mui/icons-material'
import ReactMarkdown from 'react-markdown'
import { useNotification, useBack, useInvalidate } from '@refinedev/core'
import { useNavigate } from 'react-router-dom'
import { axiosInstance } from '../providers/dataProvider'

interface RedcapImportProps {
  type: 'survey' | 'participant'
  helpDocumentation: string
  apiEndpoint: string
  fileEndpoint: string
  successRedirect?: string
  warningMessage: string
}

export const RedcapImport = ({
  type,
  helpDocumentation,
  apiEndpoint,
  fileEndpoint,
  successRedirect,
  warningMessage,
}: RedcapImportProps) => {
  const [file, setFile] = useState<File | null>(null)
  const [formName, setFormName] = useState<string>('')
  const [redcapAPIToken, setRedcapAPIToken] = useState<string>('')
  const [openHelpPage, setHelpPageOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'FILE' | 'API'>('FILE')

  const navigate = useNavigate()
  const { open } = useNotification()
  const back = useBack()
  const invalidate = useInvalidate()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0])
    }
  }

  const getInitialEmails = async (file: File): Promise<string[]> => {
    const content = await file.text()
    const rows = content.split('\n').slice(1) // Skip header row
    const uniqueEmails = new Set<string>()

    rows.forEach((row: string) => {
      const columns = row.split(',')
      const participantEmail = columns[5] // ctrl_email index

      if (participantEmail && participantEmail !== 'ctrl_email') {
        uniqueEmails.add(participantEmail)
      }
    })

    return Array.from(uniqueEmails)
  }

  const onSubmitFile = () => {
    closeDialog()
    if (!file) {
      open?.({ type: 'error', message: 'Please upload a file before proceeding' })
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    axiosInstance
      .post(fileEndpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then(async (response) => {
        const data = response.data
        invalidate({ resource: `${type}s`, invalidates: ['resourceAll'] })
        if (type == 'survey' && successRedirect) {
          navigate(successRedirect.replace(':surveyId', data.id))
        } else if (type == 'participant' && successRedirect) {
          navigate(successRedirect, {
            state: {
              openInviteModal: true,
              initialEmails: await getInitialEmails(file),
            },
          })
        }
      })
      .catch((err) => {
        console.error(err)
        open?.({ type: 'error', message: 'Error uploading file' })
        return
      })
  }

  const onSubmitApi = () => {
    closeDialog()

    if (!formName) {
      open?.({ type: 'error', message: 'Please enter a form to pull from REDCap' })
      return
    } else if (!redcapAPIToken) {
      open?.({ type: 'error', message: 'Please enter a REDCap API Token' })
      return
    }

    axiosInstance
      .post(apiEndpoint, {
        formName,
        redcapAPIToken,
      })
      .then((response) => {
        const data = response.data
        invalidate({ resource: `${type}s`, invalidates: ['resourceAll'] })
        if (successRedirect) {
          navigate(successRedirect.replace(':id', data.id))
        } else {
          navigate(`/${type}s`)
        }
      })
      .catch((response) => {
        open?.({
          type: 'error',
          message: `Internal Server Error: ${response.response.data.message}`,
        })
      })
  }

  const handleHelpPageOpen = () => setHelpPageOpen(true)
  const handleHelpPageClose = () => setHelpPageOpen(false)
  const openDialog = () => setDialogOpen(true)
  const closeDialog = () => setDialogOpen(false)

  return (
    <Box>
      <Dialog open={dialogOpen} onClose={closeDialog} data-cy="confirmDialog">
        <DialogTitle sx={{ textTransform: 'capitalize' }}>{`Confirm ${type} Import`}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Warning: {warningMessage} The imported data from "
            {dialogType == 'API' ? formName : file?.name}" will replace any existing content. Do you
            want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            onClick={dialogType == 'API' ? onSubmitApi : onSubmitFile}
            color="error"
            autoFocus
          >
            Yes, Overwrite
          </Button>
        </DialogActions>
      </Dialog>
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
      >
        <img
          src="/redcap.png"
          alt="REDCap Logo"
          style={{ height: '100px', marginBottom: '16px' }}
        />
        <Typography variant="body2" color="error" gutterBottom>
          {warningMessage}
        </Typography>
        <Box sx={{ mt: 1, display: 'flex', width: '100%', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize' }}>
              Upload {type} File
            </Typography>
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
                    setDialogType('FILE')
                    openDialog()
                  }}
                  sx={{ mt: 2 }}
                >
                  Confirm
                </Button>
              </Box>
            )}
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Need help?{' '}
              <span
                style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
                onClick={handleHelpPageOpen}
              >
                How to export {type}s from REDCap
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
              onClick={() => {
                setDialogType('API')
                openDialog()
              }}
              disabled={!formName || !redcapAPIToken}
              data-cy="apiSubmit"
            >
              Import from API
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
