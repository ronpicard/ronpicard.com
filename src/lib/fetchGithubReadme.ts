import { README_FETCH_TIMEOUT_MS, README_MAX_BYTES } from '../config/security'
import { readBoundedResponseText } from './readBoundedResponseText'

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

  if (!res.ok) throw new Error(`GitHub README request failed (http-${res.status})`)

  const ct = res.headers.get('content-type') ?? ''
  if (!isTextualContentType(ct)) {
    throw new Error(`GitHub README response has an unexpected content type (content-type): ${ct}`)
  }
  return readBoundedResponseText(res, README_MAX_BYTES, 'GitHub README')
}
