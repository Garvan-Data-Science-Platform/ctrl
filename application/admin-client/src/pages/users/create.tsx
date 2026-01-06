import { Box, MenuItem, TextField } from '@mui/material'
import { useGetIdentity } from '@refinedev/core'
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

  const { data: identity } = useGetIdentity<{ role: string; id: number }>()

  const validateEmail = (email: string) => {
    const r = new RegExp(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/) //eslint-disable-line
    return r.test(email)
  }

  return (
    <Create isLoading={formLoading} saveButtonProps={saveButtonProps}>
      <Box component="form" sx={{ display: 'flex', flexDirection: 'column' }} autoComplete="off">
        <TextField
          {...register('firstName', {
            required: 'This field is required',
          })}
          error={!!(errors as any)?.firstName}
          helperText={(errors as any)?.firstName?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'First Name'}
          data-cy="create-first"
          name="firstName"
        />
        <TextField
          {...register('lastName', {
            required: 'This field is required',
          })}
          error={!!(errors as any)?.lastName}
          helperText={(errors as any)?.lastName?.message}
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
            validate: (email: string) =>
              /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email) || 'Invalid email address',
          })}
          error={!!(errors as any)?.email}
          helperText={(errors as any)?.email?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Email'}
          name="email"
        />
        {
          <Controller
            name="role"
            control={control}
            defaultValue="StudyAdmin"
            render={({ field }) => {
              return (
                <TextField
                  disabled={identity?.role == 'StudyAdmin'}
                  select
                  {...field}
                  value={field?.value}
                  label={'Role'}
                  sx={{ mt: 1 }}
                >
                  <MenuItem value="OrganisationAdmin">Organisation Admin</MenuItem>
                  <MenuItem value="StudyAdmin">Study Admin</MenuItem>
                </TextField>
              )
            }}
          />
        }
      </Box>
    </Create>
  )
}
