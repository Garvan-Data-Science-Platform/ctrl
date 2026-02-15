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
import { ContactMethod, StateTerritory } from '@common/types/api/users/ParticipantProfile'
import { GetParticipantResponse, UpdateParticipantRequest } from '@common/types/api/participants'

export const ParticipantEdit = () => {
  const { id } = useParsed()

  const { show } = useNavigation()

  const {
    saveButtonProps,
    refineCore: { formLoading, onFinish },
    register,
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<GetParticipantResponse, any, UpdateParticipantRequest>({
    refineCoreProps: {
      id,
      action: 'edit',
      onMutationSuccess: () => show('participants', id || '1'),
      redirect: false,
    },
  })
  const handleSubmitCustom = (values: GetParticipantResponse['data']) => {
    const { externalId, profile } = values
    // eslint-disable-next-line
    const { familyId, familyMembers, id, ...rest } = profile
    onFinish({
      externalId: externalId || '',
      profile: rest,
    })
  }

  return (
    <Edit
      isLoading={formLoading}
      saveButtonProps={{ ...saveButtonProps, onClick: handleSubmit(handleSubmitCustom as any) }}
    >
      <Box component="form" sx={{ display: 'flex', flexDirection: 'column' }} autoComplete="off">
        <TextField
          {...register('profile.firstName', {
            required: 'This field is required',
          })}
          error={!!errors.profile?.firstName}
          helperText={errors.profile?.firstName?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'First Name'}
        />
        <TextField
          {...register('profile.lastName', {
            required: 'This field is required',
          })}
          error={!!errors.profile?.lastName}
          helperText={errors.profile?.lastName?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Last Name'}
        />
        <TextField
          {...register('profile.email', {
            required: 'This field is required',
            pattern: {
              value: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, //eslint-disable-line
              message: 'Invalid email',
            },
          })}
          error={!!errors.profile?.email}
          helperText={errors.profile?.email?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Email'}
        />
        <TextField
          {...register('externalId')}
          error={!!errors.externalId}
          helperText={errors.externalId?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'External Id'}
        />
        <Controller
          name="profile.dob"
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
              error={!!errors.profile?.dob}
              helperText={errors.profile?.dob?.message}
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
          {...register('profile.addressLine', {
            required: 'This field is required',
          })}
          error={!!errors.profile?.addressLine}
          helperText={errors.profile?.addressLine?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Address Line'}
        />
        <TextField
          {...register('profile.suburb', {
            required: 'This field is required',
          })}
          error={!!errors.profile?.suburb}
          helperText={errors.profile?.suburb?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Suburb'}
        />
        <Controller
          name="profile.state"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <FormControl>
              <InputLabel id="pref-select-label">State</InputLabel>
              <Select
                labelId="state-select-label"
                label="State"
                error={Boolean(errors.profile?.state)}
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
          {...register('profile.postcode', {
            required: 'This field is required',
            pattern: {
              value: /^\d{4}$/,
              message: 'Invalid postcode',
            },
          })}
          error={!!errors.profile?.postcode}
          helperText={errors.profile?.postcode?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Postcode'}
        />
        <TextField
          {...register('profile.mobile', {
            required: 'This field is required',
            pattern: {
              value: /04\d{8}$/,
              message: 'Invalid mobile number',
            },
          })}
          error={!!errors.profile?.mobile}
          helperText={errors.profile?.mobile?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Mobile Number'}
        />
        <Controller
          name="profile.preferredContact"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <FormControl>
              <InputLabel id="pref-select-label">Preferred Contact Method</InputLabel>
              <Select
                labelId="pref-select-label"
                label="Preferred Contact Method"
                error={Boolean(errors.profile?.preferredContact)}
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
          {...register('profile.nextOfKin.firstName', {
            required: 'This field is required',
          })}
          error={!!errors.profile?.nextOfKin?.firstName}
          helperText={errors.profile?.nextOfKin?.firstName?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'First Name'}
        />
        <TextField
          {...register('profile.nextOfKin.lastName', {
            required: 'This field is required',
          })}
          error={!!errors.profile?.nextOfKin?.lastName}
          helperText={errors.profile?.nextOfKin?.lastName?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Last Name'}
        />
        <TextField
          {...register('profile.nextOfKin.email', {
            required: 'This field is required',
            pattern: {
              value: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, //eslint-disable-line
              message: 'Invalid email',
            },
          })}
          error={!!errors.profile?.nextOfKin?.email}
          helperText={errors.profile?.nextOfKin?.email?.message}
          margin="normal"
          fullWidth
          InputLabelProps={{ shrink: true }}
          type="text"
          label={'Email'}
        />
        <TextField
          {...register('profile.nextOfKin.mobile', {
            pattern: {
              value: /04\d{8}$/,
              message: 'Invalid mobile number',
            },
          })}
          error={!!errors.profile?.nextOfKin?.mobile}
          helperText={errors.profile?.nextOfKin?.mobile?.message}
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
