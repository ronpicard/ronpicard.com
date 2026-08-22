const DEFAULT_TIMEOUT_MS = 15_000
const DEFAULT_TEXT_MAX_BYTES = 2 * 1024 * 1024
const MAX_REDIRECTS = 5

function contextualError(message, url, cause) {
  return new Error(`${message}: ${url}`, cause ? { cause } : undefined)
}

function validateRequestUrl(rawUrl, validateUrl) {
  let url
  try {
    url = new URL(rawUrl)
  } catch (cause) {
    throw contextualError('Invalid URL', String(rawUrl), cause)
  }
  if (url.username || url.password) {
    throw contextualError('URL credentials are not allowed', url.toString())
  }
  validateUrl?.(url)
  return url
}

async function readBoundedBody(response, maxBytes, url) {
  const contentLength = Number(response.headers.get('content-length'))
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw contextualError(`Response exceeds ${maxBytes} bytes`, url)
  }

  if (!response.body) return new Uint8Array()
  const reader = response.body.getReader()
  const chunks = []
  let totalBytes = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    totalBytes += value.byteLength
    if (totalBytes > maxBytes) {
      await reader.cancel()
      throw contextualError(`Response exceeds ${maxBytes} bytes`, url)
    }
    chunks.push(value)
  }

  const body = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  return body
}

export function requireAllowedHttpsUrl(url, allowedHosts) {
  if (url.username || url.password) {
    throw contextualError('URL credentials are not allowed', url.toString())
  }
  if (url.protocol !== 'https:') {
    throw contextualError('Only HTTPS URLs are allowed', url.toString())
  }
  if (!allowedHosts.has(url.hostname.toLowerCase())) {
    throw contextualError('URL host is not allowed', url.toString())
  }
}

export function parseRonPicardBlogUrl(rawUrl) {
  const url = validateRequestUrl(rawUrl, (candidate) => {
    requireAllowedHttpsUrl(candidate, new Set(['ronpicard.com', 'www.ronpicard.com']))
  })
  if (!/^\/blog\/[a-z0-9][a-z0-9._~-]*\/?$/i.test(url.pathname)) {
    throw contextualError('URL must target one blog slug', url.toString())
  }
  url.hash = ''
  return url
}

export async function fetchBytes(
  rawUrl,
  {
    headers = {},
    maxBytes,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    validateUrl,
    fetchImpl = fetch,
  },
) {
  let currentUrl = validateRequestUrl(rawUrl, validateUrl)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
      let response
      try {
        response = await fetchImpl(currentUrl, {
          headers,
          redirect: 'manual',
          signal: controller.signal,
        })
      } catch (cause) {
        throw contextualError('Request failed', currentUrl.toString(), cause)
      }

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        if (!location) {
          throw contextualError('Redirect is missing a location', currentUrl.toString())
        }
        if (redirectCount === MAX_REDIRECTS) {
          throw contextualError('Too many redirects', currentUrl.toString())
        }
        currentUrl = validateRequestUrl(new URL(location, currentUrl).toString(), validateUrl)
        continue
      }

      if (!response.ok) {
        throw contextualError(
          `Request returned ${response.status} ${response.statusText}`.trim(),
          currentUrl.toString(),
        )
      }

      return {
        body: await readBoundedBody(response, maxBytes, currentUrl.toString()),
        contentType: response.headers.get('content-type') || '',
        finalUrl: currentUrl,
      }
    }
  } finally {
    clearTimeout(timeout)
  }

  throw contextualError('Request did not complete', currentUrl.toString())
}

/** Shared bounded fetch helper for Squarespace mirror scripts. */
export async function fetchText(
  rawUrl,
  {
    headers = { 'user-agent': 'ronpicard.com-mirror/1.0' },
    maxBytes = DEFAULT_TEXT_MAX_BYTES,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    validateUrl,
    fetchImpl,
  } = {},
) {
  const result = await fetchBytes(rawUrl, {
    headers,
    maxBytes,
    timeoutMs,
    validateUrl,
    fetchImpl,
  })
  return new TextDecoder().decode(result.body)
}
