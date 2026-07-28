import { Button, CircularProgress, Stack, Typography } from '@mui/material'
import { Link, useNavigate, useSearchParams } from 'react-router'

import { useEffect, useState } from 'react'
import { useAuth } from '../auth'
import { apiClient } from '../apiClient'

export default function Callback() {
  const [errorMessage, setErrorMessage] = useState('')

  const { login } = useAuth()
  const nav = useNavigate()

  const [searchParams] = useSearchParams()
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  useEffect(() => {
    //Promise needed to fix annoying bug caused by React StrictMode (dev only)
    if (!handleCallbackPromise) {
      const redirectUri = `${window.location.href.split('/login').at(0)}/login/callback`
      handleCallbackPromise = apiClient
        .post(import.meta.env.VITE_BACKEND_URL + '/auth/login/oidc', {
          code,
          provider: state,
          redirect_uri: redirectUri,
        })
        .then((data) => {
          login(data.data.token)
          nav('/')
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
