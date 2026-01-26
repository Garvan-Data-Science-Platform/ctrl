import React, { createContext, useContext, useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { StudyLoader } from './components/StudyLoader'
import { LoginSuccessResponse } from '@common/types/api/auth'

interface AuthContextType {
  isAuthenticated: boolean
  login: (params: LoginSuccessResponse) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: true,
  login: () => {},
  logout: () => {},
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'))

  const login = (params: LoginSuccessResponse) => {
    localStorage.setItem('access_token', params.token)
    localStorage.setItem('userid', String(params))
    localStorage.setItem('userrole', params.role)
    setIsAuthenticated(true)
  }
  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('userid')
    localStorage.removeItem('userrole')
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
  return isAuthenticated ? (
    <StudyLoader>
      <Outlet />
    </StudyLoader>
  ) : (
    <Navigate to="/login" />
  )
}
