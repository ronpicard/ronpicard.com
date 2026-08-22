import { ARTICLE_BODY_FETCH_TIMEOUT_MS, ARTICLE_BODY_MAX_BYTES } from '../config/security'

export async function fetchArticleBodyHtml(
  url: string,
  parentSignal?: AbortSignal,
): Promise<string> {
  const timeout = AbortSignal.timeout(ARTICLE_BODY_FETCH_TIMEOUT_MS)
  const signal = parentSignal ? AbortSignal.any([parentSignal, timeout]) : timeout
  const response = await fetch(url, {
    method: 'GET',
    signal,
    headers: { Accept: 'text/html' },
    cache: 'default',
    credentials: 'omit',
    referrerPolicy: 'same-origin',
    redirect: 'error',
  })

  if (!response.ok) throw new Error(`http-${response.status}`)
  const contentType = response.headers.get('content-type')?.split(';')[0]?.trim() ?? ''
  if (contentType && contentType !== 'text/html') throw new Error('content-type')

  const contentLength = Number(response.headers.get('content-length'))
  if (Number.isFinite(contentLength) && contentLength > ARTICLE_BODY_MAX_BYTES) {
    throw new Error('too-large')
  }

  const html = await response.text()
  if (new TextEncoder().encode(html).byteLength > ARTICLE_BODY_MAX_BYTES) {
    throw new Error('too-large')
  }
  return html
}
