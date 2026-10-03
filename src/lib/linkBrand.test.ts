import { describe, expect, it } from 'vitest'
import { linkBrandForHref } from './linkBrand'

describe('linkBrandForHref', () => {
  it.each([
    ['https://github.com/ronpicard/repo', 'github'],
    ['https://github.com/ronpicard/repo/releases/latest', 'github'],
    ['https://gist.github.com/ronpicard/abc', 'github'],
    ['https://www.github.com/ronpicard', 'github'],
    ['https://marketplace.visualstudio.com/items?itemName=A.x', 'vscode'],
    ['https://open-vsx.org/extension/A/x', 'openvsx'],
    ['https://wyvernsystems.com/', 'wyvern'],
    ['https://ronpicard.github.io/game/', 'github'],
    ['/resources/paper.pdf', 'pdf'],
    ['resources/paper.PDF?download=1#page=2', 'pdf'],
    ['https://example.com/paper.pdf', 'pdf'],
  ])('maps %s to %s', (href, brand) => {
    expect(linkBrandForHref(href)).toBe(brand)
  })

  it.each([
    'https://evilgithub.com/x',
    'https://evil.github.io.example/x',
    'http://ronpicard.github.io/game/',
    'https://example.com/pdf',
    'https://github.com.evil.example/x',
    'http://github.com/ronpicard',
    '/resources/paper.png',
    'not a url',
  ])('returns null for %s', (href) => {
    expect(linkBrandForHref(href)).toBeNull()
  })
})
