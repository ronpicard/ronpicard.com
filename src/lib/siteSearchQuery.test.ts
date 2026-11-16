import { describe, expect, it } from 'vitest'
import { SEARCH_QUERY_MAX_LEN } from '../config/security'
import { articleMatchesSearch, normalizeSearchQuery, searchArticles } from './siteSearchQuery'

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

describe('searchArticles', () => {
  const items = [
    { title: 'Router', summary: 'Build a router', bodyPath: 'article-bodies/router.html' },
    { title: 'VPN', summary: null, bodyPath: 'article-bodies/vpn.html' },
    { title: 'Iptables notes', summary: null, bodyPath: null },
  ]
  const bodies = new Map([
    ['article-bodies/router.html', 'sudo iptables -l'],
    ['article-bodies/vpn.html', 'iptables nat rules'],
  ])

  it('lists title and summary matches before body-only matches', () => {
    expect(searchArticles('IPTABLES', items, bodies).map((i) => i.title)).toEqual([
      'Iptables notes',
      'Router',
      'VPN',
    ])
  })

  it('falls back to titles and summaries before the index loads, and returns all for an empty query', () => {
    expect(searchArticles('iptables', items, null).map((i) => i.title)).toEqual(['Iptables notes'])
    expect(searchArticles('  ', items, null)).toEqual(items)
  })
})
