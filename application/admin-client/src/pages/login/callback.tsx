import { Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useParsed } from '@refinedev/core'
import { useLogin } from '../../hooks/useLogin'
import { Link } from 'react-router'

import { axiosInstance } from '@refinedev/simple-rest'
import { useEffect, useState } from 'react'

export const Callback = () => {
  const { params } = useParsed()

  const { mutate: login } = useLogin()

  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    //Promise needed to fix annoying bug caused by React StrictMode (dev only)
    if (!handleCallbackPromise) {
      const { code, state } = params!
      const redirectUri = `${window.location.href.split('/login').at(0)}/login/callback`
      handleCallbackPromise = axiosInstance
        .post(import.meta.env.VITE_BACKEND_URL + '/auth/login/oidc', {
          code,
          provider: state,
          redirect_uri: redirectUri,
        })
        .then((data) => {
          login({
            loginType: 'Token',
            token: data.data.token,
            id: data.data.id,
            role: data.data.role,
          })
        })
        .catch((error) => {
          setErrorMessage(error.response.data.details)
        })
    }
  }, [])

  return (
    <Stack
      gap={3}
      sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}
    >
      {errorMessage ? (
        <>
          <Typography>Error: {errorMessage}</Typography>
          <Button component={Link} to="/">
            Go back
          </Button>
        </>
      ) : (
        <CircularProgress />
      )}
    </Stack>
  )
}

let handleCallbackPromise: Promise<void> | null = null
