import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Link as MLink,
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { GetParticipantProfileResponse, UpdateProfileRequest } from '@common/types/api/users'
import NavBar from '../components/NavBar'
import { apiClient } from '../apiClient'
import { ContactMethod, StateTerritory } from '@common/types/api/users/ParticipantProfile'

interface FormValues {
  firstName: string
  lastName: string
  dob: string
  addressLine: string
  suburb: string
  state: StateTerritory
  postcode: string
  mobile: string
  preferredContact: ContactMethod
  nok_first: string
  nok_surname: string
  nok_email: string
  nok_mobile: string
}

export default function ProfileEdit() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>()
  const nav = useNavigate()

  const {
    isPending,
    error,
    data: pdata,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: () =>
      apiClient
        .get('/profiles/current')
        .then((res) => res.data) as Promise<GetParticipantProfileResponse>,
  })

  useEffect(() => {
    if (error) setError('root.serverError', error)
  }, [error])

  useEffect(() => {
    document.title = 'Edit Profile | CTRL'
  }, [])

  if (!pdata) return 'Loading'
  const data = pdata.data

  const onSubmit = (data: FormValues) => {
    //login('TOKEN')
    //nav('/')

    const reqData: UpdateProfileRequest = {
      firstName: data.firstName,
      lastName: data.lastName,
      dob: data.dob,
      mobile: data.mobile,
      addressLine: data.addressLine,
      suburb: data.suburb,
      state: data.state,
      postcode: data.postcode,
      preferredContact: data.preferredContact,
      nextOfKin: {
        firstName: data['nok_first'],
        lastName: data['nok_surname'],
        email: data['nok_email'].trim(),
        mobile: data['nok_mobile'],
      },
    }

    apiClient
      .patch('/profiles/current', reqData)
      .then((res) => {
        if (res.status == 204) {
          nav('/profile')
        } else {
          setError('root.serverError', {
            message: `Error Updating Profile: ${JSON.stringify((res as any).response.data.message)}`,
          })
        }
      })
      .catch((e) => {
        setError('root.serverError', { message: `Error Updating Profile: ${e}` })
      })
  }

  return (
    <>
      <NavBar />
      <Container>
        <Card sx={{ maxWidth: 500, minHeight: 500, mr: 'auto', ml: 'auto', mt: 8, p: 2 }}>
          {isPending ? (
            <CircularProgress sx={{ mt: 10 }} />
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                <TextField
                  sx={{ m: 1, flexGrow: 1 }}
                  label="First Name"
                  defaultValue="."
                  error={Boolean(errors.firstName)}
                  helperText={errors.firstName?.message}
                  data-cy="update-first"
                  disabled={isPending}
                  {...register('firstName', { required: true, value: data?.firstName })}
                />
                <TextField
                  sx={{ m: 1, flexGrow: 1 }}
                  label="Family Name"
                  defaultValue="."
                  error={Boolean(errors.lastName)}
                  helperText={errors.lastName?.message}
                  {...register('lastName', { required: true, value: data?.lastName })}
                />

                <TextField
                  fullWidth
                  type="date"
                  sx={{ m: 1 }}
                  label="Date of Birth"
                  error={Boolean(errors.dob)}
                  helperText={errors.dob?.message}
                  slotProps={{ inputLabel: { shrink: true } }}
                  defaultValue={new Date(data.dob).toISOString().split('T')[0]}
                  {...register('dob', { required: true })}
                />

                <TextField
                  sx={{ m: 1, flexGrow: 1 }}
                  label="Address Line"
                  defaultValue="."
                  error={Boolean(errors.addressLine)}
                  helperText={errors.addressLine?.message}
                  {...register('addressLine', { required: true, value: data.addressLine })}
                />
                <TextField
                  sx={{ m: 1 }}
                  label="Suburb"
                  defaultValue="."
                  error={Boolean(errors.suburb)}
                  helperText={errors.suburb?.message}
                  {...register('suburb', { required: true, value: data.suburb })}
                />
                <FormControl sx={{ m: 1, flexGrow: 1 }}>
                  <InputLabel id="state-select-label">State</InputLabel>
                  <Select
                    labelId="state-select-label"
                    label="State"
                    error={Boolean(errors.state)}
                    defaultValue={data.state}
                    {...register('state', { required: true, value: data.state })}
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

                <TextField
                  sx={{ m: 1, flexGrow: 1 }}
                  label="Postcode"
                  defaultValue="."
                  error={Boolean(errors.postcode)}
                  helperText={errors.postcode?.message}
                  {...register('postcode', {
                    required: true,
                    value: data?.postcode,
                    pattern: {
                      value: /^\d{4}$/,
                      message: 'Invalid postcode',
                    },
                  })}
                />
                <TextField
                  sx={{ m: 1, flexGrow: 1 }}
                  label="Mobile"
                  defaultValue="."
                  error={Boolean(errors.mobile)}
                  helperText={errors.mobile?.message}
                  data-cy="update-mobile"
                  {...register('mobile', {
                    required: true,
                    value: data?.mobile,
                    pattern: {
                      value: /04\d{8}$/,
                      message: 'Invalid mobile number',
                    },
                  })}
                />
                <FormControl sx={{ m: 1, flexGrow: 1, minWidth: 240 }}>
                  <InputLabel id="pref-select-label">Preferred Contact Method</InputLabel>
                  <Select
                    labelId="pref-select-label"
                    label="Preferred Contact Method"
                    error={Boolean(errors.preferredContact)}
                    defaultValue={data.preferredContact}
                    {...register('preferredContact', {
                      required: true,
                      value: data.preferredContact,
                    })}
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

                <Typography sx={{ m: 1, width: '100%', fontWeight: 'bold' }}>
                  Alternative Contact
                </Typography>
                <TextField
                  sx={{ m: 1, flexGrow: 1 }}
                  key="nok_first"
                  label="First Name"
                  defaultValue="."
                  error={Boolean(errors.nok_first)}
                  helperText={errors.nok_first?.message}
                  data-cy="update-nok-first"
                  {...register('nok_first', {
                    required: true,
                    value: data?.nextOfKin?.firstName,
                  })}
                />
                <TextField
                  sx={{ m: 1, flexGrow: 1 }}
                  label="Family Name"
                  defaultValue="."
                  error={Boolean(errors.nok_surname)}
                  helperText={errors.nok_surname?.message}
                  key="nok_surname"
                  {...register('nok_surname', {
                    required: true,
                    value: data?.nextOfKin?.lastName,
                  })}
                />
                <TextField
                  type="email"
                  fullWidth
                  sx={{ m: 1 }}
                  label="Email"
                  defaultValue="."
                  error={Boolean(errors.nok_email)}
                  helperText={errors.nok_email?.message}
                  key="nok_email"
                  {...register('nok_email', {
                    required: true,
                    value: data?.nextOfKin?.email,
                  })}
                />

                <Typography variant="body2" sx={{ mt: 3 }}>
                  Note: If you need to change your email address, please contact a study
                  administrator via the{' '}
                  <MLink component={Link} to="/contact">
                    Contact Us page.
                  </MLink>
                </Typography>

                {errors.root ? (
                  <Alert sx={{ flexGrow: 1, m: 1 }} severity="error">
                    {errors.root?.serverError?.message}
                  </Alert>
                ) : null}
              </Box>
              <Button variant="contained" sx={{ mt: 3 }} type="submit" data-cy="update-button">
                Update
              </Button>
            </form>
          )}
        </Card>
      </Container>
    </>
  )
}
