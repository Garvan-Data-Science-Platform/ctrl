import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { GetUserProfileResponse, UpdateProfileRequest } from '@common/types/api/users'
import ProfileData from '@common/example_responses/getUserProfile.json'
import NavBar from '../components/NavBar'

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

export default function ProfileEdit() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>()
  const nav = useNavigate()
  const queryClient = useQueryClient()

  const { isPending, error, data } = useQuery({
    queryKey: ['profile', 'get'],
    //queryFn: () => fetch('/api/user/profile').then((res) => res.json()) as Promise<UserProfile>,
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 2000))
      return ProfileData as GetUserProfileResponse
    },
  })

  const [isParentOrGuardian, setIsParentOrGuardian] = useState(false)

  useEffect(() => {
    setIsParentOrGuardian(data?.isParentOrGuardian || false)
  }, [data])

  useEffect(() => {
    if (error) setError('root.serverError', error)
  }, [error])

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

    let reqData: UpdateProfileRequest

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

    fetch(import.meta.env.VITE_BACKEND_URL + '/users/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqData),
    })
      .then((res) => {
        if (res.ok) {
          queryClient.invalidateQueries({ queryKey: ['profile'] })
          nav('/profile')
        } else {
          res.json().then((data) => {
            setError('root.serverError', {
              message: `Error Updating Profile: ${JSON.stringify(data.message)}`,
            })
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
                  {...register('dob', { required: true, value: data?.dob })}
                />
                <Typography sx={{ m: 1 }}>
                  Are you registering as a parent, guardian or carer?
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                  <Typography>No</Typography>
                  <Switch
                    checked={isParentOrGuardian}
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
                      key="on_behalf_first"
                      {...register('on_behalf_first', {
                        required: true,
                        value: data?.onBehalfOf?.firstName,
                      })}
                    />
                    <TextField
                      sx={{ m: 1, flexGrow: 1 }}
                      label="Family Name"
                      key="on_behalf_surname"
                      {...register('on_behalf_surname', {
                        required: true,
                        value: data?.onBehalfOf?.lastName,
                      })}
                    />
                    <TextField
                      fullWidth
                      type="date"
                      key="on_behalf_dob"
                      sx={{ m: 1 }}
                      label="Date of Birth"
                      slotProps={{ inputLabel: { shrink: true } }}
                      {...register('on_behalf_dob', {
                        required: true,
                        value: data?.onBehalfOf?.dob,
                      })}
                    />
                  </>
                ) : (
                  <>
                    <Typography sx={{ m: 1, width: '100%', fontWeight: 'bold' }}>
                      Next of Kin
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
                  </>
                )}
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
