import type { AuthProvider } from '@refinedev/core'
import { useAuthStore } from '../authStore'

export const TOKEN_KEY = 'refine-auth'
export const ID_KEY = 'userid'
export const ROLE_KEY = 'userrole'

export const clientType = 'admin-client'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

type OIDCLoginParams = {
  loginType: 'OIDC'
  providerName: string
}
export type PasswordLoginParams = {
  loginType: 'Password'
  email: string
  password: string
}
type TokenLoginParams = {
  loginType: 'Token'
  token: string
  id: string
  role: string
}

type LoginParams = OIDCLoginParams | PasswordLoginParams | TokenLoginParams

export const authProvider: AuthProvider = {
  login: async (variables: any) => {
    let params = variables

    // Refine's OIDC buttons only send providerName
    if (params.providerName && !params.loginType) {
      params = { ...params, loginType: 'OIDC' }
    }

    const strictParams = params as LoginParams

    switch (strictParams.loginType) {
      case 'Token': {
        // Mode 1: RESUME / CALLBACK
        // This handles the callback from SSO/Auth0 and OTP flows
        localStorage.setItem(TOKEN_KEY, strictParams.token)
        localStorage.setItem(ROLE_KEY, strictParams.role)
        localStorage.setItem(ID_KEY, strictParams.id)

        return {
          success: true,
          redirectTo: '/',
        }
      }

      // Mode 2: EMAIL / PASSWORD CREDENTIALS
      case 'Password': {
        const { email, password } = strictParams

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

      // Mode 3: SSO (Redirects away)
      case 'OIDC': {
        const providers = useAuthStore.getState().providers
        const match = providers.find((val) => val.name == strictParams.providerName)

        if (match) {
          const { host, clientId } = match
          const redirectUri = `${window.location.href.split('/login').at(0)}/login/callback`
          window.location.replace(
            `${host}/authorize?state=${strictParams.providerName}&client_id=${clientId}&scope=openid%20email%20profile&response_type=code&redirect_uri=${redirectUri}`,
          )
        }
        return {
          success: true,
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
