import { createBrowserRouter } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import { ProtectedRoutes } from './auth'

const router = createBrowserRouter([
  {
    element: <ProtectedRoutes />,
    children: [
      {
        path: '/',
        element: <Dashboard />,
      },
      {
        path: '/profile',
        element: <Profile />,
      },
    ],
  },
  {
    path: '/login',
    element: <Dashboard />,
  },
  {
    path: '/register',
    element: <Dashboard />,
  },
])
export default router
