import { RegisterParticipantResponse } from '@common/types/api/auth'
import { Alert, Box, Button, Card, Container, TextField, Typography } from '@mui/material'
import { useLogin } from '@refinedev/core'
import { useForm } from 'react-hook-form'
import { checkPasswordStrength } from '@common/src/PasswordStrength'
import { PasswordLoginParams } from '../../providers/authProvider'

export const SetupPage = () => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm()

  const { mutate: login } = useLogin<PasswordLoginParams>()

  const onSubmit = (data: any) => {
    fetch(import.meta.env.VITE_BACKEND_URL + '/auth/register/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then((res) => {
        if (res.ok) {
          res.json().then((rdata: RegisterParticipantResponse) => {
            if (!rdata.token) throw new Error('No token provided')
            login({
              loginType: 'Password',
              email: data.email,
              password: data.password,
            })
          })
        } else {
          res.json().then((data) => {
            setError('root.serverError', {
              message: `Error Registering: ${data.message} ${data.details}`,
            })
          })
        }
      })
      .catch((e) => {
        setError('root.serverError', { message: `Error Registering In: ${e}` })
      })
  }
  return (
    <Container>
      <Card
        sx={{
          width: 400,
          mr: 'auto',
          ml: 'auto',
          mt: 10,
          p: 2,
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h4">CTRL Setup</Typography>
        <Typography sx={{ mt: 2, mb: 2, width: 320 }}>
          Welcome to CTRL. To get started, create an admin account below.
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: 320 }}>
            <TextField
              fullWidth
              label="Email"
              data-cy="setup-email"
              error={Boolean(errors.email)}
              helperText={errors.email?.message as any}
              {...register('email', {
                required: true,
                pattern: {
                  value: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, //eslint-disable-line
                  message: 'Enter a valid email',
                },
              })}
            />
            <TextField
              type="password"
              fullWidth
              label="Password"
              data-cy="setup-password"
              error={Boolean(errors.password)}
              helperText={errors.password?.message as any}
              {...register('password', {
                required: true,
                validate: (val) => {
                  const { isValid, fields } = checkPasswordStrength(val)
                  if (!isValid) {
                    return `Invalid password. ${Object.values(fields).map((f) => ' ' + f.message)}`
                  }
                },
              })}
            />
            {errors.root ? (
              <Alert severity="error">{errors.root?.serverError?.message}</Alert>
            ) : null}
          </Box>
          <Button fullWidth data-cy="setup-submit" variant="contained" sx={{ mt: 3 }} type="submit">
            Register Admin
          </Button>
        </form>
      </Card>
    </Container>
  )
}
