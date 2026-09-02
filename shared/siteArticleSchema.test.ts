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
