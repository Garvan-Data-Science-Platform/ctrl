import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { LoginRequest, LoginResponse, SetupResponse } from '@common/types/api/auth'
import { useEffect, useState } from 'react'
import { useAppStore } from '../store'
import { useQueryClient } from '@tanstack/react-query'
import { OIDCProvider } from '@common/types/oidc'

export default function Login() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm()
  const { login } = useAuth()
  const nav = useNavigate()
  const { reset } = useAppStore()

  const [oidcProviders, setOidcProviders] = useState<OIDCProvider[]>([])

  useEffect(() => {
    fetch(import.meta.env.VITE_BACKEND_URL + '/auth/setup', {
      method: 'GET',
    }).then((res) => {
      res.json().then((data: SetupResponse) => {
        if (!data.isSetup) {
          nav('/setup')
        } else {
          setOidcProviders(data.oidc.filter((val) => val.displayInUserPortal))
        }
      })
    })
  }, [])

  const clientType = 'user-client'

  const queryClient = useQueryClient()

  const onSubmit = (data: unknown) => {
    fetch(import.meta.env.VITE_BACKEND_URL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-client-type': clientType },
      body: JSON.stringify(data as LoginRequest),
    })
      .then((res) => {
        if (res.ok) {
          res.json().then((data: LoginResponse) => {
            if (data.otp_token) {
              nav('/login/otp', { state: data.otp_token })
            } else if (!data.token) throw new Error('No token provided')
            else {
              login(data.token)
              nav('/')
            }
          })
        } else {
          res.json().then((data) => {
            setError('root.serverError', {
              message: `Error Logging In: ${JSON.stringify(data.details)}`,
            })
          })
        }
      })
      .catch((e) => {
        setError('root.serverError', { message: `Error Logging In: ${e}` })
      })
  }

  useEffect(() => {
    document.title = 'Login | CTRL'
    queryClient.clear()
    reset()
  }, [])

  return (
    <>
      <Container>
        <Card sx={{ maxWidth: 400, mr: 'auto', ml: 'auto', mt: 10, p: 2 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ mt: 5, mb: 2 }}>
                <img
                  src={import.meta.env.VITE_BACKEND_URL + '/settings/logo'}
                  height={40}
                  alt="logo"
                />
              </Box>
              {oidcProviders.length > 0 && (
                <>
                  <Typography>Continue with:</Typography>
                  <Stack gap={1}>
                    {oidcProviders.map((val) => {
                      return (
                        <Card
                          key={`oidc_${val.name}`}
                          onClick={() => {
                            window.location.href = `${val.host}/authorize?state=${val.name}&client_id=${val.clientId}&scope=openid%20email%20profile&response_type=code&redirect_uri=${window.location.origin}/login/callback`
                          }}
                          sx={{
                            border: '1px solid lightgrey',
                            p: 1,
                            cursor: 'pointer',
                            ':hover': { backgroundColor: 'rgb(245,245,245)' },
                          }}
                        >
                          <img style={{ objectFit: 'contain' }} height="60" src={val.icon} />
                        </Card>
                      )
                    })}
                  </Stack>
                  <Divider />
                </>
              )}

              <TextField
                type="email"
                fullWidth
                label="Email"
                data-cy="login-email"
                {...register('email', {
                  required: true,
                })}
              />
              <TextField
                type="password"
                fullWidth
                label="Password"
                data-cy="login-password"
                {...register('password', { required: true })}
              />
              {errors.root ? (
                <Alert severity="error">{errors.root?.serverError?.message}</Alert>
              ) : null}
            </Box>
            <Button data-cy="login" variant="contained" sx={{ mt: 3 }} type="submit">
              Log In
            </Button>
          </form>
          <Box sx={{ mt: 3 }}>
            <Button data-cy="forgot-password" component={Link} to="/forgot">
              Forgot Password
            </Button>
          </Box>
        </Card>
      </Container>
    </>
  )
}
