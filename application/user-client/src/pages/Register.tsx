import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { RegisterParticipantRequest, RegisterParticipantResponse } from '@common/types/api/auth'
import {
  ContactMethod,
  ParticipantType,
  StateTerritory,
} from '@common/types/api/users/ParticipantProfile'

interface FormValues {
  firstName: string
  lastName: string
  email: string
  password: string
  confirm_password: string
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
  on_behalf_first: string
  on_behalf_surname: string
  on_behalf_dob: string
}

export default function Register() {
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<FormValues>()
  const { login } = useAuth()
  const nav = useNavigate()

  const onSubmit = (data: FormValues) => {
    //login('TOKEN')
    //nav('/')

    const reqData: RegisterParticipantRequest = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      dob: data.dob,
      addressLine: data.addressLine,
      suburb: data.suburb,
      state: data.state,
      postcode: data.postcode,
      mobile: data.mobile,
      preferredContact: data.preferredContact,
      participantType: ParticipantType.STANDARD,
      nextOfKin: {
        firstName: data['nok_first'],
        lastName: data['nok_surname'],
        email: data['nok_email'],
      },
    }

    fetch(import.meta.env.VITE_BACKEND_URL + '/auth/register/participant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqData),
    })
      .then((res) => {
        if (res.ok) {
          res.json().then((data: RegisterParticipantResponse) => {
            if (!data.token) throw new Error('No token provided')
            login(data.token)
            nav('/')
          })
        } else {
          res.json().then((data) => {
            setError('root.serverError', {
              message: `Error Logging In: ${JSON.stringify(data.message)}`,
            })
          })
        }
      })
      .catch((e) => {
        setError('root.serverError', { message: `Error Logging In: ${e}` })
      })
  }

  return (
    <>
      <Container>
        <Card sx={{ maxWidth: 500, mr: 'auto', ml: 'auto', mt: 10, p: 2 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ mt: 5, mb: 2 }}>
              <img src="/australian-genomics-logo.png" height={40} />
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
              <TextField
                sx={{ m: 1, flexGrow: 1 }}
                label="First Name"
                {...register('firstName', { required: true })}
              />
              <TextField
                sx={{ m: 1, flexGrow: 1 }}
                label="Family Name"
                {...register('lastName', { required: true })}
              />
              <TextField
                type="email"
                fullWidth
                sx={{ m: 1 }}
                label="Email"
                {...register('email', {
                  required: true,
                })}
              />
              <TextField
                sx={{ m: 1, flexGrow: 1 }}
                type="password"
                label="Password"
                {...register('password', { required: true })}
              />
              <TextField
                sx={{ m: 1, flexGrow: 1 }}
                type="password"
                label="Confirm Password"
                {...register('confirm_password', {
                  required: true,
                  validate: (val: string) => {
                    if (watch('password') != val) {
                      return 'Your passwords do not match'
                    }
                  },
                })}
              />
              <TextField
                fullWidth
                type="date"
                sx={{ m: 1 }}
                label="Date of Birth"
                slotProps={{ inputLabel: { shrink: true } }}
                {...register('dob', { required: true })}
              />
              <TextField
                sx={{ m: 1, flexGrow: 1 }}
                label="Address Line"
                {...register('addressLine', { required: true })}
              />
              <TextField sx={{ m: 1 }} label="Suburb" {...register('suburb', { required: true })} />
              <FormControl sx={{ m: 1, flexGrow: 1 }}>
                <InputLabel id="state-select-label">State</InputLabel>
                <Select
                  labelId="state-select-label"
                  label="State"
                  {...register('state', { required: true })}
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
                {...register('postcode', { required: true })}
              />
              <TextField
                sx={{ m: 1, flexGrow: 1 }}
                label="Mobile"
                {...register('mobile', { required: true })}
              />
              <FormControl sx={{ m: 1, flexGrow: 1, minWidth: 240 }}>
                <InputLabel id="pref-select-label">Preferred Contact Method</InputLabel>
                <Select
                  labelId="pref-select-label"
                  label="Preferred Contact Method"
                  {...register('preferredContact', { required: true })}
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

              <>
                <Typography sx={{ m: 1, width: '100%', fontWeight: 'bold' }}>
                  Alternative Contact
                </Typography>
                <TextField
                  sx={{ m: 1, flexGrow: 1 }}
                  label="First Name"
                  {...register('nok_first', { required: true })}
                />
                <TextField
                  sx={{ m: 1, flexGrow: 1 }}
                  label="Family Name"
                  {...register('nok_surname', { required: true })}
                />
                <TextField
                  type="email"
                  fullWidth
                  sx={{ m: 1 }}
                  label="Email"
                  {...register('nok_email', {
                    required: true,
                  })}
                />
              </>

              {errors.root ? (
                <Alert sx={{ flexGrow: 1, m: 1 }} severity="error">
                  {errors.root?.serverError?.message}
                </Alert>
              ) : null}
            </Box>
            <Button variant="contained" sx={{ mt: 3 }} type="submit">
              Register
            </Button>
          </form>
          <Box sx={{ mt: 3 }}>
            <Button component={Link} to="/login">
              Already registered? Log In
            </Button>
          </Box>
        </Card>
      </Container>
    </>
  )
}
