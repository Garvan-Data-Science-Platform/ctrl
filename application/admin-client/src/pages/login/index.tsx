import { Link, Tooltip } from '@mui/material'
import { AuthPage } from '@refinedev/mui'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export const Login = () => {
  const nav = useNavigate()

  useEffect(() => {
    fetch(import.meta.env.VITE_BACKEND_URL + '/auth/setup', {
      method: 'GET',
    }).then((res) => {
      res.json().then((data) => {
        if (!data.isSetup) {
          nav('/setup')
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
    />
  )
}
