import { createHashRouter, RouterProvider } from 'react-router-dom'
import ArticlePage from './pages/ArticlePage'
import HomePage from './pages/HomePage'

const router = createHashRouter([
  { path: '/', element: <HomePage /> },
  { path: '/blog/:slug', element: <ArticlePage /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
