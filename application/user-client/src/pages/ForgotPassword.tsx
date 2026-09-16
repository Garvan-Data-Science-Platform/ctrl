import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  TextField,
  Typography,
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { apiClient } from '../apiClient'
import { useEffect, useState } from 'react'
import { GeneratePasswordResetLinkRequest } from '@common/types/api/users'

export default function ForgotPassword() {
  const logoPath = import.meta.env.VITE_BACKEND_URL + '/settings/logo'
  const [logoLoaded, setLogoLoaded] = useState(true)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<GeneratePasswordResetLinkRequest>()

  const [status, setStatus] = useState<'unsent' | 'pending' | 'sent'>('unsent')

  useEffect(() => {
    document.title = 'Forgot Password | CTRL'
  }, [])

  const onSubmit = (data: GeneratePasswordResetLinkRequest) => {
    // Set to pending before the request
    setStatus('pending')

    const payload: GeneratePasswordResetLinkRequest = { ...data, email: data.email.trim() }

    apiClient
      .post('/users/password/generate-reset-link', payload, {
        headers: { 'Content-Type': 'application/json', 'x-client-type': 'user-client' },
      })
      .then((res) => {
        if (res.status == 200) {
          // Set to sent on successful response
          setStatus('sent')
        } else {
          // Back to unsent if there is an error
          setStatus('unsent')
          setError('root.serverError', {
            message: `Error: ${JSON.stringify((res as any).message)}`,
          })
        }
      })
      .catch((e) => {
        // Back to unsent if there is an error
        setStatus('unsent')
        setError('root.serverError', { message: `Error Logging In: ${e}` })
      })
  }

  return (
    <>
      <Container>
        <Card sx={{ maxWidth: 400, mr: 'auto', ml: 'auto', mt: 10, p: 2 }}>
          {status === 'sent' ? (
            <Box>
              <Box sx={{ mt: 5, mb: 2 }}>
                {logoLoaded && (
                  <img
                    alt="logo"
                    src={logoPath}
                    height={40}
                    onError={() => setLogoLoaded(false)}
                    onLoad={() => setLogoLoaded(true)}
                  />
                )}
              </Box>
              <Typography>
                If your email is in our system you will be sent a link to reset your password.
              </Typography>
            </Box>
          ) : status === 'pending' ? (
            <Box
              sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ mt: 5, mb: 2 }}>
                  {logoLoaded && (
                    <img
                      alt="logo"
                      src={logoPath}
                      height={40}
                      onError={() => setLogoLoaded(false)}
                      onLoad={() => setLogoLoaded(true)}
                    />
                  )}
                </Box>
                <Typography>
                  Please enter the email address you registered with to receive a link to reset your
                  password.
                </Typography>
                <TextField
                  type="email"
                  fullWidth
                  label="Email"
                  data-cy="email"
                  {...register('email', {
                    required: true,
                  })}
                />
                {errors.root ? (
                  <Alert severity="error">{errors.root?.serverError?.message}</Alert>
                ) : null}
              </Box>
              <Button
                data-cy="request-reset-button"
                variant="contained"
                sx={{ mt: 3 }}
                type="submit"
              >
                Reset Password
              </Button>
            </form>
          )}

          <Box sx={{ mt: 3 }}>
            <Button data-cy="return-to-login" component={Link} to="/login">
              Back
            </Button>
          </Box>
        </Card>
      </Container>
    </>
  )
}
