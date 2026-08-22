// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DynamicArticleBody } from './DynamicArticleBody'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

async function flushEffects() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('DynamicArticleBody', () => {
  it('shows loading state and then sanitized article HTML', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response('<p>Loaded article</p><script>alert(1)</script>', {
          headers: { 'content-type': 'text/html' },
        }),
      ),
    )

    act(() => {
      root.render(
        <DynamicArticleBody
          bodyPath="article-bodies/example.html"
          fallbackSummary="Summary"
        />,
      )
    })
    expect(container.textContent).toContain('Loading article')

    await flushEffects()

    expect(container.textContent).toContain('Loaded article')
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('.article-prose')).not.toBeNull()
  })

  it('shows the fallback summary when loading fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn(async () => new Response('missing', { status: 404 })))

    act(() => {
      root.render(
        <DynamicArticleBody
          bodyPath="article-bodies/missing.html"
          fallbackSummary="Fallback summary"
        />,
      )
    })
    await flushEffects()

    expect(container.textContent).toContain('Could not load the full article. Fallback summary')
  })

  it('does not request invalid body paths', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    act(() => {
      root.render(<DynamicArticleBody bodyPath="../private.html" fallbackSummary={null} />)
    })
    await flushEffects()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(container.textContent).toContain('Could not load the full article.')
  })
})
