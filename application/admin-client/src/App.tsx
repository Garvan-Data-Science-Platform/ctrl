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
import { SurveyList, SurveyEditor } from './pages/surveys'
import { ColorModeContextProvider } from './contexts/color-mode'
import { Header } from './components/header'
import { Login } from './pages/login'
import { ForgotPassword } from './pages/forgotPassword'
import { authProvider } from './providers/authProvider'
import { ParticipantList, ParticipantShow } from './pages/participants'
import { SurveyImport, IntegrationsHome, ParticipantImport } from './pages/integrations'
import { ResponsesView } from './pages/responses'
import { ListAlt, Person, RecentActors, DatasetLinked, Settings } from '@mui/icons-material'
import { ParticipantEdit } from './pages/participants/edit'
import { SetupPage } from './pages/setup'
import { AllResponsesView } from './pages/responses/all'
import { FamilyEdit } from './pages/family/edit'
import SettingsPage from './pages/settings'
import { StudyLoader } from './components/StudyLoader'
import { Callback } from './pages/login/callback'

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
                dataProvider={dataProvider()}
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
                    name: 'users/admin',
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
                    name: 'settings',
                    list: '/settings',
                    edit: '/settings',
                    meta: {
                      icon: <Settings />,
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
                    <Route path="/responses/:id" index element={<ResponsesView />} />
                    <Route path="/settings" index element={<SettingsPage />} />
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>

                  <Route
                    element={
                      <Authenticated key="authenticated-outer" fallback={<Outlet />}>
                        <NavigateToResource />
                      </Authenticated>
                    }
                  >
                    <Route path="/login/callback" element={<Callback />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/setup" element={<SetupPage />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                  </Route>
                </Routes>

                <RefineKbar />
                <UnsavedChangesNotifier />
                <DocumentTitleHandler
                  handler={({ resource }) =>
                    resource ? `${resource.meta?.label} | CTRL Admin Portal` : 'CTRL Admin Portal'
                  }
                />
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
