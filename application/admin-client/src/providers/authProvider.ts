import type { AuthProvider } from '@refinedev/core'
import { useAuthStore } from '../authStore'
import { axiosInstance } from './dataProvider'
import { GeneratePasswordResetLinkRequest, ResetPasswordRequest } from '@common/types/api/users'

export const TOKEN_KEY = 'refine-auth'
export const ID_KEY = 'userid'
export const ROLE_KEY = 'userrole'

export const clientType = 'admin-client'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

type OIDCLoginParams = {
  loginType?: undefined
  providerName: string
}
type PasswordLoginParams = {
  loginType: 'Password'
  email: string
  password: string
}
type TokenLoginParams = {
  loginType: 'Token'
  token: string
  id: number
  role: string
}

export type LoginParams = OIDCLoginParams | PasswordLoginParams | TokenLoginParams

export const authProvider: AuthProvider = {
  login: async (params: LoginParams) => {
    if (!params.loginType && 'providerName' in params) {
      // OIDC (Redirects away)
      const providers = useAuthStore.getState().providers
      const match = providers.find((val) => val.name == params.providerName)

      if (match) {
        const { host, clientId, authorizeUrlParams } = match
        const redirectUri = `${window.location.href.split('/login').at(0)}/login/callback`
        const additionalParams = authorizeUrlParams ? '&' + authorizeUrlParams : ''
        window.location.replace(
          `${host}/authorize?state=${params.providerName}&client_id=${clientId}&scope=openid%20email%20profile&response_type=code&redirect_uri=${redirectUri}${additionalParams}`,
        )
      }
      return {
        success: true,
      }
    }

    switch (params.loginType) {
      case 'Token': {
        // This handles the callback from SSO/Auth0 and OTP flows
        localStorage.setItem(TOKEN_KEY, params.token)
        localStorage.setItem(ROLE_KEY, params.role)
        localStorage.setItem(ID_KEY, String(params.id)) // localStorage expects strings

        return {
          success: true,
          redirectTo: '/',
        }
      }

      // EMAIL / PASSWORD CREDENTIALS
      case 'Password': {
        const { email: rawEmail, password: rawPassword } = params
        const email = rawEmail.trim()
        const password = rawPassword.trim()

        const res = await fetch(BACKEND_URL + '/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
          headers: { 'Content-Type': 'application/json', 'x-client-type': clientType },
        })
        const data = await res.json()

        if (res.ok) {
          if (data.otp_token) {
            return {
              success: true,
              redirectTo: `/login/otp?token=${data.otp_token}`,
            }
          } else if (!data.token) throw new Error('No token provided')
          else {
            localStorage.setItem(TOKEN_KEY, data.token)
            localStorage.setItem(ID_KEY, data.id)
            localStorage.setItem(ROLE_KEY, data.role)
            return {
              success: true,
              redirectTo: '/',
            }
          }
        }
        // Handle invalid credentials
        return {
          success: false,
          error: {
            name: 'LoginError',
            message: `Error Logging In: ${JSON.stringify(data.details)}`,
          },
        }
      }

      default:
        return {
          success: false,
          error: {
            name: 'LoginError',
            message: 'Invalid login type',
          },
        }
    }
  },
  logout: async () => {
    localStorage.clear()
    return {
      success: true,
      redirectTo: '/login',
    }
  },
  check: async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      return {
        authenticated: true,
      }
    }

    return {
      authenticated: false,
      redirectTo: '/login',
    }
  },
  getPermissions: async () => null,
  getIdentity: async () => {
    const id = localStorage.getItem(ID_KEY)
    const role = localStorage.getItem(ROLE_KEY)
    if (id !== null) {
      return {
        id: Number(id),
        role,
      }
    }
    return null
  },
  onError: async (error) => {
    if (error?.status === 401) {
      return {
        logout: true,
        error: { name: 'Message', message: 'You have been logged out' },
      }
    }

    return { error }
  },
  forgotPassword: async ({ email }) => {
    const req: GeneratePasswordResetLinkRequest = { email: email.trim() }
    try {
      await axiosInstance.post('/users/password/generate-reset-link', req, {
        headers: { 'Content-Type': 'application/json', 'x-client-type': clientType },
      })
    } catch (e) {
      return {
        success: false,
        error: {
          name: 'Error generating password reset link',
          message: (e as any).message,
        },
      }
    }
    return {
      success: true,
      redirectTo: '/login',
      successNotification: {
        message: 'If your email is in our system you will be sent a link to reset your password.',
      },
    }
  },
  updatePassword: async ({ password: rawPassword, token }) => {
    const password = rawPassword.trim()
    const reqData: ResetPasswordRequest = {
      newPassword: password,
      token: token,
    }
    try {
      await axiosInstance.post('/users/password/reset', reqData)
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || 'An unknown error occurred'
      return {
        success: false,
        error: {
          name: 'Error resetting password',
          message: errorMessage, // Return the message field
        },
      }
    }
    return {
      success: true,
      redirectTo: '/login',
      successNotification: { message: 'Successfully updated password' },
    }
  },
}
