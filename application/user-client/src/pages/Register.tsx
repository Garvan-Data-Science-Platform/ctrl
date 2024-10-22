import { Alert, Box, Button, Card, Container, Switch, TextField, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { RegisterParticipantRequest, RegisterParticipantResponse } from '@common/types/api/auth'
import { useState } from 'react'

interface FormValues {
  firstName: string
  lastName: string
  email: string
  password: string
  confirm_password: string
  dob: string
  studyID: string
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

  const [isParentOrGuardian, setIsParentOrGuardian] = useState(false)

  const onSubmit = (data: FormValues) => {
    //login('TOKEN')
    //nav('/')

    const partialData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      dob: data.dob,
      studyID: data.studyID,
    }

    let reqData: RegisterParticipantRequest

    if (isParentOrGuardian) {
      reqData = {
        ...partialData,
        isParentOrGuardian,
        onBehalfOf: {
          firstName: data['on_behalf_first'],
          lastName: data['on_behalf_surname'],
          dob: data['on_behalf_dob'],
        },
      }
    } else {
      reqData = {
        ...partialData,
        isParentOrGuardian,
        nextOfKin: {
          firstName: data['nok_first'],
          lastName: data['nok_surname'],
          email: data['nok_email'],
        },
      }
    }

    fetch(import.meta.env.VITE_BACKEND_URL + '/auth/register-participant', {
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
              <img src="./australian-genomics-logo.png" height={40} />
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
                fullWidth
                sx={{ m: 1 }}
                label="Study ID"
                {...register('studyID', { required: true })}
              />

              <Typography sx={{ m: 1 }}>
                Are you registering as a parent, guardian or carer?
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <Typography>No</Typography>
                <Switch
                  value={isParentOrGuardian}
                  onChange={() => {
                    setIsParentOrGuardian(!isParentOrGuardian)
                  }}
                />
                <Typography>Yes</Typography>
              </Box>
              {isParentOrGuardian ? (
                <>
                  <Typography sx={{ m: 1, width: '100%', fontWeight: 'bold' }}>
                    Registering on behalf of:
                  </Typography>
                  <TextField
                    sx={{ m: 1, flexGrow: 1 }}
                    label="First Name"
                    {...register('on_behalf_first', { required: true })}
                  />
                  <TextField
                    sx={{ m: 1, flexGrow: 1 }}
                    label="Family Name"
                    {...register('on_behalf_surname', { required: true })}
                  />
                  <TextField
                    fullWidth
                    type="date"
                    sx={{ m: 1 }}
                    label="Date of Birth"
                    slotProps={{ inputLabel: { shrink: true } }}
                    {...register('on_behalf_dob', { required: true })}
                  />
                </>
              ) : (
                <>
                  <Typography sx={{ m: 1, width: '100%', fontWeight: 'bold' }}>
                    Next of Kin
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
              )}
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
