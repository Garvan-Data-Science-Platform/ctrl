import { Box, Button, Typography } from '@mui/material'
import { Create } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { axiosInstance } from '../../providers/dataProvider'
import { API_URL } from '../../App'

export const SurveyImport = () => {
  const {
    refineCore: { formLoading },
    handleSubmit,
  } = useForm({})
  const [file, setFile] = useState<File | null>(null)
  const [inputKey, setInputKey] = useState<number>(0)
  const navigate = useNavigate()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0])
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setInputKey((prevKey) => prevKey + 1) // Change the key to reset the input
  }

  const onSubmit = () => {
    if (!file) {
      alert('Please upload a file before submitting.')
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
      .then((data) => {
        console.log(data)
        navigate('/surveys')
      })
      .catch(() => {
        alert('ERROR UPLOADING FILE')
      })
  }

  return (
    <Create
      isLoading={formLoading}
      title="REDCap Instrument Import"
      footerButtons={
        <Button variant="contained" color="primary" onClick={handleSubmit(onSubmit)}>
          Save as Draft
        </Button>
      }
    >
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
        <Typography variant="h6" gutterBottom>
          Import Instrument
        </Typography>

        <Button variant="contained" component="label">
          Upload CSV
          <input
            key={inputKey} // Add key to force reset
            type="file"
            hidden
            accept=".csv"
            onChange={handleFileChange}
          />
        </Button>
        {file && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body1" gutterBottom>
              File uploaded: {file.name}
            </Typography>
            <Button variant="outlined" color="error" onClick={handleRemoveFile} sx={{ mr: 1 }}>
              Remove
            </Button>
            <Button
              variant="outlined"
              color="primary"
              href={URL.createObjectURL(file)}
              download={file.name}
            >
              Download
            </Button>
          </Box>
        )}

        <Typography variant="body2" color="error" gutterBottom>
          Note: This will overwrite the current draft survey.
        </Typography>
      </Box>
    </Create>
  )
}
