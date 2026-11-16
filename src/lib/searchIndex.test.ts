// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SEARCH_INDEX_VERSION } from '../../shared/searchIndex'
import { loadSearchIndex, resetSearchIndexForTests, useSearchIndex } from './searchIndex'

const INDEX = { version: SEARCH_INDEX_VERSION, bodies: { 'article-bodies/a.html': 'iptables' } }

function stubFetch(response: () => Response) {
  const fetchMock = vi.fn(async (_url: string) => response())
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  resetSearchIndexForTests()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('loadSearchIndex', () => {
  it('fetches the index once and reuses it', async () => {
    const fetchMock = stubFetch(() => new Response(JSON.stringify(INDEX)))
    const first = await loadSearchIndex()
    expect(first.get('article-bodies/a.html')).toBe('iptables')
    expect(await loadSearchIndex()).toBe(first)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/search-index.json')
  })

  it('wraps a failure with context and retries on the next call', async () => {
    stubFetch(() => new Response('nope', { status: 404 }))
    const failure = loadSearchIndex()
    await expect(failure).rejects.toThrow('Could not load the article search index')
    await expect(failure.catch((e: Error) => Promise.reject(e.cause))).rejects.toThrow('HTTP 404')
    stubFetch(() => new Response(JSON.stringify(INDEX)))
    expect((await loadSearchIndex()).size).toBe(1)
  })
})

describe('useSearchIndex', () => {
  function Probe({ enabled }: { enabled: boolean }) {
    const index = useSearchIndex(enabled)
    return createElement('p', null, index ? `loaded ${index.size}` : 'none')
  }

  it('loads only once enabled, and logs a failed load', async () => {
    const fetchMock = stubFetch(() => new Response(JSON.stringify(INDEX)))
    const host = document.createElement('div')
    const root = createRoot(host)
    await act(async () => root.render(createElement(Probe, { enabled: false })))
    expect(host.textContent).toBe('none')
    expect(fetchMock).not.toHaveBeenCalled()
    await act(async () => root.render(createElement(Probe, { enabled: true })))
    await vi.waitFor(() => expect(host.textContent).toBe('loaded 1'))
    act(() => root.unmount())

    resetSearchIndexForTests()
    stubFetch(() => new Response('{}'))
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const second = createRoot(document.createElement('div'))
    await act(async () => second.render(createElement(Probe, { enabled: true })))
    await vi.waitFor(() => expect(error).toHaveBeenCalled())
    act(() => second.unmount())
  })
})
