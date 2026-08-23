import { describe, expect, it } from 'vitest'
import { normalizeHrefKey } from './hrefKey'

describe('normalizeHrefKey', () => {
  it('ignores hash, query string, and trailing slashes', () => {
    expect(normalizeHrefKey('https://example.com/path/#x')).toBe('https://example.com/path')
    expect(normalizeHrefKey('https://example.com/path/')).toBe('https://example.com/path')
    expect(normalizeHrefKey('https://example.com/path/?ref=nav')).toBe('https://example.com/path')
  })

  it('lowercases origin and path', () => {
    expect(normalizeHrefKey('HTTPS://Example.COM/Path')).toBe('https://example.com/path')
  })
})
