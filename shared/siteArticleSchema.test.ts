import { describe, expect, it } from 'vitest'
import { parseSiteArticleRows } from './siteArticleSchema'

function validRow() {
  return {
    slug: 'example-post',
    title: 'Example post',
    date: '2026-08-22',
    summary: null,
    bodyPath: 'article-bodies/example-post.html',
    imageUrl: 'resources/example.png',
    articleHeroUrl: null,
    githubEmbed: null,
    demoUrl: null,
    repoUrl: null,
    youtubeId: null,
    otherEmbed: null,
    readmeRawUrl: null,
    releasesUrl: null,
    extraLinks: [{ label: 'Paper', href: 'resources/example.pdf' }],
  }
}

describe('parseSiteArticleRows', () => {
  it('omits optional fields that were not present in the source row', () => {
    const row = validRow()
    delete (row as Partial<typeof row>).readmeRawUrl

    expect(parseSiteArticleRows([row])).toEqual([row])
    expect(parseSiteArticleRows([row])[0]).not.toHaveProperty('readmeRawUrl')
  })

  it('keeps an extra link card flag when present and rejects non-boolean flags', () => {
    const link = { label: 'Store', href: 'https://example.com/store', card: true }
    const withCardLink = { ...validRow(), extraLinks: [link] }
    expect(parseSiteArticleRows([withCardLink])[0]?.extraLinks).toEqual([link])
    expect(parseSiteArticleRows([validRow()])[0]?.extraLinks[0]).not.toHaveProperty('card')

    expect(() =>
      parseSiteArticleRows([{ ...validRow(), extraLinks: [{ ...link, card: 'yes' }] }]),
    ).toThrow('site article data[0].extraLinks[0].card must be a boolean')
  })

  it('keeps releasesUrl when present and omits it when absent', () => {
    const withReleases = {
      ...validRow(),
      releasesUrl: 'https://github.com/ronpicard/example/releases/latest',
    }
    expect(parseSiteArticleRows([withReleases])[0]?.releasesUrl).toBe(
      'https://github.com/ronpicard/example/releases/latest',
    )

    const row = validRow()
    delete (row as Partial<typeof row>).releasesUrl
    expect(parseSiteArticleRows([row])[0]).not.toHaveProperty('releasesUrl')

    expect(() => parseSiteArticleRows([{ ...validRow(), releasesUrl: 42 }])).toThrow(
      'site article data[0].releasesUrl',
    )
  })

  it('keeps topic, trimmed seoTitle, and noindex when present', () => {
    const parsed = parseSiteArticleRows([
      { ...validRow(), topic: 'aviation', seoTitle: '  Better Title  ', noindex: true },
    ])[0]
    expect(parsed?.topic).toBe('aviation')
    expect(parsed?.seoTitle).toBe('Better Title')
    expect(parsed?.noindex).toBe(true)
  })

  it('omits topic, seoTitle, and noindex when absent or noindex is false', () => {
    const plain = parseSiteArticleRows([validRow()])[0]
    expect(plain).not.toHaveProperty('topic')
    expect(plain).not.toHaveProperty('seoTitle')
    expect(plain).not.toHaveProperty('noindex')

    expect(parseSiteArticleRows([{ ...validRow(), noindex: false }])[0]).not.toHaveProperty(
      'noindex',
    )
  })

  it('rejects an unknown topic, a non-boolean noindex, and a blank seoTitle', () => {
    expect(() => parseSiteArticleRows([{ ...validRow(), topic: 'nope' }])).toThrow(
      /topic must be a known topic slug/,
    )
    expect(() => parseSiteArticleRows([{ ...validRow(), noindex: 'yes' }])).toThrow(
      /noindex must be a boolean/,
    )
    expect(() => parseSiteArticleRows([{ ...validRow(), seoTitle: '  ' }])).toThrow(
      /seoTitle must not be blank/,
    )
  })

  it('rejects malformed rows with field context', () => {
    expect(() => parseSiteArticleRows({})).toThrow('must be an array')
    expect(() => parseSiteArticleRows([{ ...validRow(), slug: '../escape' }])).toThrow(
      'site article data[0].slug',
    )
    expect(() => parseSiteArticleRows([{ ...validRow(), date: 'not-a-date' }])).toThrow(
      'site article data[0].date',
    )
    expect(() =>
      parseSiteArticleRows([{ ...validRow(), bodyPath: '../private.html' }]),
    ).toThrow('site article data[0].bodyPath')
    expect(() => parseSiteArticleRows([{ ...validRow(), extraLinks: [{}] }])).toThrow(
      'site article data[0].extraLinks[0].label',
    )
  })
})
