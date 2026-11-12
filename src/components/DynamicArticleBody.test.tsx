// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { primeArticleBody } from '../lib/primedArticleBodies'
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
  it('renders a primed (prerendered) body at once, sanitized, without fetching', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    primeArticleBody(
      'article-bodies/primed.html',
      '<p>Primed article</p><img src="resources/a.png" alt="A"><script>alert(1)</script>',
    )

    act(() => {
      root.render(
        <DynamicArticleBody bodyPath="article-bodies/primed.html" fallbackSummary="Summary" />,
      )
    })
    expect(container.textContent).toContain('Primed article')
    expect(container.textContent).not.toContain('Loading article')
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/resources/a.png')
    expect(container.querySelector('[data-body-path="article-bodies/primed.html"]')).not.toBeNull()

    await flushEffects()
    expect(fetchMock).not.toHaveBeenCalled()
  })

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

  it('adds a table of contents with reading time to long bodies and jumps to sections in place', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const words = Array.from({ length: 1600 }, () => 'word').join(' ')
    const sections = ['Setup', 'Method', 'Results', 'Takeaways']
    primeArticleBody(
      'article-bodies/long.html',
      sections.map((s) => `<h2 id="evil">${s}</h2><p>${words.slice(0, 2000)}</p>`).join('') + `<p>${words}</p>`,
    )
    act(() => {
      root.render(<DynamicArticleBody bodyPath="article-bodies/long.html" fallbackSummary={null} />)
    })
    const toc = container.querySelector('nav.article-toc')
    expect(toc?.textContent).toContain('On this page')
    expect(toc?.textContent).toMatch(/\d+ min read/)
    const links = [...(toc?.querySelectorAll('a') ?? [])]
    expect(links.map((a) => a.getAttribute('href'))).toEqual(sections.map((s) => `#section-${s.toLowerCase()}`))
    // The sanitizer drops the body's own ids, so only generated ones remain.
    expect(container.querySelector('#evil')).toBeNull()
    expect(container.querySelector('#section-results')?.tagName).toBe('H2')

    const scrolled = vi.fn()
    Element.prototype.scrollIntoView = scrolled
    const replace = vi.spyOn(window.history, 'replaceState')
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    act(() => {
      links[2]!.dispatchEvent(click)
    })
    expect(click.defaultPrevented).toBe(true)
    expect(scrolled).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    expect(replace).toHaveBeenLastCalledWith(window.history.state, '', '#section-results')
  })

  it('leaves short bodies without a table of contents, but still linkable by section', () => {
    primeArticleBody('article-bodies/short.html', '<h2>One</h2><p>Short</p><h2>Two</h2>')
    act(() => {
      root.render(<DynamicArticleBody bodyPath="article-bodies/short.html" fallbackSummary={null} />)
    })
    expect(container.querySelector('nav.article-toc')).toBeNull()
    expect(container.querySelector('h2')?.id).toBe('section-one')
  })
})
