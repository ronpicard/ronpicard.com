import { README_FETCH_TIMEOUT_MS, README_MAX_BYTES } from '../config/security'

function mergeSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  if (typeof AbortSignal.any === 'function') return AbortSignal.any([a, b])
  const ac = new AbortController()
  const onAbort = () => ac.abort()
  if (a.aborted || b.aborted) {
    ac.abort()
    return ac.signal
  }
  a.addEventListener('abort', onAbort)
  b.addEventListener('abort', onAbort)
  return ac.signal
}

function isTextualContentType(ct: string): boolean {
  const t = ct.split(';')[0]?.trim().toLowerCase() ?? ''
  return t === '' || t.startsWith('text/') || t === 'application/octet-stream'
}

/**
 * Browser fetch for raw README markdown with timeout, size cap, and no credentials.
 */
export async function fetchGithubReadmeText(
  rawUrl: string,
  parentSignal?: AbortSignal,
): Promise<string> {
  const timeout = AbortSignal.timeout(README_FETCH_TIMEOUT_MS)
  const signal = parentSignal ? mergeSignals(parentSignal, timeout) : timeout

  const res = await fetch(rawUrl, {
    method: 'GET',
    signal,
    headers: { Accept: 'text/plain, text/markdown, text/*' },
    cache: 'default',
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    mode: 'cors',
    redirect: 'follow',
  })

  if (!res.ok) throw new Error(`http-${res.status}`)

  const ct = res.headers.get('content-type') ?? ''
  if (!isTextualContentType(ct)) throw new Error('content-type')

  const body = res.body
  if (!body) {
    const text = await res.text()
    if (text.length > README_MAX_BYTES) throw new Error('too-large')
    return text
  }

  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue
      total += value.byteLength
      if (total > README_MAX_BYTES) throw new Error('too-large')
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const merged = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    merged.set(c, offset)
    offset += c.byteLength
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(merged)
}
