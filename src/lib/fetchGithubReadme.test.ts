import { afterEach, describe, expect, it, vi } from 'vitest'
import { README_MAX_BYTES } from '../config/security'
import { fetchGithubReadmeText } from './fetchGithubReadme'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function textResponseWithoutBody(text: string, contentType = 'text/plain'): Response {
  const res = new Response(text, {
    status: 200,
    headers: { 'content-type': contentType },
  })
  Object.defineProperty(res, 'body', { value: null })
  return res
}

describe('fetchGithubReadmeText', () => {
  it('returns text for successful textual responses without a stream body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => textResponseWithoutBody('# Hello', 'text/markdown')),
    )
    await expect(
      fetchGithubReadmeText('https://raw.githubusercontent.com/o/r/main/README.md'),
    ).resolves.toBe('# Hello')
  })

  it('rejects non-ok HTTP and non-textual content types', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 404, headers: { 'content-type': 'text/plain' } })),
    )
    await expect(
      fetchGithubReadmeText('https://raw.githubusercontent.com/o/r/main/README.md'),
    ).rejects.toThrow(/http-404/)

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })),
    )
    await expect(
      fetchGithubReadmeText('https://raw.githubusercontent.com/o/r/main/README.md'),
    ).rejects.toThrow(/content-type/)
  })

  it('rejects bodies larger than README_MAX_BYTES when streaming', async () => {
    const oversized = new Uint8Array(README_MAX_BYTES + 1)
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(oversized)
        controller.close()
      },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(stream, {
            status: 200,
            headers: { 'content-type': 'text/plain' },
          }),
      ),
    )
    await expect(
      fetchGithubReadmeText('https://raw.githubusercontent.com/o/r/main/README.md'),
    ).rejects.toThrow(/too-large/)
  })

  it('combines streamed chunks and accepts an omitted content type', async () => {
    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('# Streamed'))
        controller.enqueue(encoder.encode(' README'))
        controller.close()
      },
    })
    vi.stubGlobal('fetch', vi.fn(async () => new Response(stream, { status: 200 })))

    await expect(
      fetchGithubReadmeText('https://raw.githubusercontent.com/o/r/main/README.md'),
    ).resolves.toBe('# Streamed README')
  })

  it('rejects oversized responses without a stream body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => textResponseWithoutBody('x'.repeat(README_MAX_BYTES + 1))),
    )

    await expect(
      fetchGithubReadmeText('https://raw.githubusercontent.com/o/r/main/README.md'),
    ).rejects.toThrow(/too-large/)
  })

  it('propagates parent cancellation when AbortSignal.any is unavailable', async () => {
    const anyDescriptor = Object.getOwnPropertyDescriptor(AbortSignal, 'any')
    Object.defineProperty(AbortSignal, 'any', { configurable: true, value: undefined })
    const parent = new AbortController()
    let combinedSignal: AbortSignal | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url, init) => {
        combinedSignal = init?.signal ?? undefined
        return textResponseWithoutBody('ok')
      }),
    )

    try {
      await fetchGithubReadmeText(
        'https://raw.githubusercontent.com/o/r/main/README.md',
        parent.signal,
      )
      expect(combinedSignal?.aborted).toBe(false)
      parent.abort()
      expect(combinedSignal?.aborted).toBe(true)
    } finally {
      if (anyDescriptor) Object.defineProperty(AbortSignal, 'any', anyDescriptor)
    }
  })

  it('uses an already-aborted parent signal in the compatibility path', async () => {
    const anyDescriptor = Object.getOwnPropertyDescriptor(AbortSignal, 'any')
    Object.defineProperty(AbortSignal, 'any', { configurable: true, value: undefined })
    const parent = new AbortController()
    parent.abort()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url, init) => {
        expect(init?.signal?.aborted).toBe(true)
        return textResponseWithoutBody('ok')
      }),
    )

    try {
      await fetchGithubReadmeText(
        'https://raw.githubusercontent.com/o/r/main/README.md',
        parent.signal,
      )
    } finally {
      if (anyDescriptor) Object.defineProperty(AbortSignal, 'any', anyDescriptor)
    }
  })

  it('passes credentials omit and no-referrer', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url, init) => {
        expect(init).toMatchObject({
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
          mode: 'cors',
        })
        return textResponseWithoutBody('ok')
      }),
    )
    await expect(
      fetchGithubReadmeText('https://raw.githubusercontent.com/o/r/main/README.md'),
    ).resolves.toBe('ok')
  })
})
