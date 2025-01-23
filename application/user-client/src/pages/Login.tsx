import { Alert, Box, Button, Card, Container, TextField } from '@mui/material'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { LoginRequest, LoginResponse } from '@common/types/api/auth'

export default function Login() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm()
  const { login } = useAuth()
  const nav = useNavigate()

  const onSubmit = (data: unknown) => {
    //login('TOKEN')
    //nav('/')
    console.log('DATA', data)
    fetch(import.meta.env.VITE_BACKEND_URL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data as LoginRequest),
    })
      .then((res) => {
        if (res.ok) {
          res.json().then((data: LoginResponse) => {
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
        <Card sx={{ maxWidth: 400, mr: 'auto', ml: 'auto', mt: 10, p: 2 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ mt: 5, mb: 2 }}>
                <img src="./australian-genomics-logo.png" height={40} />
              </Box>
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
            <Button variant="contained" sx={{ mt: 3 }} type="submit">
              Log In
            </Button>
          </form>
          <Box sx={{ mt: 3 }}>
            <Button component={Link} to="/register">
              Register
            </Button>
            <Button component={Link} to="/forgot" data-cy="forgot">
              Forgot Password
            </Button>
          </Box>
        </Card>
      </Container>
    </>
  )
}
