import { describe, expect, it } from 'vitest'
import { buildProductionCsp, isSafePublicSlug, PUBLIC_SLUG_MAX_LEN } from './security'

describe('buildProductionCsp', () => {
  it('allows only the required third-party hosts', () => {
    const csp = buildProductionCsp()
    expect(csp).toContain("connect-src 'self' https://raw.githubusercontent.com https://api.github.com")
    expect(csp).toContain('frame-src https://www.youtube-nocookie.com https://ronpicard.github.io')
    expect(csp).toContain("font-src 'self' data:")
    expect(csp).not.toContain('fonts.gstatic.com')
    expect(csp).not.toContain('fonts.googleapis.com')
    expect(csp).toContain("frame-ancestors 'self'")
    expect(csp).not.toContain('youtube.com/embed')
  })
})

describe('isSafePublicSlug', () => {
  it('accepts hyphenated lowercase slugs', () => {
    expect(isSafePublicSlug('clamav-control')).toBe(true)
  })

  it('rejects path injection and invalid characters', () => {
    expect(isSafePublicSlug('../etc/passwd')).toBe(false)
    expect(isSafePublicSlug('not a slug')).toBe(false)
    expect(isSafePublicSlug('bad_slug')).toBe(false)
    expect(isSafePublicSlug('a'.repeat(PUBLIC_SLUG_MAX_LEN + 1))).toBe(false)
    expect(isSafePublicSlug(null)).toBe(false)
  })
})
