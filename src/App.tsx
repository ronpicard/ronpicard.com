import { createBrowserRouter } from 'react-router-dom'
import { AppShell, routerBasename, routes } from './app/AppShell'

const router = createBrowserRouter(routes, { basename: routerBasename() })

/**
 * Browser app: the shared AppShell over a browser router. The build-time
 * prerender (entry-server.tsx) renders the same shell over a memory router,
 * so hydration in main.tsx matches the prerendered HTML.
 */
export default function App() {
  return <AppShell router={router} />
}
