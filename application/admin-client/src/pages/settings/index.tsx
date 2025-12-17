import { Box, Button, Container, TextField, Tooltip, Typography } from '@mui/material'
import { useNotification } from '@refinedev/core'
import { useForm } from '@refinedev/react-hook-form'
import { useNavigate } from 'react-router-dom'
import { axiosInstance } from '../../providers/dataProvider'
import { Info } from '@mui/icons-material'
import { LogoUploader } from '../../components/LogoUploader'
import { RESOURCES } from '../../constants'

const SettingsPage = () => {
  type FieldValues = {
    logo: string | null
    primaryColour: string | null
    secondaryColour: string | null
    tcLink: string | null
    newsLink: string | null
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    refineCore: { queryResult },
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
  const orgSettingsData = queryResult?.data?.data
  console.log('SETTINGS DATA:', orgSettingsData)

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
        <Box sx={{ mt: 2 }}>
          <Typography>Logo</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LogoUploader
              resource={RESOURCES.SETTINGS}
              url={`/settings/logo`}
              hasLogo={!!orgSettingsData?.logo}
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
        <TextField
          {...register('newsLink', {
            pattern: {
              value:
                /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/, //eslint-disable-line
              message: 'Invalid url, must include http(s)://...',
            },
          })}
          error={!!(errors as any)?.newsLink}
          helperText={(errors as any)?.newsLink?.message}
          margin="normal"
          InputLabelProps={{ shrink: true }}
          type="text"
          label={
            <>
              News Site URL{' '}
              <Tooltip title="Embedded in User Portal 'News' Page">
                <Info sx={{ fontSize: 16 }} />
              </Tooltip>
            </>
          }
          name="newsLink"
          data-cy="newsLink"
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
