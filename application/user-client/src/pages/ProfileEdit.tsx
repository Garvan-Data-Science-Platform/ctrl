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
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { GetParticipantProfileResponse, UpdateProfileRequest } from '@common/types/api/users'
import NavBar from '../components/NavBar'
import { apiClient } from '../apiClient'
import { ContactMethod, StateTerritory } from '@common/types/api/users/ParticipantProfile'

interface FormValues {
  firstName: string
  lastName: string
  email: string
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
  const queryClient = useQueryClient()

  const {
    isPending,
    error,
    data: pdata,
  } = useQuery({
    queryKey: ['profile', 'get'],
    queryFn: () =>
      apiClient
        .get('/profiles/current')
        .then((res) => res.data) as Promise<GetParticipantProfileResponse>,
  })
  if (!pdata) return 'Loading'
  const data = pdata.data

  useEffect(() => {
    if (error) setError('root.serverError', error)
  }, [error])

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
        email: data['nok_email'],
        mobile: data['nok_mobile'],
      },
    }

    apiClient
      .patch('/profiles/current', reqData)
      .then((res) => {
        if (res.status == 200) {
          queryClient.invalidateQueries({ queryKey: ['profile'] })
          nav('/profile')
        } else {
          setError('root.serverError', {
            message: `Error Updating Profile: ${JSON.stringify(res.data.message)}`,
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
                  disabled={isPending}
                  {...register('firstName', { required: true, value: data?.firstName })}
                />
                <TextField
                  sx={{ m: 1, flexGrow: 1 }}
                  label="Family Name"
                  {...register('lastName', { required: true, value: data?.lastName })}
                />
                <TextField
                  type="email"
                  fullWidth
                  sx={{ m: 1 }}
                  label="Email"
                  {...register('email', {
                    required: true,
                    value: data?.email,
                  })}
                />

                <TextField
                  fullWidth
                  type="date"
                  sx={{ m: 1 }}
                  label="Date of Birth"
                  slotProps={{ inputLabel: { shrink: true } }}
                  defaultValue={new Date(data.dob).toISOString().split('T')[0]}
                  {...register('dob', { required: true })}
                />

                <TextField
                  sx={{ m: 1, flexGrow: 1 }}
                  label="Address Line"
                  {...register('addressLine', { required: true, value: data.addressLine })}
                />
                <TextField
                  sx={{ m: 1 }}
                  label="Suburb"
                  {...register('suburb', { required: true, value: data.suburb })}
                />
                <FormControl sx={{ m: 1, flexGrow: 1 }}>
                  <InputLabel id="state-select-label">State</InputLabel>
                  <Select
                    labelId="state-select-label"
                    label="State"
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
                  {...register('postcode', { required: true, value: data?.postcode })}
                />
                <TextField
                  sx={{ m: 1, flexGrow: 1 }}
                  label="Mobile"
                  {...register('mobile', { required: true, value: data?.mobile })}
                />
                <FormControl sx={{ m: 1, flexGrow: 1, minWidth: 240 }}>
                  <InputLabel id="pref-select-label">Preferred Contact Method</InputLabel>
                  <Select
                    labelId="pref-select-label"
                    label="Preferred Contact Method"
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
                  {...register('nok_first', {
                    required: true,
                    value: data?.alternativeContact?.firstName,
                  })}
                />
                <TextField
                  sx={{ m: 1, flexGrow: 1 }}
                  label="Family Name"
                  key="nok_surname"
                  {...register('nok_surname', {
                    required: true,
                    value: data?.alternativeContact?.lastName,
                  })}
                />
                <TextField
                  type="email"
                  fullWidth
                  sx={{ m: 1 }}
                  label="Email"
                  key="nok_email"
                  {...register('nok_email', {
                    required: true,
                    value: data?.alternativeContact?.email,
                  })}
                />
                <TextField
                  sx={{ m: 1, flexGrow: 1 }}
                  label="Mobile"
                  {...register('nok_mobile', {
                    value: data?.alternativeContact?.mobile,
                  })}
                />

                {errors.root ? (
                  <Alert sx={{ flexGrow: 1, m: 1 }} severity="error">
                    {errors.root?.serverError?.message}
                  </Alert>
                ) : null}
              </Box>
              <Button variant="contained" sx={{ mt: 3 }} type="submit">
                Update
              </Button>
            </form>
          )}
        </Card>
      </Container>
    </>
  )
}
