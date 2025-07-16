import { Link, Tooltip } from '@mui/material'
import { AuthPage } from '@refinedev/mui'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../authStore'
import { SetupResponse } from '@common/types/api/auth'

export const Login = () => {
  const nav = useNavigate()

  const authStore = useAuthStore()

  useEffect(() => {
    fetch(import.meta.env.VITE_BACKEND_URL + '/auth/setup', {
      method: 'GET',
    }).then((res) => {
      res.json().then((data: SetupResponse) => {
        if (!data.isSetup) {
          nav('/setup')
        } else {
          authStore.setProviders(data.oidc)
          authStore.setPasswordLoginDisabled(data.disableAdminPasswordLogin)
        }
      })
    })
  }, [])

  return (
    <AuthPage
      type="login"
      registerLink={false}
      title="CTRL Admin Portal"
      forgotPasswordLink={
        <Tooltip title="You need to use the CTRL User Portal to reset your password.">
          <Link href="#"> Forgot Password </Link>
        </Tooltip>
      }
      hideForm={authStore.passwordLoginDisabled}
      providers={authStore.providers.map((provider) => ({
        name: provider.name,
        icon: <img data-cy="oidc-img" src={provider.icon} height="70px" />,
      }))}
    ></AuthPage>
  )
}
