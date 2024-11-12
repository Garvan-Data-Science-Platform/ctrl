import { Refine, Authenticated } from '@refinedev/core'
import { DevtoolsPanel, DevtoolsProvider } from '@refinedev/devtools'
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar'

import {
  ErrorComponent,
  notificationProvider,
  RefineSnackbarProvider,
  ThemedLayoutV2,
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
import { CategoryList, SurveyEditor } from './pages/surveys'
import { ColorModeContextProvider } from './contexts/color-mode'
import { Header } from './components/header'
import { Login } from './pages/login'
import { Register } from './pages/register'
import { ForgotPassword } from './pages/forgotPassword'
import { authProvider } from './providers/authProvider'

export const API_URL = 'http://localhost:5000'

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
                      canDelete: true,
                    },
                  },
                  {
                    name: 'surveys',
                    list: '/surveys',
                    edit: '/surveys/edit/:id',
                    show: '/surveys/:id',
                    meta: {
                      canDelete: true,
                    },
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
                        <ThemedLayoutV2 Header={Header}>
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
                      <Route index element={<CategoryList />} />
                      <Route path="edit/:id" element={<SurveyEditor />} />
                      <Route path=":id" element={<SurveyEditor />} />
                    </Route>
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
