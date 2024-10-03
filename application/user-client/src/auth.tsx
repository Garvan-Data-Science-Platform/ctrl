import React, { createContext, useContext, useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'

const AuthContext = createContext({
  isAuthenticated: true,
  login: (_: string) => {},
  logout: () => {},
  token: null as string | null,
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null)
  const login = (userToken: string) => {
    setToken(userToken)
  }
  const logout = () => {
    setToken(null)
  }

  const isAuthenticated = !!token
  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  )
}
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const ProtectedRoutes = () => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />
}
