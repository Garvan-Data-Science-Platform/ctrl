import { Box, Link, Tooltip } from '@mui/material'
import { AuthPage } from '@refinedev/mui'
import { useEffect } from 'react'
import { useAuthStore } from '../../authStore'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SetupResponse } from '@common/types/api/auth'

export const Login = () => {
  const nav = useNavigate()

  const authStore = useAuthStore()
  // eslint-disable-next-line
  const [_, setSearchParams] = useSearchParams()

  useEffect(() => {
    setSearchParams({})
    fetch(import.meta.env.VITE_BACKEND_URL + '/auth/setup', {
      method: 'GET',
    }).then((res) => {
      res.json().then((data: SetupResponse) => {
        if (!data.isSetup) {
          nav('/setup')
        } else {
          authStore.setProviders(data.oidc.filter((val) => val.displayInAdminPortal))
          authStore.setPasswordLoginDisabled(data.disableAdminPasswordLogin)
        }
      })
    })
  }, [])

  return (
    <Box sx={{ height: '90vh' }}>
      <AuthPage
        type="login"
        registerLink={false}
        title="CTRL Admin Portal"
        forgotPasswordLink={
          <Tooltip title="You need to use the CTRL User Portal to reset your password.">
            <Link href="#"> Forgot Password </Link>
          </Tooltip>
        }
        formProps={{
          defaultValues: {
            email: '',
            password: '',
            loginType: 'Password',
          },
        }}
        hideForm={authStore.passwordLoginDisabled}
        providers={authStore.providers.map((provider) => ({
          name: provider.name,
          icon: <img data-cy="oidc-img" src={provider.icon} height="70px" />,
        }))}
      ></AuthPage>
    </Box>
  )
}
