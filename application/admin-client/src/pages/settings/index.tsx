import React from 'react'
import { Box, Card, Container, TextField, Typography } from '@mui/material'
import { useForm } from '@refinedev/react-hook-form'

const SettingsPage = () => {
  type FieldValues = {
    firstName: string
  }

  const {
    saveButtonProps,
    refineCore: { formLoading },
    register,
    control,
    formState: { errors },
  } = useForm<any, any, FieldValues>({
    refineCoreProps: {
      resource: 'settings',
      //id,
      action: 'edit',
      //onMutationSuccess: () => show('participants', id || '1'),
      redirect: false,
    },
  })

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Box component="form" sx={{ display: 'flex', flexDirection: 'column' }} autoComplete="off">
        <Typography>SMTP Settings</Typography>
        <Box>
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
            {...register('mailerHost', {})}
            error={!!(errors as any)?.title}
            helperText={(errors as any)?.title?.message}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            type="text"
            label={'SMTP Host'}
            name="mailerHost"
          />
        </Box>
      </Box>
    </Container>
  )
}

export default SettingsPage
