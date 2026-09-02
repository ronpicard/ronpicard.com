// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createMemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getArticleTitleList } from '../data/articles'
import { AppShell, routerBasename, routes } from './AppShell'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  // jsdom has no 2d canvas; the ambient rain bails out cleanly on a null context.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.restoreAllMocks()
})

describe('AppShell', () => {
  it('renders the homepage card grid through the shared route table', async () => {
    const router = createMemoryRouter(routes, {
      basename: routerBasename(),
      initialEntries: ['/'],
    })
    await act(async () => {
      root.render(<AppShell router={router} />)
    })
    expect(container.querySelector('.skip-link')).not.toBeNull()
    expect(container.querySelector('.ambient-particles')).not.toBeNull()
    expect(container.querySelectorAll('.project-card').length).toBe(
      getArticleTitleList().length,
    )
  })

  it('scrolls to the top when navigating to an article', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const router = createMemoryRouter(routes, {
      basename: routerBasename(),
      initialEntries: ['/'],
    })
    await act(async () => {
      root.render(<AppShell router={router} />)
    })
    scrollTo.mockClear()

    const first = getArticleTitleList()[0]!
    // Prime the lazy ArticlePage chunk, then let the transition commit.
    await act(async () => {
      await import('../pages/ArticlePage')
    })
    await act(async () => {
      await router.navigate(`/blog/${first.slug}`)
    })
    for (let i = 0; i < 40 && !container.querySelector('.page--article'); i++) {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' })
    expect(container.querySelector('.page--article')).not.toBeNull()
  })
})
