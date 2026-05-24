import { describe, expect, it } from 'vitest'
import { escapeHtml, escapeHtmlAttr } from './htmlEscape'

describe('escapeHtml', () => {
  it('escapes angle brackets and ampersands', () => {
    expect(escapeHtml('<a & b>')).toBe('&lt;a &amp; b&gt;')
  })
})

describe('escapeHtmlAttr', () => {
  it('escapes quotes for attribute contexts', () => {
    expect(escapeHtmlAttr('say "hi" & <bye>')).toBe('say &quot;hi&quot; &amp; &lt;bye&gt;')
  })
})
