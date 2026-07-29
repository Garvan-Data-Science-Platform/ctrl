import { Button, Stack, Typography } from '@mui/material'
import { useNotification } from '@refinedev/core'
import { useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { axiosInstance } from '../providers/dataProvider'

export const LogoUploader = ({
  resource,
  url,
  hasLogo,
}: {
  resource: string
  url: string
  hasLogo?: boolean
}) => {
  const { open } = useNotification()
  const queryClient = useQueryClient()
  const [logoVersion, setLogoVersion] = useState(Date.now())
  const [localHasLogo, setLocalHasLogo] = useState(hasLogo)

  useEffect(() => {
    setLocalHasLogo(hasLogo)
  }, [hasLogo])

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
      setLogoVersion(Date.now())
      setLocalHasLogo(true)

      queryClient.invalidateQueries({
        queryKey: [resource],
      })
    } catch (e: any) {
      open?.({
        type: 'error',
        message: `Failed to update logo: ${e.response.data.details}`,
      })
    }
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
      setLocalHasLogo(false)

      queryClient.invalidateQueries({
        queryKey: [resource],
      })
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
          uploadLogo(e.target.files?.item(0) as File)
        }}
        data-cy="logo-upload"
      />
      {localHasLogo ? (
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
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={deleteLogo}
            data-cy="logo-delete"
            sx={{ px: 0.25, py: 0.25, pt: '4px', cursor: 'pointer', fontSize: '10px' }}
          >
            Remove Logo
          </Button>
        </Stack>
      ) : (
        'Upload Logo'
      )}
    </Button>
  )
}
