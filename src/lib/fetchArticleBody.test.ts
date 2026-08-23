import { afterEach, describe, expect, it, vi } from 'vitest'
import { ARTICLE_BODY_MAX_BYTES } from '../config/security'
import { fetchArticleBodyHtml } from './fetchArticleBody'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchArticleBodyHtml', () => {
  it('returns same-origin HTML without credentials', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url, init) => {
        expect(init).toMatchObject({
          credentials: 'omit',
          referrerPolicy: 'same-origin',
          redirect: 'error',
        })
        return new Response('<p>Hello</p>', {
          headers: { 'content-type': 'text/html; charset=utf-8' },
        })
      }),
    )

    await expect(fetchArticleBodyHtml('/article-bodies/example.html')).resolves.toBe(
      '<p>Hello</p>',
    )
  })

  it('rejects failures, unexpected content, and oversized responses', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('missing', { status: 404 })))
    await expect(fetchArticleBodyHtml('/missing.html')).rejects.toThrow('http-404')

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { headers: { 'content-type': 'application/json' } })),
    )
    await expect(fetchArticleBodyHtml('/body.json')).rejects.toThrow('content-type')

    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('x', {
            headers: {
              'content-type': 'text/html',
              'content-length': String(ARTICLE_BODY_MAX_BYTES + 1),
            },
          }),
      ),
    )
    await expect(fetchArticleBodyHtml('/large.html')).rejects.toThrow('too-large')
  })

  it('forwards an already-aborted parent signal to fetch', async () => {
    const parent = new AbortController()
    parent.abort()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url, init) => {
        expect(init?.signal?.aborted).toBe(true)
        return new Response('<p>ok</p>', { headers: { 'content-type': 'text/html' } })
      }),
    )

    await fetchArticleBodyHtml('/article-bodies/example.html', parent.signal)
  })
})
