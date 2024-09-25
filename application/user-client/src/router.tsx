import { createBrowserRouter } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import { ProtectedRoutes } from './auth'
import UpdateProfile from './pages/UpdateProfile'
import Contact from './pages/Contact'
import MessageSent from './pages/MessageSent'
import News from './pages/News'
import Glossary from './pages/Glossary'

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
      {
        path: '/contact',
        element: <Contact />,
      },
      {
        path: '/message_sent',
        element: <MessageSent />,
      },
      {
        path: '/news',
        element: <News />,
      },
      {
        path: '/glossary',
        element: <Glossary />,
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
