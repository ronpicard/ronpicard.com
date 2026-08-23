import { describe, expect, it } from 'vitest'
import {
  buildArticleRouteSlugs,
  compareIndexedArticles,
  decodeHtml,
  legacySlugTitle,
  slugifyTitleForRoute,
  sortIndexedArticles,
  uniqueSlugsFromTitles,
} from './siteArticlesRouting'

describe('decodeHtml', () => {
  it('decodes entities and strips trailing Home', () => {
    expect(decodeHtml('ClamAV Control &mdash; Home')).toBe('ClamAV Control')
  })
})

describe('slugifyTitleForRoute', () => {
  it('slugifies titles for public routes', () => {
    expect(slugifyTitleForRoute('Hello World — Home')).toBe('hello-world')
  })

  it('keeps public slugs within the 96-character route limit', () => {
    const title = Array.from({ length: 20 }, (_, i) => `Word${i}`).join(' ')
    const slug = slugifyTitleForRoute(title)
    expect(slug.length).toBeLessThanOrEqual(96)
    expect(slug).not.toMatch(/-$/)
    expect(slug.startsWith('word0')).toBe(true)
  })
})

describe('uniqueSlugsFromTitles', () => {
  it('suffixes duplicate slug bases', () => {
    expect(uniqueSlugsFromTitles(['Same Title', 'Same Title'])).toEqual(['same-title', 'same-title-2'])
  })
})

describe('legacySlugTitle', () => {
  it('appends Web App for github embed apps on or after 2026-03-22', () => {
    expect(
      legacySlugTitle('Sorting Algorithms', {
        date: '2026-03-22',
        githubEmbed: 'https://ronpicard.github.io/sorting-algorithms-visualizer-web-app/',
      }),
    ).toBe('Sorting Algorithms Web App')
  })

  it('leaves older posts unchanged', () => {
    expect(legacySlugTitle('Old Post', { date: '2024-01-01', githubEmbed: 'https://x' })).toBe('Old Post')
  })
})

describe('compareIndexedArticles', () => {
  it('sorts newer dates first', () => {
    expect(
      compareIndexedArticles({ date: '2026-01-01', sourceIndex: 0 }, { date: '2026-02-01', sourceIndex: 1 }),
    ).toBeGreaterThan(0)
  })

  it('places data structures visualizer after other apps on 2026-03-22', () => {
    const data = {
      date: '2026-03-22',
      githubEmbed: 'https://ronpicard.github.io/data-structures-visualizer-web-app/',
      sourceIndex: 1,
    }
    const other = {
      date: '2026-03-22',
      githubEmbed: 'https://ronpicard.github.io/sorting-algorithms-visualizer-web-app/',
      sourceIndex: 0,
    }
    expect(compareIndexedArticles(data, other)).toBeGreaterThan(0)
    expect(compareIndexedArticles(other, data)).toBeLessThan(0)
  })
})

describe('buildArticleRouteSlugs', () => {
  it('builds current and legacy slug lists', () => {
    const rows = [
      { title: 'Post A', date: '2026-01-01' },
      { title: 'Post B — Home', date: '2026-03-22', githubEmbed: 'https://ronpicard.github.io/app/' },
    ]
    const { routeSlugs, legacyRouteSlugs } = buildArticleRouteSlugs(rows)
    expect(routeSlugs).toEqual(['post-a', 'post-b'])
    expect(legacyRouteSlugs).toEqual(['post-a', 'post-b-web-app'])
  })
})

describe('sortIndexedArticles', () => {
  it('returns a new sorted array', () => {
    const input = [
      { date: '2026-01-01', sourceIndex: 0 },
      { date: '2026-03-01', sourceIndex: 1 },
    ]
    const sorted = sortIndexedArticles(input)
    expect(sorted[0]?.date).toBe('2026-03-01')
    expect(sorted).not.toBe(input)
  })
})
