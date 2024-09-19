import { createBrowserRouter } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import { ProtectedRoutes } from './auth'
import UpdateProfile from './pages/UpdateProfile'

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
      {
        path: '/profile/update',
        element: <UpdateProfile />,
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
