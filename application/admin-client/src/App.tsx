import { Refine, GitHubBanner, Authenticated } from '@refinedev/core'
import { DevtoolsPanel, DevtoolsProvider } from '@refinedev/devtools'
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar'

import {
  ErrorComponent,
  notificationProvider,
  RefineSnackbarProvider,
  ThemedLayoutV2,
} from '@refinedev/mui'

import dataProvider from '@refinedev/simple-rest'
import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import { BrowserRouter, Route, Routes, Outlet } from 'react-router-dom'
import routerBindings, {
  NavigateToResource,
  CatchAllNavigate,
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from '@refinedev/react-router-v6'
import { BlogPostList, BlogPostCreate, BlogPostEdit, BlogPostShow } from './pages/blog-posts'
import { CategoryList, CategoryCreate, CategoryEdit, CategoryShow } from './pages/categories'
import { ColorModeContextProvider } from './contexts/color-mode'
import { Header } from './components/header'
import { Login } from './pages/login'
import { Register } from './pages/register'
import { ForgotPassword } from './pages/forgotPassword'
import { authProvider } from './authProvider'

function App() {
  return (
    <BrowserRouter>
      <GitHubBanner />
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <CssBaseline />
          <GlobalStyles styles={{ html: { WebkitFontSmoothing: 'auto' } }} />
          <RefineSnackbarProvider>
            <DevtoolsProvider>
              <Refine
                dataProvider={dataProvider('http://localhost:5000')}
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
                    name: 'organisations',
                    list: '/organisations',
                    create: '/organisations/create',
                    edit: '/organisations/edit/:id',
                    show: '/organisations/:id',
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
                      <Route index element={<BlogPostList />} />
                      <Route path="create" element={<BlogPostCreate />} />
                      <Route path="edit/:id" element={<BlogPostEdit />} />
                      <Route path="show/:id" element={<BlogPostShow />} />
                    </Route>
                    <Route path="/organisations">
                      <Route index element={<CategoryList />} />
                      <Route path="create" element={<CategoryCreate />} />
                      <Route path="edit/:id" element={<CategoryEdit />} />
                      <Route path="show/:id" element={<CategoryShow />} />
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
