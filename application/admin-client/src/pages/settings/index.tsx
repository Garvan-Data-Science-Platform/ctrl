import { Box, Button, Container, TextField, Typography } from '@mui/material'
import { useNotification, useSelect } from '@refinedev/core'
import { useForm } from '@refinedev/react-hook-form'
import { useNavigate } from 'react-router-dom'
import { axiosInstance } from '../../providers/dataProvider'

const SettingsPage = () => {
  type FieldValues = {
    mailerHost: string | null
    mailerPort: string | null
    mailerUser: string | null
    mailerPassword: string | null
    primaryColour: string | null
    secondaryColour: string | null
    redcapURL: string | null
    redcapToken: string | null
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
        <Typography>SMTP Settings</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <TextField
            {...register('mailerHost', {})}
            error={!!(errors as any)?.title}
            helperText={(errors as any)?.title?.message}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            type="text"
            label={'SMTP Host'}
            name="mailerHost"
          />
          <TextField
            {...register('mailerPort', {})}
            error={!!(errors as any)?.title}
            helperText={(errors as any)?.title?.message}
            margin="dense"
            InputLabelProps={{ shrink: true }}
            type="text"
            label={'SMTP Port'}
            name="mailerPort"
          />
          <TextField
            {...register('mailerUser', {})}
            error={!!(errors as any)?.title}
            helperText={(errors as any)?.title?.message}
            margin="dense"
            InputLabelProps={{ shrink: true }}
            type="text"
            label={'SMTP Username'}
            name="mailerUser"
          />
          <TextField
            {...register('mailerPassword', {})}
            error={!!(errors as any)?.title}
            helperText={(errors as any)?.title?.message}
            margin="dense"
            InputLabelProps={{ shrink: true }}
            type="text"
            label={'SMTP Password'}
            name="mailerPassword"
          />
        </Box>
        <Typography sx={{ mt: 2 }}>Colour scheme (User portal)</Typography>
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
            slotProps={{
              input: {
                endAdornment: <Box sx={{ width: 20, height: 20, bgcolor: secondaryColor }} />,
              },
            }}
          />
        </Box>
        <Typography sx={{ mt: 2 }}>Redcap Integration</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <TextField
            {...register('redcapURL', {})}
            error={!!(errors as any)?.title}
            helperText={(errors as any)?.title?.message}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            type="text"
            label={'Redcap API URL'}
            name="redcapURL"
          />
          <TextField
            {...register('redcapToken', {})}
            error={!!(errors as any)?.title}
            helperText={(errors as any)?.title?.message}
            margin="dense"
            InputLabelProps={{ shrink: true }}
            type="text"
            label={'Redcap API Token'}
            name="redcapToken"
          />
        </Box>
        <Box sx={{ display: 'flex' }}>
          <Button variant="contained" sx={{ mt: 3, mr: 1, flex: 1 }} type="submit">
            Save
          </Button>
          <Button
            variant="contained"
            color="error"
            sx={{ mt: 3, flex: 1 }}
            onClick={() => {
              nav(0)
            }}
          >
            Discard Changes
          </Button>
        </Box>
      </Box>
    </Container>
  )
}

export default SettingsPage
