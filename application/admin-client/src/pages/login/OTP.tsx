import { Box, Button, Card, Container, Stack, Typography } from '@mui/material'
import { Link, useSearchParams } from 'react-router-dom'
import { LoginResponse } from '@common/types/api/auth'
import { FormEvent, useEffect, useState } from 'react'
import { MuiOtpInput } from 'mui-one-time-password-input'
import { useLogin } from '@refinedev/core'

export default function OTP() {
  const { mutate: login } = useLogin()
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')

  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const handleChange = (newValue: string) => {
    setOtp(newValue)
  }

  const clientType = 'admin-client'

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    fetch(import.meta.env.VITE_BACKEND_URL + '/auth/login/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-client-type': clientType },
      body: JSON.stringify({ otp_code: otp, otp_token: token }),
    })
      .then((res) => {
        if (res.ok) {
          res.json().then((data: LoginResponse) => {
            if (!data.token) throw new Error('No token provided')
            login({ loginType: 'Token', token: data.token })
          })
        } else {
          res.json().then((data) => {
            setError(`Error Logging In: ${JSON.stringify(data.details)}`)
          })
        }
      })
      .catch((e) => {
        setError(`Error Logging In: ${e}`)
      })
  }

  useEffect(() => {
    document.title = 'Login | CTRL'
    if (!token) {
      //nav('/login')
    }
  }, [])

  return (
    <>
      <Container>
        <Card sx={{ maxWidth: 400, mr: 'auto', ml: 'auto', mt: 10, p: 2 }}>
          <Stack gap={2} alignItems="center">
            <Typography>
              We have sent a login code to your registered email address. When you have received it,
              enter the code below.
            </Typography>
            <Box component="form" onSubmit={onSubmit}>
              <MuiOtpInput width={300} value={otp} onChange={handleChange} />
              {error && (
                <Typography sx={{ mt: 1 }} color="error">
                  {error}
                </Typography>
              )}
              <Box
                sx={{
                  justifyContent: 'center',
                  display: 'flex',
                }}
              >
                <Button data-cy="login" variant="contained" sx={{ mt: 3 }} type="submit">
                  Log In
                </Button>
                {error && (
                  <Button variant="contained" sx={{ mt: 3, ml: 1 }} component={Link} to="/login">
                    Go back
                  </Button>
                )}
              </Box>
            </Box>
          </Stack>
        </Card>
      </Container>
    </>
  )
}
