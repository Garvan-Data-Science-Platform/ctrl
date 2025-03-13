import { Alert, Box, Button, Card, Container, TextField, Typography } from '@mui/material'
import { AuthPage } from '@refinedev/mui'
import { useForm } from 'react-hook-form'

export const SetupPage = () => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm()

  const onSubmit = (data: any) => {
    console.log('SUBMITTED', data)
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
          <Button fullWidth data-cy="login" variant="contained" sx={{ mt: 3 }} type="submit">
            Register Admin
          </Button>
        </form>
      </Card>
    </Container>
  )
}
