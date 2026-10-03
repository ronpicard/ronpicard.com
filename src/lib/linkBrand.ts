export type LinkBrand = 'github' | 'vscode' | 'openvsx' | 'wyvern' | 'pdf'

const BRAND_BY_HOST: Record<string, LinkBrand> = {
  'github.com': 'github',
  'gist.github.com': 'github',
  'marketplace.visualstudio.com': 'vscode',
  'open-vsx.org': 'openvsx',
  'wyvernsystems.com': 'wyvern',
}

/** Whether `href` points at a PDF file, ignoring any query or fragment. */
export function isPdfHref(href: string): boolean {
  return /\.pdf$/i.test(href.split('?')[0].split('#')[0])
}

/**
 * Logo that belongs on a button to `href`: PDF for PDF files, otherwise a brand chosen by exact
 * https host (GitHub Pages sites count as GitHub); null for anything else.
 */
export function linkBrandForHref(href: string): LinkBrand | null {
  if (isPdfHref(href)) return 'pdf'
  let u: URL
  try {
    u = new URL(href)
  } catch {
    return null
  }
  if (u.protocol !== 'https:') return null
  const host = u.hostname.toLowerCase().replace(/^www\./, '')
  if (/^[a-z0-9-]+\.github\.io$/.test(host)) return 'github'
  return Object.hasOwn(BRAND_BY_HOST, host) ? BRAND_BY_HOST[host] : null
}
