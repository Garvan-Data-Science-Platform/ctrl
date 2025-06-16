import type { AuthProvider } from '@refinedev/core'

export const TOKEN_KEY = 'refine-auth'

export const clientType = 'admin-client'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    if (email && password) {
      const res = await fetch(BACKEND_URL + '/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: { 'Content-Type': 'application/json', 'x-client-type': clientType },
      })
      if (res.ok) {
        const data = await res.json()
        localStorage.setItem(TOKEN_KEY, data.token)
      } else {
        return {
          success: false,
          error: {
            name: 'LoginError',
            message: 'Invalid username or password',
          },
        }
      }
      return {
        success: true,
        redirectTo: '/',
      }
    }

    return {
      success: false,
      error: {
        name: 'LoginError',
        message: 'Invalid username or password',
      },
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
