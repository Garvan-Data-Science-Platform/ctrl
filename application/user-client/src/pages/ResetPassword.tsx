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
import { Link, useLocation } from 'react-router-dom'
import { NewPasswordRequest } from '@common/types/api/auth'
import { checkPasswordStrength } from '@common/src/PasswordStrength'
import { apiClient } from '../apiClient'
import { useState } from 'react'

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

  const logoPath = './australian-genomics-logo.png'

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<FormValues>()

  const [status, setStatus] = useState<'unsent' | 'pending' | 'sent'>('unsent')

  if (!token) {
    return (
      <Container>
        <Card sx={{ maxWidth: 400, mr: 'auto', ml: 'auto', mt: 10, p: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ mt: 5, mb: 2 }}>
              <img src={logoPath} height={40} />
            </Box>
            <Alert severity="error">
              Invalid or missing token. Please check your reset password email link.
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
    const reqData: NewPasswordRequest = {
      newPassword: data.newPassword,
      //confirmPassword: data.confirmPassword,
      token: token,
    }

    // Set to pending before the request
    setStatus('pending')

    apiClient
      .post('/users/password/reset', reqData)
      .then((res) => {
        if (res.status) {
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
                <img src={logoPath} height={40} />
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
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ mt: 5, mb: 2 }}>
                  <img src={logoPath} height={40} />
                </Box>
                <Typography>Please enter and confirm your new password</Typography>
                {Object.keys(errors) && <Typography>{}</Typography>}
                <TextField
                  type="password"
                  fullWidth
                  label="New password"
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
                {errors.root ? (
                  <Alert severity="error">{errors.root?.serverError?.message}</Alert>
                ) : null}
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
    </>
  )
}
