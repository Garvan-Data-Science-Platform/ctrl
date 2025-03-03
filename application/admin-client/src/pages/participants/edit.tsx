import { Box, TextField, Typography } from '@mui/material'
import { useNavigation, useParsed } from '@refinedev/core'
import { Edit } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'
import { Controller } from 'react-hook-form'
import { UpdateProfileRequest } from '@common/types/api/users/updateProfile'

export const ParticipantEdit = () => {
  const { id } = useParsed()

  const { show } = useNavigation()

  const {
    saveButtonProps,
    refineCore: { formLoading },
    register,
    control,
    formState: { errors },
  } = useForm<any, any, UpdateProfileRequest>({
    refineCoreProps: {
      resource: 'profiles',
      id,
      action: 'edit',
      onMutationSuccess: () => show('participants', id || '1'),
      redirect: false,
    },
  })

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
        />
        <Controller
          name="dob"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <TextField
              error={!!(errors as any)?.title}
              helperText={(errors as any)?.title?.message}
              margin="normal"
              fullWidth
              InputLabelProps={{ shrink: true }}
              type="date"
              label="Date of Birth"
              value={new Date(field.value || 0).toISOString().split('T')[0]}
              inputRef={field.ref}
              onChange={(val) => field.onChange(new Date(val.target.value).toISOString())}
            />
          )}
        ></Controller>
        <TextField
          {...register('addressLine', {
            required: 'This field is required',
          })}
          error={!!(errors as any)?.title}
          helperText={(errors as any)?.title?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Address Line'}
        />
        <TextField
          {...register('suburb', {
            required: 'This field is required',
          })}
          error={!!(errors as any)?.title}
          helperText={(errors as any)?.title?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Suburb'}
        />
        <TextField
          {...register('state', {
            required: 'This field is required',
          })}
          error={!!(errors as any)?.title}
          helperText={(errors as any)?.title?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'State'}
        />
        <TextField
          {...register('postcode', {
            required: 'This field is required',
          })}
          error={!!(errors as any)?.title}
          helperText={(errors as any)?.title?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Postcode'}
        />
        <TextField
          {...register('preferredContact', {
            required: 'This field is required',
          })}
          error={!!(errors as any)?.title}
          helperText={(errors as any)?.title?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Preferred Contact Method'}
        />
        <Typography fontWeight={'bold'}>Alternative Contact</Typography>
        <TextField
          {...register('nextOfKin.firstName', {
            required: 'This field is required',
          })}
          error={!!(errors as any)?.title}
          helperText={(errors as any)?.title?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'First Name'}
        />
        <TextField
          {...register('nextOfKin.lastName', {
            required: 'This field is required',
          })}
          error={!!(errors as any)?.title}
          helperText={(errors as any)?.title?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Last Name'}
        />
        <TextField
          {...register('nextOfKin.email', {
            required: 'This field is required',
          })}
          error={!!(errors as any)?.title}
          helperText={(errors as any)?.title?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Email'}
        />
        <TextField
          {...register('nextOfKin.mobile', {})}
          error={!!(errors as any)?.title}
          helperText={(errors as any)?.title?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Mobile'}
        />
      </Box>
    </Edit>
  )
}
