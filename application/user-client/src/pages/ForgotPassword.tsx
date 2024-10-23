import { Alert, Box, Button, Card, Container, TextField, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { ResetPasswordRequest } from '@common/types/api/auth'

export default function ForgotPassword() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm()
  const nav = useNavigate()

  const onSubmit = (data: unknown) => {
    //login('TOKEN')
    //nav('/')
    console.log('DATA', data)
    fetch(import.meta.env.VITE_BACKEND_URL + '/auth/password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data as ResetPasswordRequest),
    })
      .then((res) => {
        if (res.ok) {
          res.json().then(() => {
            nav('/')
          })
        } else {
          res.json().then((data) => {
            setError('root.serverError', {
              message: `Error: ${JSON.stringify(data.message)}`,
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
        <Card sx={{ maxWidth: 400, mr: 'auto', ml: 'auto', mt: 10, p: 2 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ mt: 5, mb: 2 }}>
                <img src="./australian-genomics-logo.png" height={40} />
              </Box>
              <Typography>
                Please enter the email address you registered with to receive a link to reset your
                password.
              </Typography>
              <TextField
                type="email"
                fullWidth
                label="Email"
                {...register('email', {
                  required: true,
                })}
              />
              {errors.root ? (
                <Alert severity="error">{errors.root?.serverError?.message}</Alert>
              ) : null}
            </Box>
            <Button variant="contained" sx={{ mt: 3 }} type="submit">
              Reset Password
            </Button>
          </form>
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
