import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Link as MLink,
} from '@mui/material'
import { useForm, useFieldArray } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth'
import { RegisterParticipantRequest, RegisterParticipantResponse } from '@common/types/api/auth'
import { checkPasswordStrength } from '@common/src/PasswordStrength'
import {
  ContactMethod,
  OnBehalf,
  ParticipantType,
  StateTerritory,
} from '@common/types/api/users/ParticipantProfile'
import { AddCircle, Close } from '@mui/icons-material'
import { useEffect } from 'react'

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
  terms: boolean
}

export default function Register() {
  const { inviteId } = useParams<{ inviteId: string }>()

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

  useEffect(() => {
    document.title = 'Register | CTRL'
  }, [])

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
    fetch(import.meta.env.VITE_BACKEND_URL + `/auth/register/participants/${inviteId}`, {
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
              <img
                src={import.meta.env.VITE_BACKEND_URL + '/settings/logo'}
                height={40}
                alt="logo"
              />
            </Box>
            <Box sx={{ mt: 3 }}>
              <Button component={Link} to="/login">
                Already registered? Log In
              </Button>
            </Box>
            {Object.keys(errors) && <Typography>{}</Typography>}
            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
              <TextField
                sx={{ m: 1, flexGrow: 1 }}
                label="First Name"
                autoComplete="given-name"
                error={Boolean(errors.firstName)}
                helperText={errors.firstName?.message}
                data-cy="reg-first"
                {...register('firstName', { required: 'This field is required' })}
              />
              <TextField
                sx={{ m: 1, flexGrow: 1 }}
                label="Family Name"
                autoComplete="family-name"
                error={Boolean(errors.lastName)}
                helperText={errors.lastName?.message}
                data-cy="reg-last"
                {...register('lastName', { required: 'This field is required' })}
              />
              <TextField
                type="email"
                fullWidth
                sx={{ m: 1 }}
                label="Email"
                autoComplete="email"
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                data-cy="reg-email"
                {...register('email', {
                  required: 'This field is required',
                  pattern: {
                    value: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, //eslint-disable-line
                    message: 'Enter a valid email',
                  },
                })}
              />
              <TextField
                sx={{ m: 1, flexGrow: 1 }}
                type="password"
                label="Password"
                autoComplete="new-password"
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
                data-cy="reg-password"
                {...register('password', {
                  required: 'This field is required',
                  validate: (val) => {
                    const { isValid, fields } = checkPasswordStrength(val)
                    if (!isValid) {
                      return `Invalid password. ${Object.values(fields).map((f) => ' ' + f.message)}`
                    }
                  },
                })}
              />
              <TextField
                sx={{ m: 1, flexGrow: 1 }}
                type="password"
                label="Confirm Password"
                autoComplete="new-password"
                error={Boolean(errors.confirm_password)}
                helperText={errors.confirm_password?.message}
                data-cy="reg-confirm-password"
                {...register('confirm_password', {
                  required: 'This field is required',
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
                autoComplete="bday"
                error={Boolean(errors.dob)}
                helperText={errors.dob?.message}
                data-cy="reg-dob"
                slotProps={{ inputLabel: { shrink: true } }}
                {...register('dob', { required: 'This field is required' })}
              />
              <TextField
                sx={{ m: 1, flexGrow: 1 }}
                label="Address Line"
                autoComplete="address-level-3"
                error={Boolean(errors.addressLine)}
                helperText={errors.addressLine?.message}
                data-cy="reg-address-line"
                {...register('addressLine', { required: 'This field is required' })}
              />
              <TextField
                sx={{ m: 1 }}
                label="Suburb"
                data-cy="reg-suburb"
                autoComplete="address-level-2"
                error={Boolean(errors.suburb)}
                helperText={errors.suburb?.message}
                {...register('suburb', { required: 'This field is required' })}
              />
              <FormControl sx={{ m: 1, flexGrow: 1 }}>
                <InputLabel id="state-select-label">State</InputLabel>
                <Select
                  labelId="state-select-label"
                  label="State"
                  error={Boolean(errors.state)}
                  data-cy="reg-state"
                  {...register('state', { required: 'This field is required' })}
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
                autoComplete="postal-code"
                error={Boolean(errors.postcode)}
                helperText={errors.postcode?.message}
                data-cy="reg-postcode"
                {...register('postcode', {
                  required: 'This field is required',
                  pattern: {
                    value: /^\d{4}$/,
                    message: 'Invalid postcode',
                  },
                })}
              />
              <TextField
                sx={{ m: 1, flexGrow: 1 }}
                label="Mobile"
                autoComplete="mobile tel"
                error={Boolean(errors.mobile)}
                helperText={errors.mobile?.message}
                data-cy="reg-mobile"
                {...register('mobile', {
                  required: 'This field is required',
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
                  data-cy="reg-contact-method"
                  {...register('preferredContact', { required: 'This field is required' })}
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
                  error={Boolean(errors.nok_first)}
                  helperText={errors.nok_first?.message}
                  data-cy="nok-first"
                  {...register('nok_first', { required: 'This field is required' })}
                />
                <TextField
                  sx={{ m: 1, flexGrow: 1 }}
                  label="Family Name"
                  error={Boolean(errors.nok_surname)}
                  helperText={errors.nok_surname?.message}
                  data-cy="nok-surname"
                  {...register('nok_surname', { required: 'This field is required' })}
                />
                <TextField
                  type="email"
                  fullWidth
                  sx={{ m: 1 }}
                  label="Email"
                  error={Boolean(errors.nok_email)}
                  helperText={errors.nok_email?.message}
                  data-cy="nok-email"
                  {...register('nok_email', {
                    required: 'This field is required',
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
                        data-cy="dep-delete"
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
                      data-cy="dep-first"
                      error={Boolean(errors.dependents && errors.dependents[idx]?.firstName)}
                      helperText={errors.dependents && errors.dependents[idx]?.firstName?.message}
                      {...register(`dependents.${idx}.firstName`, {
                        required: 'This field is required',
                      })}
                    />
                    <TextField
                      sx={{ m: 1, flexGrow: 1 }}
                      label="Family Name"
                      error={Boolean(errors.dependents && errors.dependents[idx]?.lastName)}
                      helperText={errors.dependents && errors.dependents[idx]?.lastName?.message}
                      data-cy="dep-surname"
                      {...register(`dependents.${idx}.lastName`, {
                        required: 'This field is required',
                      })}
                    />
                    <TextField
                      type="date"
                      fullWidth
                      sx={{ m: 1 }}
                      label="Date of Birth"
                      error={Boolean(errors.dependents && errors.dependents[idx]?.dob)}
                      helperText={errors.dependents && errors.dependents[idx]?.dob?.message}
                      data-cy="dep-dob"
                      {...register(`dependents.${idx}.dob`, { required: 'This field is required' })}
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
                      <Typography>
                        This child may not be able to provide consent themselves when they reach 18
                      </Typography>
                      <Checkbox
                        defaultChecked={false}
                        {...register(`dependents.${idx}.permanent`)}
                      />
                    </Box>
                  </Box>
                ))}

                {fields.length > 0 && (
                  <Typography variant="body2" sx={{ mt: 3 }}>
                    Note: dependent consent is based on the consent of all guardians in the family.{' '}
                    <MLink
                      target="_blank"
                      href="https://garvan-data-science-platform.github.io/ctrl-docs/docs/families"
                    >
                      Click here to learn more.
                    </MLink>
                  </Typography>
                )}

                <Button
                  sx={{ ml: 'auto', mr: 'auto', mt: 2, mb: 2 }}
                  startIcon={<AddCircle />}
                  data-cy="add-dependent"
                  onClick={() => append({ firstName: '', lastName: '', dob: '', permanent: false })}
                >
                  Add Dependent
                </Button>
              </>
            </Box>
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
              <FormControl error={Boolean(errors.terms)}>
                <FormControlLabel
                  control={
                    <Checkbox
                      data-cy="terms"
                      defaultChecked={false}
                      {...register('terms', { required: true })}
                    />
                  }
                  label={
                    <Typography>
                      I agree to the{' '}
                      <a target="_blank" href={import.meta.env.VITE_BACKEND_URL + '/auth/tcs'}>
                        CTRL Terms and Conditions
                      </a>
                    </Typography>
                  }
                />
                {errors.terms && (
                  <FormHelperText>You must check this box to register</FormHelperText>
                )}
              </FormControl>
            </Box>
            {errors.root ? (
              <Alert sx={{ flexGrow: 1, m: 1 }} severity="error">
                {errors.root?.serverError?.message}
              </Alert>
            ) : null}
            <Button variant="contained" sx={{ mt: 3 }} type="submit" data-cy="reg-button">
              Register
            </Button>
          </form>
        </Card>
      </Container>
    </>
  )
}
