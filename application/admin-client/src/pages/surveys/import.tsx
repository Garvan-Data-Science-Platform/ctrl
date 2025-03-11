import { Box, Button, Typography, TextField, Divider, Modal, IconButton } from '@mui/material'
import { useForm } from '@refinedev/react-hook-form'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { axiosInstance } from '../../providers/dataProvider'
import { API_URL } from '../../App'
import { Close, ArrowBack } from '@mui/icons-material'
import ReactMarkdown from 'react-markdown'
import { instrumentUploadCSVDocumentation } from './getInstrumentFromRedcap'
import { useNotification, useBack } from '@refinedev/core'

export const SurveyImport = () => {
  const { handleSubmit } = useForm({})
  const [file, setFile] = useState<File | null>(null)
  const [formName, setFormName] = useState<string>('')
  const [openPage, setOpenPage] = useState(false)
  const navigate = useNavigate()
  const { open } = useNotification()
  const back = useBack()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0])
    }
  }

  const onSubmitFile = () => {
    if (!file) {
      open?.({ type: 'error', message: 'Please upload a file before proceeding' })
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    axiosInstance
      .post(`${API_URL}/integrations/redcap/instrument/upload/csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((response) => {
        console.log(response)
        const data = response.data
        navigate(`/surveys/edit/${data.id}`)
        navigate(0) // Refresh the page
      })
      .catch(() => {
        open?.({ type: 'error', message: 'Error uploading file' })
        return
      })
  }

  const onSubmitApi = () => {
    if (!formName) {
      alert('Please enter a form to pull from REDCap')
      return
    }
    axiosInstance
      .post(`${API_URL}/integrations/redcap/instrument/upload/api`, { form: formName })
      .then((response) => {
        const data = response.data
        navigate(`/surveys/edit/${data.id}`)
        navigate(0) // Refresh the page
      })
      .catch(() => {
        alert('ERROR IMPORTING FROM API')
      })
  }

  const handleOpen = () => setOpenPage(true)
  const handleClose = () => setOpenPage(false)

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
              <input type="file" hidden accept=".csv" onChange={handleFileChange} />
            </Button>
            {file && (
              <>
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body1" gutterBottom>
                    File uploaded: {file.name}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit(onSubmitFile)}
                  sx={{ mt: 2 }}
                >
                  Confirm
                </Button>
              </>
            )}
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Need help?{' '}
              <span
                style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
                onClick={handleOpen}
              >
                How to export instruments from REDCap
              </span>
            </Typography>

            <Modal
              open={openPage}
              onClose={handleClose}
              aria-labelledby="modal-title"
              aria-describedby="modal-description"
            >
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
                  <IconButton onClick={handleClose}>
                    <Close />
                  </IconButton>
                </Box>
                <Box id="modal-description" sx={{ mt: 2, maxWidth: '100%' }}>
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
              label="Form Name"
              variant="outlined"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit(onSubmitApi)}
              disabled={!formName}
            >
              Import from API
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
