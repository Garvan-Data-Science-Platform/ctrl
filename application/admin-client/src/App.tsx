import { Refine, Authenticated } from '@refinedev/core'
import { DevtoolsPanel, DevtoolsProvider } from '@refinedev/devtools'
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar'

import {
  AuthPage,
  ErrorComponent,
  notificationProvider,
  RefineSnackbarProvider,
  ThemedLayoutV2,
  ThemedTitleV2,
} from '@refinedev/mui'

import { dataProvider } from './providers/dataProvider'
import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import { BrowserRouter, Route, Routes, Outlet, Link } from 'react-router-dom'
import routerBindings, {
  NavigateToResource,
  CatchAllNavigate,
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from '@refinedev/react-router-v6'
import { UserList, UserCreate, UserEdit, UserShow } from './pages/users'
import { SurveyList, SurveyEditor } from './pages/surveys'
import { ColorModeContextProvider } from './contexts/color-mode'
import { Header } from './components/header'
import { Login } from './pages/login'
import { authProvider } from './providers/authProvider'
import { ParticipantList, ParticipantShow } from './pages/participants'
import { SurveyImport, IntegrationsHome, ParticipantImport } from './pages/integrations'
import { ResponsesView } from './pages/responses'
import {
  ListAlt,
  Person,
  RecentActors,
  DatasetLinked,
  Settings,
  AdminPanelSettings,
  RestoreFromTrash,
  LibraryBooks,
} from '@mui/icons-material'
import { ParticipantEdit } from './pages/participants/edit'
import { SetupPage } from './pages/setup'
import { AllResponsesView } from './pages/responses/all'
import { FamilyEdit } from './pages/family/edit'
import SettingsPage from './pages/settings'
import { StudyLoader } from './components/StudyLoader'
import StudiesPage from './pages/studies'
import { Callback } from './pages/login/callback'
import OTP from './pages/login/OTP'
import { Box, Typography } from '@mui/material'
import RestorePage from './pages/restore'
import { accessControlProvider } from './providers/accessControlProvider'
import { UpdatePassword } from './pages/password/update'

function App() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <BrowserRouter>
        <RefineKbarProvider>
          <ColorModeContextProvider>
            <CssBaseline />
            <GlobalStyles styles={{ html: { WebkitFontSmoothing: 'auto' } }} />
            <RefineSnackbarProvider>
              <DevtoolsProvider>
                <Refine
                  dataProvider={dataProvider()}
                  notificationProvider={notificationProvider}
                  routerProvider={routerBindings}
                  authProvider={authProvider}
                  accessControlProvider={accessControlProvider}
                  resources={[
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
                      name: 'integrations',
                      list: '/integrations',
                      meta: {
                        label: 'Integrations',
                        icon: <DatasetLinked />,
                        canDelete: true,
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
                      name: 'surveys/responses/all',
                      show: '/responses/all/:id',
                      meta: {
                        canDelete: true,
                      },
                    },
                    {
                      name: 'invites',
                    },
                    {
                      name: 'families',
                    },

                    {
                      name: 'admin',
                      meta: {
                        icon: <AdminPanelSettings />,
                        label: 'Admin Panel',
                      },
                    },
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
                        parent: 'admin',
                      },
                    },
                    {
                      name: 'users/admin',
                    },
                    {
                      name: 'settings',
                      list: '/settings',
                      edit: '/settings',
                      meta: {
                        icon: <Settings />,
                        parent: 'admin',
                      },
                    },
                    {
                      name: 'manage studies',
                      list: '/studies',
                      meta: {
                        icon: <LibraryBooks />,
                        parent: 'admin',
                      },
                    },
                    {
                      name: 'restore',
                      list: '/restore',
                      meta: {
                        icon: <RestoreFromTrash />,
                        parent: 'admin',
                        label: 'Restore',
                      },
                    },
                  ]}
                  options={{
                    syncWithLocation: true,
                    warnWhenUnsavedChanges: false,
                    useNewQueryKeys: true,
                    projectId: 'UqrerM-EBDoyv-UEni4Y',
                    reactQuery: {
                      clientConfig: {
                        defaultOptions: {
                          queries: {
                            retry: (failureCount: number, error: any) => {
                              if (error.status == 401) {
                                return false
                              }
                              return failureCount < 3
                            },
                          },
                        },
                      },
                    },
                  }}
                >
                  <Routes>
                    <Route
                      element={
                        <Authenticated
                          key="authenticated-inner"
                          fallback={<CatchAllNavigate to="/login" />}
                        >
                          <StudyLoader>
                            <ThemedLayoutV2
                              Header={Header}
                              Title={({ collapsed }) => (
                                <ThemedTitleV2 collapsed={collapsed} text="CTRL Admin Portal" />
                              )}
                            >
                              <Outlet />
                            </ThemedLayoutV2>
                          </StudyLoader>
                        </Authenticated>
                      }
                    >
                      <Route index element={<NavigateToResource resource="surveys" />} />

                      <Route path="/users">
                        <Route index element={<UserList />} />
                        <Route path="create" element={<UserCreate />} />
                        <Route path="update/:id" element={<UserEdit />} />
                        <Route path=":id" element={<UserShow />} />
                      </Route>
                      <Route path="/surveys">
                        <Route index element={<SurveyList />} />
                        <Route path="edit/:id" element={<SurveyEditor />} />
                        <Route path=":id" element={<SurveyEditor />} />
                      </Route>
                      <Route path="/participants">
                        <Route index element={<ParticipantList />} />
                        <Route path="edit/:id" element={<ParticipantEdit />} />
                        <Route path="family/edit/:id" element={<FamilyEdit />} />
                        <Route path=":id" element={<ParticipantShow />} />
                      </Route>
                      <Route path="/integrations">
                        <Route index element={<IntegrationsHome />} />
                        <Route path="redcap/survey/import" element={<SurveyImport />} />
                        <Route path="redcap/participant/import" element={<ParticipantImport />} />
                      </Route>
                      <Route path="/responses/all/:id" index element={<AllResponsesView />} />
                      <Route
                        path="/responses/:versionNumber/:id"
                        index
                        element={<ResponsesView />}
                      />
                      <Route path="/settings" index element={<SettingsPage />} />
                      <Route path="/restore" index element={<RestorePage />} />
                      <Route path="/studies" index element={<StudiesPage />} />
                      <Route path="*" element={<ErrorComponent />} />
                    </Route>

                    <Route
                      element={
                        <Authenticated key="authenticated-outer" fallback={<Outlet />}>
                          <NavigateToResource />
                        </Authenticated>
                      }
                    >
                      <Route path="/login/otp" element={<OTP />} />
                      <Route path="/login/callback" element={<Callback />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/setup" element={<SetupPage />} />
                      <Route
                        path="/forgot-password"
                        element={
                          <AuthPage
                            type="forgotPassword"
                            title=""
                            loginLink={
                              <>
                                <Typography variant="caption">
                                  If your email is in our system you will be sent a link to reset
                                  your password. <Link to="/login">Go back</Link>
                                </Typography>
                                <br />
                              </>
                            }
                          />
                        }
                      />
                      <Route path="/update-password" element={<UpdatePassword />} />
                    </Route>
                  </Routes>
                  <RefineKbar />
                  <UnsavedChangesNotifier />
                  <DocumentTitleHandler
                    handler={({ resource }) =>
                      resource ? `${resource.meta?.label} | CTRL Admin Portal` : 'CTRL Admin Portal'
                    }
                  />
                  <Box sx={{ flex: '1 0 auto' }} />
                  <Box
                    component="footer"
                    sx={{
                      p: 3,
                      width: '100%',
                      textAlign: 'center',
                      backgroundColor: 'transparent',
                    }}
                  >
                    <Typography variant="body2">
                      {import.meta.env['VITE_APP_VERSION']} © 2025 Garvan Institute of Medical
                      Research
                    </Typography>
                  </Box>
                </Refine>
                <DevtoolsPanel />
              </DevtoolsProvider>
            </RefineSnackbarProvider>
          </ColorModeContextProvider>
        </RefineKbarProvider>
      </BrowserRouter>
    </Box>
  )
}

export default App
