import { describe, expect, it } from 'vitest'
import { articleJsonLd, homeJsonLd } from './jsonLd'

describe('JSON-LD builders', () => {
  it('builds canonical website metadata', () => {
    expect(homeJsonLd()).toMatchObject({
      '@type': 'WebSite',
      name: 'Ron Picard',
      url: 'https://ronpicard.com/',
    })
  })

  it('builds canonical blog posting metadata', () => {
    expect(
      articleJsonLd({
        title: 'Example',
        date: '2026-08-22',
        description: 'Example article',
        path: '/blog/example',
      }),
    ).toMatchObject({
      '@type': 'BlogPosting',
      headline: 'Example',
      description: 'Example article',
      datePublished: '2026-08-22T12:00:00.000Z',
      url: 'https://ronpicard.com/blog/example',
      author: { '@type': 'Person', name: 'Ron Picard' },
    })
  })
})
