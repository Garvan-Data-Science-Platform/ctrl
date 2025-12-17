import { Button, Stack, Typography } from '@mui/material'
import { useNotification } from '@refinedev/core'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { axiosInstance } from '../providers/dataProvider'

export const LogoUploader = ({ url, hasLogo = false }: { url: string; hasLogo?: boolean }) => {
  const { open } = useNotification()
  const queryClient = useQueryClient()
  const [logoVersion, setLogoVersion] = useState(Date.now())

  const uploadLogo = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      await axiosInstance.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      open?.({ type: 'success', message: 'Updated logo' })
      queryClient.invalidateQueries(['studies'])
    } catch (e: any) {
      open?.({
        type: 'error',
        message: `Failed to update logo: ${e.response.data.details}`,
      })
    }
  }

  const handleUploadLogo = async (file: File) => {
    await uploadLogo(file)
    setLogoVersion(Date.now())
  }

  const deleteLogo = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()

    try {
      await axiosInstance.delete(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      open?.({ type: 'success', message: 'Deleted logo' })
      queryClient.invalidateQueries(['studies'])
    } catch (e: any) {
      open?.({
        type: 'error',
        message: `Failed to delete logo: ${e.response.data.details}`,
      })
    }
  }

  return (
    <Button
      component="label"
      sx={{
        border: '1px solid grey',
        width: 130,
        height: 130,
        padding: 1,
        overflow: 'hidden',
      }}
    >
      <input
        type="file"
        hidden
        accept=".png,.jpg,.jpeg,.tif"
        onChange={(e) => {
          handleUploadLogo(e.target.files?.item(0) as File)
        }}
        data-cy="logo-upload"
      />
      {hasLogo ? (
        <Stack alignItems="center">
          <img
            src={import.meta.env.VITE_BACKEND_URL + `${url}?v=${logoVersion}`}
            style={{
              flexGrow: 1,
              minHeight: 0,
              width: '100%',
              objectFit: 'contain',
            }}
            height={60}
            data-cy="logo-preview"
            id="logo-preview"
          />
          <Typography variant="caption">Update logo</Typography>
          <Typography
            variant="caption"
            color="error"
            onClick={deleteLogo}
            data-cy="logo-delete"
            sx={{ cursor: 'pointer', fontWeight: 'bold' }}
          >
            Remove Logo
          </Typography>
        </Stack>
      ) : (
        'Upload Logo'
      )}
    </Button>
  )
}
