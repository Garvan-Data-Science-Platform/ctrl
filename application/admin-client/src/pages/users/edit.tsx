import { Box, TextField } from '@mui/material'
import { Edit } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'
import { UpdateUserRequest } from '@common/types/api/users'

export const UserEdit = () => {
  type FieldValues = UpdateUserRequest
  const {
    saveButtonProps,
    refineCore: { formLoading },
    register,
    //control,
    formState: { errors },
  } = useForm<any, any, FieldValues>({})

  return (
    <Edit isLoading={formLoading} saveButtonProps={saveButtonProps}>
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
        {/*
        <Controller
          name="role"
          control={control}
          render={({ field }) => {
            return (
              <TextField select {...field} value={field?.value} label={'Role'} sx={{ mt: 1 }}>
                <MenuItem value="OrganisationAdmin">Admin</MenuItem>
                <MenuItem value="participant">Participant</MenuItem>
              </TextField>
            )
          }}
        />
          */}
      </Box>
    </Edit>
  )
}
