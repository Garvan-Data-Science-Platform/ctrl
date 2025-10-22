import { Box, Button, Container, TextField, Typography } from '@mui/material'
import { useNotification } from '@refinedev/core'
import { useForm } from '@refinedev/react-hook-form'
import { useNavigate } from 'react-router-dom'
import { axiosInstance } from '../../providers/dataProvider'
import { useState } from 'react'

const SettingsPage = () => {
  type FieldValues = {
    primaryColour: string | null
    secondaryColour: string | null
    tcLink: string | null
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<any, any, FieldValues>({
    refineCoreProps: {
      resource: 'settings',
      id: '',
      action: 'edit',
      //onMutationSuccess: () => show('participants', id || '1'),
      redirect: false,
    },
  })

  const { open } = useNotification()

  const handleSave = async (data: FieldValues) => {
    for (const key of Object.keys(data) as (keyof FieldValues)[]) {
      if (data[key] === '') {
        data[key] = null
      }
    }
    try {
      await axiosInstance.patch('/settings', data)
      open?.({ type: 'success', message: 'Settings updated successfully' })
    } catch (e: any) {
      open?.({ type: 'error', message: `Failed to save: ${e}` })
    }
  }
  const nav = useNavigate()

  const primaryColor = watch('primaryColour')
  const secondaryColor = watch('secondaryColour')

  const isColorOrEmpty = (strColor: string | null) => {
    if (strColor == '' || strColor == null) return true
    const s = new Option().style
    s.color = strColor
    return s.color !== ''
  }

  const [reloader, setReloader] = useState('')

  const uploadLogo = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      await axiosInstance.post('/settings/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      open?.({ type: 'success', message: 'Updated logo' })
      setReloader('#' + Math.random())
    } catch (e: any) {
      open?.({ type: 'error', message: `Failed to update logo: ${e.response.data.details}` })
    }
  }

  return (
    <Container maxWidth="sm" sx={{ ml: 1, mt: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit(handleSave)}
        sx={{ display: 'flex', flexDirection: 'column' }}
        autoComplete="off"
      >
        <Box sx={{ mt: 2 }}>
          <Typography>Logo</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button variant="outlined" component="label" sx={{ mr: 3, height: 40 }}>
              UPLOAD FILE
              <input
                type="file"
                hidden
                accept=".png,.jpg,.jpeg,.tif"
                onChange={(e) => {
                  uploadLogo(e.target.files?.item(0) as File)
                }}
                data-cy="logo-upload"
              />
            </Button>
            <img
              src={import.meta.env.VITE_BACKEND_URL + '/settings/logo' + reloader}
              height={60}
              data-cy="logo-preview"
              id="logo-preview"
            />
          </Box>
        </Box>
        <TextField
          {...register('tcLink', {
            pattern: {
              value:
                /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/, //eslint-disable-line
              message: 'Invalid url, must include http(s)://...',
            },
          })}
          error={!!(errors as any)?.tcLink}
          helperText={(errors as any)?.tcLink?.message}
          margin="normal"
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Terms and Conditions URL'}
          name="tcLink"
          data-cy="tcLink"
        />
        <Typography sx={{ mt: 2 }}>Colour Scheme (User Portal)</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <TextField
            {...register('primaryColour', {
              validate: (val) => {
                if (!isColorOrEmpty(val)) {
                  return 'Invalid colour'
                }
              },
            })}
            error={!!(errors as any)?.primaryColour}
            helperText={(errors as any)?.primaryColour?.message}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            type="text"
            placeholder="#a1b2c3   /  rgb(10, 20, 30)"
            label={'Primary Colour'}
            name="primaryColour"
            data-cy="primaryColour"
            slotProps={{
              input: {
                endAdornment: <Box sx={{ width: 20, height: 20, bgcolor: primaryColor }} />,
              },
            }}
          />
          <TextField
            {...register('secondaryColour', {
              validate: (val) => {
                if (!isColorOrEmpty(val)) {
                  return 'Invalid colour'
                }
              },
            })}
            error={!!(errors as any)?.secondaryColour}
            helperText={(errors as any)?.secondaryColour?.message}
            margin="dense"
            InputLabelProps={{ shrink: true }}
            type="text"
            placeholder="#a1b2c3   /  rgb(10, 20, 30)"
            label={'Secondary Colour'}
            name="secondaryColour"
            data-cy="secondaryColour"
            slotProps={{
              input: {
                endAdornment: <Box sx={{ width: 20, height: 20, bgcolor: secondaryColor }} />,
              },
            }}
          />
        </Box>

        <Box sx={{ display: 'flex' }}>
          <Button
            variant="contained"
            sx={{ mt: 3, mr: 1, flex: 1 }}
            type="submit"
            data-cy="save-button"
          >
            Save
          </Button>
          <Button
            variant="contained"
            color="error"
            sx={{ mt: 3, flex: 1 }}
            onClick={() => {
              nav(0)
            }}
            data-cy="discard-button"
          >
            Discard Changes
          </Button>
        </Box>
      </Box>

      <Box sx={{ height: 300 }} />
    </Container>
  )
}

export default SettingsPage
