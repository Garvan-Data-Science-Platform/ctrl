import { Link, Tooltip } from '@mui/material'
import { AuthPage } from '@refinedev/mui'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOIDCProviderStore } from '../../oidcProvidersStore'
import { SetupResponse } from '@common/types/api/auth'

export const Login = () => {
  const nav = useNavigate()

  const oidcProviderStore = useOIDCProviderStore()

  useEffect(() => {
    fetch(import.meta.env.VITE_BACKEND_URL + '/auth/setup', {
      method: 'GET',
    }).then((res) => {
      res.json().then((data: SetupResponse) => {
        if (!data.isSetup) {
          nav('/setup')
        } else {
          oidcProviderStore.setProviders(data.oidc)
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
      providers={oidcProviderStore.providers.map((provider) => ({
        name: provider.name,
        icon: <img data-cy="oidc-img" src={provider.icon} height="70px" />,
      }))}
    ></AuthPage>
  )
}
