import { ARTICLE_BODY_FETCH_TIMEOUT_MS, ARTICLE_BODY_MAX_BYTES } from '../config/security'
import { readBoundedResponseText } from './readBoundedResponseText'

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

  if (!response.ok) throw new Error(`Article body request failed (http-${response.status})`)
  const contentType = response.headers.get('content-type')?.split(';')[0]?.trim() ?? ''
  if (contentType && contentType !== 'text/html') {
    throw new Error(
      `Article body response has an unexpected content type (content-type): ${contentType}`,
    )
  }
  return readBoundedResponseText(response, ARTICLE_BODY_MAX_BYTES, 'Article body')
}
