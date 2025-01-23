import { Alert, Box, Button, Card, Container, TextField, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { apiClient } from '../apiClient'
import { useState } from 'react'

interface FormValues {
  email: string
}

export default function ForgotPassword() {
  const logoPath = './australian-genomics-logo.png'

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>()

  const [sent, setSent] = useState(false)

  const onSubmit = (data: FormValues) => {
    apiClient
      .post('/users/password/generate-reset-link', data) // as ResetPasswordRequest?
      .then((res) => {
        if (res.status == 200) {
          setSent(true)
        } else {
          setError('root.serverError', {
            message: `Error: ${JSON.stringify((res as any).message)}`,
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
        <Card sx={{ maxWidth: 400, mr: 'auto', ml: 'auto', mt: 10, p: 2 }}>
          {sent ? (
            <Box>
              <Box sx={{ mt: 5, mb: 2 }}>
                <img src={logoPath} height={40} />
              </Box>
              <Typography>
                If your email is in our system you will be sent a link to reset your password.
              </Typography>
            </Box>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ mt: 5, mb: 2 }}>
                  <img src={logoPath} height={40} />
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
                data-cy="request-reset-button "
                variant="contained"
                sx={{ mt: 3 }}
                type="submit"
              >
                Reset Password
              </Button>
            </form>
          )}
          <Box sx={{ mt: 3 }}>
            <Button component={Link} to="/login">
              Back
            </Button>
          </Box>
        </Card>
      </Container>
    </>
  )
}
