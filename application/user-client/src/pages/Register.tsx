import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { useForm, useFieldArray } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { RegisterParticipantRequest, RegisterParticipantResponse } from '@common/types/api/auth'
import {
  ContactMethod,
  OnBehalf,
  ParticipantType,
  StateTerritory,
} from '@common/types/api/users/ParticipantProfile'
import { AddCircle, Close } from '@mui/icons-material'

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
  dependents: OnBehalf[]
}

export default function Register() {
  const {
    register,
    control,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<FormValues>()

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'dependents',
  })

  const { login } = useAuth()
  const nav = useNavigate()

  const onSubmit = (data: FormValues) => {
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
      dependents: data['dependents'],
    }

    fetch(import.meta.env.VITE_BACKEND_URL + '/auth/register/participant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqData),
    })
      .then((res) => {
        if (res.ok) {
          res.json().then((rdata: RegisterParticipantResponse) => {
            if (!rdata.token) throw new Error('No token provided')
            login(rdata.token)
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
              <>
                <Typography sx={{ m: 1, width: '100%', fontWeight: 'bold' }}>
                  Dependents you are consenting on behalf of:
                </Typography>

                {fields.map((val, idx) => (
                  <Box key={`dep_${val.id}`} sx={{ display: 'flex', flexWrap: 'wrap' }}>
                    <Box
                      sx={{
                        m: 1,
                        mt: 2,
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box sx={{ width: 40 }} />
                      <Typography>Dependent {idx + 1}</Typography>
                      <IconButton
                        onClick={() => {
                          remove(idx)
                        }}
                      >
                        <Close />
                      </IconButton>
                    </Box>

                    <TextField
                      sx={{ m: 1, flexGrow: 1 }}
                      label="First Name"
                      {...register(`dependents.${idx}.firstName`, { required: true })}
                      required
                    />
                    <TextField
                      sx={{ m: 1, flexGrow: 1 }}
                      label="Family Name"
                      {...register(`dependents.${idx}.lastName`, { required: true })}
                      required
                    />
                    <TextField
                      type="date"
                      fullWidth
                      sx={{ m: 1 }}
                      label="Date of Birth"
                      {...register(`dependents.${idx}.dob`, { required: true })}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexGrow: 1,
                        ml: 1,
                      }}
                    >
                      <Typography>This person is permanently incapacitated.</Typography>
                      <Checkbox
                        defaultChecked={false}
                        {...register(`dependents.${idx}.permanent`)}
                      />
                    </Box>
                  </Box>
                ))}

                <Button
                  sx={{ ml: 'auto', mr: 'auto', mt: 2, mb: 2 }}
                  startIcon={<AddCircle />}
                  onClick={() => append({ firstName: '', lastName: '', dob: '', permanent: false })}
                >
                  Add Dependent
                </Button>
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
