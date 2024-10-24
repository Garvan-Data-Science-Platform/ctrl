import { Box, MenuItem, TextField } from '@mui/material'
import { Create } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'
import { Controller } from 'react-hook-form'

export const UserCreate = () => {
  const {
    saveButtonProps,
    refineCore: { formLoading },
    register,
    control,
    formState: { errors },
  } = useForm({})

  return (
    <Create isLoading={formLoading} saveButtonProps={saveButtonProps}>
      <Box component="form" sx={{ display: 'flex', flexDirection: 'column' }} autoComplete="off">
        <TextField
          {...register('firstName', {
            required: 'This field is required',
          })}
          error={!!(errors as any)?.title}
          helperText={(errors as any)?.title?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'First Name'}
          name="firstName"
        />
        <TextField
          {...register('lastName', {
            required: 'This field is required',
          })}
          error={!!(errors as any)?.title}
          helperText={(errors as any)?.title?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Last Name'}
          name="lastName"
        />
        <TextField
          {...register('email', {
            required: 'This field is required',
          })}
          error={!!(errors as any)?.title}
          helperText={(errors as any)?.title?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Email'}
          name="email"
        />

        <TextField
          {...register('password', {
            required: 'This field is required',
          })}
          error={!!(errors as any)?.title}
          helperText={(errors as any)?.title?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Password'}
          name="password"
        />

        <Controller
          name="role"
          control={control}
          render={({ field }) => {
            return (
              <TextField select {...field} value={field?.value} label={'Role'} sx={{ mt: 1 }}>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="participant">Participant</MenuItem>
              </TextField>
            )
          }}
        />
      </Box>
    </Create>
  )
}
