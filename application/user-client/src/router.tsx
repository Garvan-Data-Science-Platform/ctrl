import { createBrowserRouter } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import ProfileEdit from './pages/ProfileEdit'
import { ProtectedRoutes } from './auth'
import Contact from './pages/Contact'
import MessageSent from './pages/MessageSent'
import News from './pages/News'
import Glossary from './pages/Glossary'
import ConsentForm from './pages/ConsentForm'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetConfirmation from './pages/ResetConfirmation'

const router = createBrowserRouter([
  {
    element: <ProtectedRoutes />,
    children: [
      {
        path: '/',
        element: <Dashboard />,
      },
      {
        path: '/consent_form/:step',
        element: <ConsentForm />,
      },
      {
        path: '/profile',
        element: <Profile />,
      },
      {
        path: '/profile/update',
        element: <ProfileEdit />,
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
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/forgot',
    element: <ForgotPassword />,
  },
  {
    path: '/reset-confirm',
    element: <ResetConfirmation />,
  },
])
export default router
