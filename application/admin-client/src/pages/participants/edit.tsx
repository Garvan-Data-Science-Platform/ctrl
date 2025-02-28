import { DatePicker } from '@mui/lab'
import { Box, TextField, Typography } from '@mui/material'
import { useNavigation, useParsed } from '@refinedev/core'
import { DateField, Edit } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'
import { Controller } from 'react-hook-form'

export const ParticipantEdit = () => {
  const { id } = useParsed()

  const { show } = useNavigation()

  const {
    saveButtonProps,
    refineCore: { formLoading },
    register,
    control,
    formState: { errors },
  } = useForm({
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
              value={new Date(field.value || null).toISOString().split('T')[0]}
              inputRef={field.ref}
              name="dob"
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
          name="address_line"
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
          name="suburb"
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
          name="state"
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
          name="postcode"
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
          name="preferredContact"
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
          name="nokFirstName"
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
          name="nokLastName"
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
          name="nokEmail"
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
          name="nokMobile"
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
