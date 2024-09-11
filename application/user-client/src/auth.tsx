import React, { createContext, useContext, useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'

const AuthContext = createContext({
  isAuthenticated: true,
  login: (token) => {},
  logout: () => {},
})

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState<String | null>('DUMMY_TOKEN')
  const login = (userToken: String) => {
    setToken(userToken)
  }
  const logout = () => {
    setToken(null)
  }
  const isAuthenticated = !!token
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
