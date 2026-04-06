import { HelmetProvider } from 'react-helmet-async'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AmbientParticles } from './components/AmbientParticles'
import ArticlePage from './pages/ArticlePage'
import HomePage from './pages/HomePage'

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
const router = createBrowserRouter(
  [
    { path: '/', element: <HomePage /> },
    { path: '/blog/:slug', element: <ArticlePage /> },
  ],
  { basename: base || undefined },
)

export default function App() {
  return (
    <HelmetProvider>
      <div className="app-content">
        <AmbientParticles />
        <div className="app-content__surface">
          <RouterProvider router={router} />
        </div>
      </div>
    </HelmetProvider>
  )
}
