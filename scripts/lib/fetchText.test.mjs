import { describe, expect, it, vi } from 'vitest'
import {
  fetchBytes,
  fetchText,
  parseRonPicardBlogUrl,
  requireAllowedHttpsUrl,
} from './fetchText.mjs'

const ALLOWED_HOSTS = new Set(['www.ronpicard.com'])
const validateUrl = (url) => requireAllowedHttpsUrl(url, ALLOWED_HOSTS)

describe('parseRonPicardBlogUrl', () => {
  it('requires an exact host and one valid blog slug', () => {
    expect(parseRonPicardBlogUrl('https://www.ronpicard.com/blog/example').pathname).toBe(
      '/blog/example',
    )
    expect(() =>
      parseRonPicardBlogUrl('https://evil.example/?next=ronpicard.com/blog/example'),
    ).toThrow('host is not allowed')
    expect(() => parseRonPicardBlogUrl('http://www.ronpicard.com/blog/example')).toThrow(
      'Only HTTPS',
    )
    expect(() => parseRonPicardBlogUrl('https://user@www.ronpicard.com/blog/example')).toThrow(
      'credentials',
    )
    expect(() => parseRonPicardBlogUrl('https://www.ronpicard.com/blog/../private')).toThrow(
      'one blog slug',
    )
  })
})

describe('fetchBytes', () => {
  it('validates redirect destinations and uses manual redirects', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { location: 'https://www.ronpicard.com/blog/final' },
        }),
      )
      .mockResolvedValueOnce(new Response('done'))

    const result = await fetchBytes('https://www.ronpicard.com/blog/start', {
      maxBytes: 16,
      validateUrl,
      fetchImpl,
    })

    expect(new TextDecoder().decode(result.body)).toBe('done')
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({ redirect: 'manual' })
    expect(fetchImpl.mock.calls[1][0].toString()).toBe('https://www.ronpicard.com/blog/final')
  })

  it('rejects more than five redirects', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: 'https://www.ronpicard.com/blog/next' },
      }),
    )
    await expect(
      fetchBytes('https://www.ronpicard.com/blog/start', {
        maxBytes: 16,
        validateUrl,
        fetchImpl,
      }),
    ).rejects.toThrow('Too many redirects')
    expect(fetchImpl).toHaveBeenCalledTimes(6)
  })

  it('rejects disallowed redirects and oversized streamed responses', async () => {
    const redirectFetch = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: 'https://evil.example/file' },
      }),
    )
    await expect(
      fetchBytes('https://www.ronpicard.com/blog/start', {
        maxBytes: 16,
        validateUrl,
        fetchImpl: redirectFetch,
      }),
    ).rejects.toThrow('host is not allowed')

    const largeFetch = vi.fn().mockResolvedValue(new Response('0123456789'))
    await expect(
      fetchBytes('https://www.ronpicard.com/blog/start', {
        maxBytes: 4,
        validateUrl,
        fetchImpl: largeFetch,
      }),
    ).rejects.toThrow('exceeds 4 bytes')
  })

  it('reports redirect, HTTP, and timeout failures with context', async () => {
    await expect(
      fetchBytes('https://www.ronpicard.com/blog/start', {
        maxBytes: 16,
        validateUrl,
        fetchImpl: vi.fn().mockResolvedValue(new Response(null, { status: 302 })),
      }),
    ).rejects.toThrow('Redirect is missing a location')

    await expect(
      fetchBytes('https://www.ronpicard.com/blog/start', {
        maxBytes: 16,
        validateUrl,
        fetchImpl: vi.fn().mockResolvedValue(new Response('failed', { status: 503 })),
      }),
    ).rejects.toThrow('Request returned 503')

    const timeoutFetch = vi.fn((_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
      }),
    )
    await expect(
      fetchBytes('https://www.ronpicard.com/blog/start', {
        maxBytes: 16,
        timeoutMs: 1,
        validateUrl,
        fetchImpl: timeoutFetch,
      }),
    ).rejects.toThrow('Request failed')
  })
})

describe('fetchText', () => {
  it('decodes a bounded text response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('hello'))
    await expect(
      fetchText('https://www.ronpicard.com/blog/example', {
        maxBytes: 16,
        validateUrl,
        fetchImpl,
      }),
    ).resolves.toBe('hello')
  })
})
