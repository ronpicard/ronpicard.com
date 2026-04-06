import { HelmetProvider } from 'react-helmet-async'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { AmbientParticles } from './components/AmbientParticles'
import ArticlePage from './pages/ArticlePage'
import HomePage from './pages/HomePage'

const router = createHashRouter([
  { path: '/', element: <HomePage /> },
  { path: '/blog/:slug', element: <ArticlePage /> },
])

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
