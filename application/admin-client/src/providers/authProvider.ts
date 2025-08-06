import type { AuthProvider } from '@refinedev/core'
import { useAuthStore } from '../authStore'

export const TOKEN_KEY = 'refine-auth'

export const clientType = 'admin-client'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

export const authProvider: AuthProvider = {
  login: async ({ providerName, email, password, token }) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
      return {
        success: true,
        redirectTo: '/',
      }
    }
    if (email && password) {
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

    const providers = useAuthStore.getState().providers
    const match = providers.find((val) => val.name == providerName)

    if (match) {
      const { host, clientId } = match
      const redirectUri = `${window.location.href.split('/login').at(0)}/login/callback`
      window.location.replace(
        `${host}/authorize?state=${providerName}&client_id=${clientId}&scope=openid%20email%20profile&response_type=code&redirect_uri=${redirectUri}`,
      )
    }
    return {
      success: true,
    }
  },
  logout: async () => {
    localStorage.removeItem(TOKEN_KEY)
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
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      return {
        id: 1,
        name: 'John Doe',
        avatar: 'https://i.pravatar.cc/300',
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
