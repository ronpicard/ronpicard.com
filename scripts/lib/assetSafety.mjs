import { requireAllowedHttpsUrl } from './fetchText.mjs'

const ALLOWED_ASSET_HOSTS = new Set([
  'images.squarespace-cdn.com',
  'proceedings.neurips.cc',
  'ronpicard.com',
  'static1.squarespace.com',
  'www.ronpicard.com',
])
const SQUARESPACE_ASSET_HOSTS = new Set([
  'images.squarespace-cdn.com',
  'static1.squarespace.com',
])
const SUPPORTED_ASSET_PATH_RE = /\.(png|jpe?g|gif|webp|avif|ico|bmp|pdf|zip)$/i

export function validateAssetUrl(url) {
  requireAllowedHttpsUrl(url, ALLOWED_ASSET_HOSTS)
  if (SQUARESPACE_ASSET_HOSTS.has(url.hostname.toLowerCase())) {
    for (const key of url.searchParams.keys()) {
      if (key !== 'format') throw new Error(`Unexpected asset query parameter: ${key}`)
    }
  } else if (url.search) {
    throw new Error(`Asset URL query parameters are not allowed: ${url.origin}${url.pathname}`)
  }
}

export function isSupportedAssetPath(path) {
  return SUPPORTED_ASSET_PATH_RE.test(path)
}

export function shouldMirrorAbsoluteUrl(href) {
  if (!href || typeof href !== 'string') return false
  const trimmed = href.trim()
  if (trimmed.startsWith('resources/')) return false

  let url
  try {
    url = new URL(trimmed)
    validateAssetUrl(url)
  } catch {
    return false
  }

  const fileName = url.pathname.split('/').pop() || ''
  return isSupportedAssetPath(fileName)
}

export function detectAssetExtension(buf) {
  if (
    buf.length >= 8 &&
    buf
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return '.png'
  }
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8) return '.jpg'
  if (buf.length >= 6 && /^GIF8[79]a$/.test(buf.subarray(0, 6).toString('ascii'))) return '.gif'
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return '.webp'
  }
  if (
    buf.length >= 12 &&
    buf.subarray(4, 8).toString('ascii') === 'ftyp' &&
    ['avif', 'avis'].includes(buf.subarray(8, 12).toString('ascii'))
  ) {
    return '.avif'
  }
  if (
    buf.length >= 4 &&
    buf.subarray(0, 4).equals(Buffer.from([0x00, 0x00, 0x01, 0x00]))
  ) {
    return '.ico'
  }
  if (buf.length >= 2 && buf.subarray(0, 2).toString('ascii') === 'BM') return '.bmp'
  if (buf.length >= 5 && buf.subarray(0, 5).toString('ascii') === '%PDF-') return '.pdf'
  if (
    buf.length >= 4 &&
    buf.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
  ) {
    return '.zip'
  }
  return null
}
