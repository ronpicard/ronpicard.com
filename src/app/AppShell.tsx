import { Suspense, useLayoutEffect } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
  useLocation,
  useNavigationType,
  type RouteObject,
} from 'react-router-dom'
import { AmbientParticles } from '../components/AmbientParticles'
import { ArticlePage } from '../features/articles'
import HomePage from '../pages/HomePage'

/** Router instance type shared by createBrowserRouter/createMemoryRouter. */
export type AppRouter = ReturnType<typeof createMemoryRouter>

function RouteScrollManager() {
  const location = useLocation()
  const navigationType = useNavigationType()

  useLayoutEffect(() => {
    if (navigationType !== 'POP') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }
  }, [location.key, navigationType])

  return null
}

function RouteLayout() {
  return (
    <>
      <RouteScrollManager />
      {/* ArticlePage is a lazy chunk; keep the shell up while it loads. */}
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </>
  )
}

export const routes: RouteObject[] = [
  {
    element: <RouteLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/blog/:slug', element: <ArticlePage /> },
    ],
  },
]

export function routerBasename(): string | undefined {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  return base || undefined
}

type Props = {
  router: AppRouter
  /** Server rendering collects react-helmet-async output here. */
  helmetContext?: object
}

/**
 * Everything shared between the browser app (App.tsx) and the build-time
 * prerender (entry-server.tsx). Both must render identical markup so
 * hydration matches the prerendered HTML.
 */
export function AppShell({ router, helmetContext }: Props) {
  return (
    <HelmetProvider context={helmetContext}>
      <div className="app-content">
        <AmbientParticles />
        <div className="app-content__surface">
          <a className="skip-link" href="#main-content">
            Skip to main content
          </a>
          <RouterProvider router={router} />
        </div>
      </div>
    </HelmetProvider>
  )
}
