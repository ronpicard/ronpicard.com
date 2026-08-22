import { useLayoutEffect } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  useLocation,
  useNavigationType,
} from 'react-router-dom'
import { AmbientParticles } from './components/AmbientParticles'
import { ArticlePage } from './features/articles'
import HomePage from './pages/HomePage'

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
      <Outlet />
    </>
  )
}

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
const router = createBrowserRouter(
  [
    {
      element: <RouteLayout />,
      children: [
        { path: '/', element: <HomePage /> },
        { path: '/blog/:slug', element: <ArticlePage /> },
      ],
    },
  ],
  { basename: base || undefined },
)

export default function App() {
  return (
    <HelmetProvider>
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
