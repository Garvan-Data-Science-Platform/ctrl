import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { useNavigation, useParsed } from '@refinedev/core'
import { Edit } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'
import { Controller } from 'react-hook-form'
import { UpdateProfileRequest } from '@common/types/api/users/updateProfile'
import { ContactMethod, StateTerritory } from '@common/types/api/users/ParticipantProfile'

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
          error={!!errors.firstName}
          helperText={errors.firstName?.message}
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
          error={!!errors.lastName}
          helperText={errors.lastName?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Last Name'}
        />
        <TextField
          {...register('email', {
            required: 'This field is required',
            pattern: {
              value: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, //eslint-disable-line
              message: 'Invalid email',
            },
          })}
          error={!!errors.email}
          helperText={errors.email?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Email'}
        />
        <Controller
          name="dob"
          control={control}
          rules={{
            required: true,
            validate: {
              maxDate: (date) => new Date(date || '') <= new Date() || 'Invalid date',
              minDate: (date) => new Date(date || '') > new Date('1900-01-01') || 'Invalid date',
            },
          }}
          render={({ field }) => (
            <TextField
              error={!!errors.dob}
              helperText={errors.dob?.message}
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
        />
        <TextField
          {...register('addressLine', {
            required: 'This field is required',
          })}
          error={!!errors.addressLine}
          helperText={errors.addressLine?.message}
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
          error={!!errors.suburb}
          helperText={errors.suburb?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Suburb'}
        />
        <Controller
          name="state"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <FormControl>
              <InputLabel id="pref-select-label">State</InputLabel>
              <Select
                labelId="state-select-label"
                label="State"
                error={Boolean(errors.state)}
                value={field.value || StateTerritory.NSW}
                onChange={field.onChange}
              >
                {Object.keys(StateTerritory).map((val, idx) => {
                  return (
                    <MenuItem value={val} key={`state_${idx}`}>
                      {val}
                    </MenuItem>
                  )
                })}
              </Select>
            </FormControl>
          )}
        />
        <TextField
          {...register('postcode', {
            required: 'This field is required',
            pattern: {
              value: /^\d{4}$/,
              message: 'Invalid postcode',
            },
          })}
          error={!!errors.postcode}
          helperText={errors.postcode?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Postcode'}
        />
        <TextField
          {...register('mobile', {
            required: 'This field is required',
            pattern: {
              value: /04\d{8}$/,
              message: 'Invalid mobile number',
            },
          })}
          error={!!errors.mobile}
          helperText={errors.mobile?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Mobile Number'}
        />
        <Controller
          name="preferredContact"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <FormControl>
              <InputLabel id="pref-select-label">Preferred Contact Method</InputLabel>
              <Select
                labelId="pref-select-label"
                label="Preferred Contact Method"
                error={Boolean(errors.preferredContact)}
                value={field.value || ContactMethod.EMAIL}
                onChange={field.onChange}
              >
                {Object.keys(ContactMethod).map((val, idx) => {
                  return (
                    <MenuItem value={val} key={`contact_${idx}`}>
                      {val}
                    </MenuItem>
                  )
                })}
              </Select>
            </FormControl>
          )}
        />
        <Typography fontWeight={'bold'} sx={{ mt: 1 }}>
          Alternative Contact
        </Typography>
        <TextField
          {...register('nextOfKin.firstName', {
            required: 'This field is required',
          })}
          error={!!errors.nextOfKin?.firstName}
          helperText={errors.nextOfKin?.firstName?.message}
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
          error={!!errors.nextOfKin?.lastName}
          helperText={errors.nextOfKin?.lastName?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Last Name'}
        />
        <TextField
          {...register('nextOfKin.email', {
            required: 'This field is required',
            pattern: {
              value: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, //eslint-disable-line
              message: 'Invalid email',
            },
          })}
          error={!!errors.nextOfKin?.email}
          helperText={errors.nextOfKin?.email?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Email'}
        />
        <TextField
          {...register('nextOfKin.mobile', {
            pattern: {
              value: /04\d{8}$/,
              message: 'Invalid mobile number',
            },
          })}
          error={!!errors.nextOfKin?.mobile}
          helperText={errors.nextOfKin?.mobile?.message}
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
