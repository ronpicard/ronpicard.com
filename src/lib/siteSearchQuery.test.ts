import { describe, expect, it } from 'vitest'
import { SEARCH_QUERY_MAX_LEN } from '../config/security'
import { articleMatchesSearch, normalizeSearchQuery } from './siteSearchQuery'

describe('normalizeSearchQuery', () => {
  it('lowercases, collapses whitespace, and strips control chars', () => {
    expect(normalizeSearchQuery('  Hello   World\u0000  ')).toBe('hello world')
  })

  it('caps length at SEARCH_QUERY_MAX_LEN', () => {
    const long = 'a'.repeat(SEARCH_QUERY_MAX_LEN + 40)
    expect(normalizeSearchQuery(long)).toHaveLength(SEARCH_QUERY_MAX_LEN)
  })
})

describe('articleMatchesSearch', () => {
  it('matches empty query against everything', () => {
    expect(articleMatchesSearch('', 'Title', 'Summary')).toBe(true)
    expect(articleMatchesSearch('   ', 'Title', null)).toBe(true)
  })

  it('matches substring in title or summary', () => {
    expect(articleMatchesSearch('clam', 'ClamAV Control', 'Antivirus GUI')).toBe(true)
    expect(articleMatchesSearch('antivirus', 'ClamAV Control', 'Antivirus GUI')).toBe(true)
    expect(articleMatchesSearch('xyzzy', 'ClamAV Control', 'Antivirus GUI')).toBe(false)
  })

  it('matches after collapsing extra whitespace in the query and the article text', () => {
    expect(articleMatchesSearch('neural   networks', 'Convolutional Neural  Networks', null)).toBe(
      true,
    )
    expect(
      articleMatchesSearch('live progress', 'ClamAV Control', 'scans with   live   progress'),
    ).toBe(true)
  })
})
