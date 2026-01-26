import type { AuthProvider } from '@refinedev/core'
import { useAuthStore } from '../authStore'

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
        const { host, clientId } = match
        const redirectUri = `${window.location.href.split('/login').at(0)}/login/callback`
        window.location.replace(
          `${host}/authorize?state=${params.providerName}&client_id=${clientId}&scope=openid%20email%20profile&response_type=code&redirect_uri=${redirectUri}`,
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
        localStorage.setItem(ID_KEY, params.id.toString()) // localStorage expects strings

        return {
          success: true,
          redirectTo: '/',
        }
      }

      // EMAIL / PASSWORD CREDENTIALS
      case 'Password': {
        const { email, password } = params

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
}
