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
import { Link, useLocation } from 'react-router'
import { ResetPasswordRequest } from '@common/types/api/users'
import { checkPasswordStrength } from '@common/src/PasswordStrength'
import { apiClient } from '../apiClient'
import { useEffect, useState } from 'react'

interface FormValues {
  newPassword: string
  confirmPassword: string
}

function useQuery() {
  return new URLSearchParams(useLocation().search)
}

export default function ResetPassword() {
  const query = useQuery()
  const token = query.get('token')

  const logoPath = import.meta.env.VITE_BACKEND_URL + '/settings/logo'
  const [logoLoaded, setLogoLoaded] = useState(true)

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<FormValues>()

  const [status, setStatus] = useState<'unsent' | 'pending' | 'error' | 'sent'>('unsent')

  useEffect(() => {
    document.title = 'Reset Password | CTRL'
  }, [])

  if (!token) {
    return (
      <Container>
        <Card sx={{ maxWidth: 400, mr: 'auto', ml: 'auto', mt: 10, p: 2 }}>
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
            <Alert severity="error">
              Missing token. Please check your reset password email link.
            </Alert>
          </Box>
          <Box sx={{ mt: 3 }}>
            <Button data-cy="return-to-login" component={Link} to="/login">
              Back
            </Button>
          </Box>
        </Card>
      </Container>
    )
  }

  const onSubmit = (data: FormValues) => {
    // Set to pending before the request
    setStatus('pending')

    const reqData: ResetPasswordRequest = {
      newPassword: data.newPassword,
      token: token,
    }

    apiClient
      .post('/users/password/reset', reqData)
      .then((res) => {
        if (res.status == 200) {
          // Set to sent on successful response
          setStatus('sent')
        } else {
          // Set to error
          setStatus('error')
          setError('root.serverError', {
            message: `Error: ${JSON.stringify((res as any).message)}`,
          })
        }
      })
      .catch((e) => {
        // Back to unsent if there is an error
        setStatus('error')
        setError('root.serverError', { message: `Error Resetting Password: ${e}` })
      })
  }

  return (
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
            <Typography>Password reset was successful.</Typography>
          </Box>
        ) : status === 'pending' ? (
          <Box
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}
          >
            <CircularProgress />
            <Typography>Resetting password...</Typography>
          </Box>
        ) : status === 'error' ? (
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
            <Alert severity="error">
              Invalid token. Please check your reset password email link.
            </Alert>
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
              <Typography>Please enter and confirm your new password</Typography>
              <TextField
                type="password"
                fullWidth
                label="New password"
                autoComplete="new-password"
                error={Boolean(errors.newPassword)}
                helperText={errors.newPassword?.message}
                data-cy="new-password"
                {...register('newPassword', {
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
                type="password"
                fullWidth
                label="Confirm password"
                autoComplete="new-password"
                error={Boolean(errors.confirmPassword)}
                helperText={errors.confirmPassword?.message}
                data-cy="confirm-password"
                {...register('confirmPassword', {
                  required: 'This field is required',
                  validate: (val: string) => {
                    if (watch('newPassword') != val) {
                      return 'Your passwords do not match'
                    }
                  },
                })}
              />
              {errors.root && <Alert severity="error">{errors.root?.serverError?.message}</Alert>}
            </Box>
            <Button data-cy="reset-password" variant="contained" sx={{ mt: 3 }} type="submit">
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
  )
}
