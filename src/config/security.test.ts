import { describe, expect, it } from 'vitest'
import { buildProductionCsp, isSafePublicSlug, PUBLIC_SLUG_MAX_LEN } from './security'

describe('buildProductionCsp', () => {
  it('includes github fetch hosts and frame-ancestors', () => {
    const csp = buildProductionCsp()
    expect(csp).toContain("connect-src 'self' https://raw.githubusercontent.com https://api.github.com")
    expect(csp).toContain("frame-ancestors 'self'")
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
