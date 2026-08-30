/**
 * Build-time server entry: scripts/prerender.mjs imports the SSR bundle of
 * this module (vite build --ssr) and injects render()'s appHtml into #root of
 * each prerendered page, so first paint shows real content before the client
 * bundle hydrates it (src/main.tsx). Uses react-dom/static's prerender — the
 * static-generation renderer: it waits for lazy chunks and emits complete
 * inline HTML with no streaming placeholders or inline scripts (which the
 * site CSP would block). The .browser build runs fine on Node and keeps this
 * file free of Node-only types.
 */
import { prerender } from 'react-dom/static.browser'
import { createMemoryRouter } from 'react-router-dom'
import { AppShell, routerBasename, routes } from './app/AppShell'

export type RenderResult = {
  /** Markup for #root — starts at the app shell div, no hoisted head tags. */
  appHtml: string
  /** `<link rel="preload">` tags React hoisted (priority card images) — for <head>. */
  preloadLinks: string
}

const APP_ROOT_MARKER = '<div class="app-content"'
const PRELOAD_LINK_RE = /<link rel="preload"[^>]*\/?>/g

/**
 * Render the app for one URL (waits for lazy chunks). React hoists
 * title/meta/link tags (from Helmet and priority images) to the front of the
 * stream; split them off so #root only receives body markup — the prerender
 * script owns the head tags.
 */
export async function render(url: string): Promise<RenderResult> {
  const router = createMemoryRouter(routes, {
    basename: routerBasename(),
    initialEntries: [url],
  })

  // Above the default progressiveChunkSize (~12KB), React outlines Suspense
  // content into <template> + hidden segments swapped by inline scripts —
  // which the site CSP blocks. A huge chunk size keeps every boundary inline.
  const { prelude } = await prerender(<AppShell router={router} helmetContext={{}} />, {
    progressiveChunkSize: 64 * 1024 * 1024,
  })
  const html = await new Response(prelude).text()

  const appStart = html.indexOf(APP_ROOT_MARKER)
  if (appStart < 0) {
    throw new Error(`entry-server: no app root in render of ${url}`)
  }
  const hoisted = html.slice(0, appStart)
  return {
    appHtml: html.slice(appStart),
    preloadLinks: (hoisted.match(PRELOAD_LINK_RE) || []).join('\n'),
  }
}
