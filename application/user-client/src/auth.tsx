import React, { createContext, useContext, useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'

const AuthContext = createContext({
  isAuthenticated: true,
  login: (_: string) => {}, // eslint-disable-line
  logout: () => {},
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'))

  const login = (userToken: string) => {
    localStorage.setItem('access_token', userToken)
    setIsAuthenticated(true)
  }
  const logout = () => {
    localStorage.removeItem('access_token')
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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
