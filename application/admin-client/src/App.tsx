import { Refine, Authenticated } from '@refinedev/core'
import { DevtoolsPanel, DevtoolsProvider } from '@refinedev/devtools'
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar'

import {
  ErrorComponent,
  notificationProvider,
  RefineSnackbarProvider,
  ThemedLayoutV2,
  ThemedTitleV2,
} from '@refinedev/mui'

import { dataProvider } from './providers/dataProvider'
import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import { BrowserRouter, Route, Routes, Outlet } from 'react-router-dom'
import routerBindings, {
  NavigateToResource,
  CatchAllNavigate,
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from '@refinedev/react-router-v6'
import { UserList, UserCreate, UserEdit, UserShow } from './pages/users'
import { SurveyList, SurveyEditor, SurveyImport } from './pages/surveys'
import { ColorModeContextProvider } from './contexts/color-mode'
import { Header } from './components/header'
import { Login } from './pages/login'
import { Register } from './pages/register'
import { ForgotPassword } from './pages/forgotPassword'
import { authProvider } from './providers/authProvider'
import { ParticipantList, ParticipantShow } from './pages/participants'
import { ResponsesView } from './pages/responses'
import { ListAlt, Person, RecentActors } from '@mui/icons-material'
import { ParticipantEdit } from './pages/participants/edit'

export const API_URL = import.meta.env.VITE_BACKEND_URL

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <CssBaseline />
          <GlobalStyles styles={{ html: { WebkitFontSmoothing: 'auto' } }} />
          <RefineSnackbarProvider>
            <DevtoolsProvider>
              <Refine
                dataProvider={dataProvider(API_URL)}
                notificationProvider={notificationProvider}
                routerProvider={routerBindings}
                authProvider={authProvider}
                resources={[
                  {
                    name: 'users',
                    list: '/users',
                    create: '/users/create',
                    edit: '/users/update/:id',
                    show: '/users/:id',
                    meta: {
                      label: 'Admin Users',
                      canDelete: true,
                      icon: <Person />,
                    },
                  },
                  {
                    name: 'surveys',
                    list: '/surveys',
                    edit: '/surveys/edit/:id',
                    show: '/surveys/:id',
                    meta: {
                      canDelete: true,
                      icon: <ListAlt />,
                    },
                  },
                  {
                    name: 'participants',
                    list: '/participants',
                    edit: '/participants/edit/:id',
                    show: '/participants/:id',
                    meta: {
                      canDelete: true,
                      icon: <RecentActors />,
                    },
                  },
                  {
                    name: 'surveys/responses',
                    show: '/responses/:id',
                    meta: {
                      canDelete: true,
                    },
                  },
                  {
                    name: 'invites',
                  },
                ]}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  useNewQueryKeys: true,
                  projectId: 'UqrerM-EBDoyv-UEni4Y',
                }}
              >
                <Routes>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <ThemedLayoutV2
                          Header={Header}
                          Title={({ collapsed }) => (
                            <ThemedTitleV2 collapsed={collapsed} text="CTRL Admin Portal" />
                          )}
                        >
                          <Outlet />
                        </ThemedLayoutV2>
                      </Authenticated>
                    }
                  >
                    <Route index element={<NavigateToResource resource="users" />} />
                    <Route path="/users">
                      <Route index element={<UserList />} />
                      <Route path="create" element={<UserCreate />} />
                      <Route path="update/:id" element={<UserEdit />} />
                      <Route path=":id" element={<UserShow />} />
                    </Route>
                    <Route path="/surveys">
                      <Route index element={<SurveyList />} />
                      <Route path="edit/:id" element={<SurveyEditor />} />
                      <Route path="import" element={<SurveyImport />} />
                      <Route path=":id" element={<SurveyEditor />} />
                    </Route>
                    <Route path="/participants">
                      <Route index element={<ParticipantList />} />
                      <Route path="edit/:id" element={<ParticipantEdit />} />
                      <Route path=":id" element={<ParticipantShow />} />
                    </Route>
                    <Route path="/responses/:id" index element={<ResponsesView />} />
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated key="authenticated-outer" fallback={<Outlet />}>
                        <NavigateToResource />
                      </Authenticated>
                    }
                  >
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                  </Route>
                </Routes>

                <RefineKbar />
                <UnsavedChangesNotifier />
                <DocumentTitleHandler />
              </Refine>
              <DevtoolsPanel />
            </DevtoolsProvider>
          </RefineSnackbarProvider>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  )
}

export default App
