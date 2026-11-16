import { describe, expect, it } from 'vitest'
import { buildSearchIndex, parseSearchIndex, searchableText, SEARCH_INDEX_VERSION } from './searchIndex'

describe('searchableText', () => {
  it('keeps text, code, and alt text, lower-cased, without markup', () => {
    expect(
      searchableText('<h2>Set Up</h2><pre><code>$ sudo iptables -L &amp;&amp; ls</code></pre><img alt="A Router" src="x.png">\u0007'),
    ).toBe('set up $ sudo iptables -l && ls a router')
  })
})

describe('buildSearchIndex / parseSearchIndex', () => {
  it('round-trips body text, sorted, dropping keys that are not body paths', () => {
    const json = buildSearchIndex({
      'article-bodies/b.html': '<p>Beta</p>',
      'article-bodies/a.html': '<p>Alpha</p>',
      '../secret.html': '<p>no</p>',
    })
    expect(json).toBe(
      `{"version":${SEARCH_INDEX_VERSION},"bodies":{"article-bodies/a.html":"alpha","article-bodies/b.html":"beta"}}`,
    )
    expect([...parseSearchIndex(JSON.parse(json))]).toEqual([
      ['article-bodies/a.html', 'alpha'],
      ['article-bodies/b.html', 'beta'],
    ])
  })

  it('rejects malformed indexes and skips bad entries', () => {
    expect(() => parseSearchIndex(null)).toThrow('not an object')
    expect(() => parseSearchIndex({ version: 99, bodies: {} })).toThrow('version 99')
    expect(() => parseSearchIndex({ version: SEARCH_INDEX_VERSION, bodies: [] })).toThrow('no bodies')
    const index = parseSearchIndex({
      version: SEARCH_INDEX_VERSION,
      bodies: { 'article-bodies/ok.html': 'ok', 'evil/x.html': 'no', 'article-bodies/n.html': 5 },
    })
    expect([...index.keys()]).toEqual(['article-bodies/ok.html'])
  })
})
