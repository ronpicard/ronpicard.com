import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { primeArticleBody } from './lib/primedArticleBodies'

const rootElement = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// Production pages ship prerendered markup in #root (scripts/prerender.mjs);
// hydrate it. The dev server serves an empty root, so render from scratch.
if (rootElement.firstElementChild) {
  // Hand a prerendered article body back so hydration matches without a refetch.
  const body = rootElement.querySelector<HTMLElement>('.article-prose[data-body-path]')
  if (body?.dataset.bodyPath) primeArticleBody(body.dataset.bodyPath, body.innerHTML)
  hydrateRoot(rootElement, app)
} else {
  createRoot(rootElement).render(app)
}
