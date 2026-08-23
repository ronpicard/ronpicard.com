import { describe, expect, it } from 'vitest'
import {
  articles,
  filterExtraLinks,
  getArticle,
  getArticleTitleList,
  isThirdPartyArticleLink,
  pdfExtraLinks,
  showCodeButton,
  showDemoButton,
  thirdPartyArticleUrl,
  youtubeWatchUrl,
  type Article,
} from './articles'

function stubArticle(overrides: Partial<Article>): Article {
  return {
    title: 'Stub',
    date: '2024-01-01',
    summary: null,
    bodyPath: null,
    imageUrl: null,
    articleHeroUrl: null,
    githubEmbed: null,
    demoUrl: null,
    repoUrl: null,
    youtubeId: null,
    otherEmbed: null,
    readmeRawUrl: null,
    extraLinks: [],
    sourceSlug: 'stub',
    slug: 'stub',
    kind: 'post',
    prevSlug: null,
    nextSlug: null,
    ...overrides,
  }
}

describe('getArticle', () => {
  it('resolves public title slugs', () => {
    const a = getArticle('clamav-control')
    expect(a?.title).toBe('ClamAV Control')
    expect(a?.slug).toBe('clamav-control')
  })

  it('resolves legacy source and legacy route slugs to the same article', () => {
    const byPublic = getArticle('periodic-table-element-visualizer')
    const bySource = getArticle('periodic-table-element-visualizor')
    const byLegacy = getArticle('periodic-table-element-visualizer-web-app')
    expect(byPublic).toBeDefined()
    expect(bySource).toBe(byPublic)
    expect(byLegacy).toBe(byPublic)
  })

  it('returns undefined for unknown slugs', () => {
    expect(getArticle('no-such-article-xyz')).toBeUndefined()
  })
})

describe('articles catalog', () => {
  it('has unique public slugs and a complete prev/next chain', () => {
    const slugs = articles.map((a) => a.slug)
    expect(slugs.length).toBeGreaterThan(1)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(articles[0]?.prevSlug).toBeNull()
    expect(articles[articles.length - 1]?.nextSlug).toBeNull()
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i]!
      expect(article.prevSlug).toBe(i === 0 ? null : slugs[i - 1])
      expect(article.nextSlug).toBe(i === articles.length - 1 ? null : slugs[i + 1])
    }
  })

  it('derives app/lesson/post kinds', () => {
    const app = articles.find((a) => a.githubEmbed)
    const lesson = articles.find((a) => /software-lessons-session/i.test(a.sourceSlug))
    expect(app?.kind).toBe('app')
    expect(lesson?.kind).toBe('lesson')
  })

  it('exposes the AI Chess app demo without duplicating it as an extra link', () => {
    const chess = articles.find((a) => a.sourceSlug === 'wasmj8db1br3ksr00ivvmyju8gniym')
    expect(chess?.demoUrl).toBe('https://ronpicard.github.io/chess-web-app/')
    expect(chess?.repoUrl).toBe('https://github.com/ronpicard/chess-web-app')
    expect(chess?.extraLinks).toEqual([])

    const card = getArticleTitleList().find((item) => item.slug === chess?.slug)
    expect(card).toMatchObject({ showDemo: true, showCode: true })
  })
})

describe('isThirdPartyArticleLink', () => {
  it('accepts paper / doi / arxiv style links', () => {
    expect(
      isThirdPartyArticleLink({ label: 'Paper', href: 'https://doi.org/10.1000/xyz' }),
    ).toBe(true)
    expect(
      isThirdPartyArticleLink({ label: 'View Article', href: 'https://arxiv.org/abs/1234.5678' }),
    ).toBe(true)
  })

  it('rejects YouTube, GitHub, and video-only labels', () => {
    expect(
      isThirdPartyArticleLink({ label: 'Watch', href: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }),
    ).toBe(false)
    expect(
      isThirdPartyArticleLink({ label: 'Code', href: 'https://github.com/ronpicard/x' }),
    ).toBe(false)
    expect(
      isThirdPartyArticleLink({ label: 'Video demo', href: 'https://example.com/talk' }),
    ).toBe(false)
    expect(
      isThirdPartyArticleLink({ label: 'Code', href: 'https://ronpicard.github.io/demo/' }),
    ).toBe(false)
    expect(isThirdPartyArticleLink({ label: 'Paper', href: 'not a url' })).toBe(false)
    expect(isThirdPartyArticleLink({ label: 'Paper', href: '/resources/paper.pdf' })).toBe(false)
  })

  it('recognizes known publication and aviation hosts', () => {
    expect(
      isThirdPartyArticleLink({ label: 'Research', href: 'https://www.nature.com/articles/example' }),
    ).toBe(true)
    expect(
      isThirdPartyArticleLink({
        label: 'Research',
        href: 'https://arc.aiaa.org/doi/10.2514/example',
      }),
    ).toBe(true)
    expect(
      isThirdPartyArticleLink({
        label: 'Coverage',
        href: 'https://www.af.mil/News/Article-Display/Article/example',
      }),
    ).toBe(true)
    expect(
      isThirdPartyArticleLink({
        label: 'Coverage',
        href: 'https://aviationweek.com/example',
      }),
    ).toBe(true)
    expect(
      isThirdPartyArticleLink({ label: 'Homepage', href: 'https://example.com/' }),
    ).toBe(false)
  })
})

describe('filterExtraLinks', () => {
  it('drops links that duplicate demo or repo URLs', () => {
    const a = stubArticle({
      demoUrl: 'https://ronpicard.github.io/demo/',
      repoUrl: 'https://github.com/ronpicard/demo-repo',
      extraLinks: [
        { label: 'Demo', href: 'https://ronpicard.github.io/demo/' },
        { label: 'Code', href: 'https://github.com/ronpicard/demo-repo' },
        { label: 'Paper', href: 'https://arxiv.org/abs/1' },
      ],
    })
    expect(filterExtraLinks(a)).toEqual([{ label: 'Paper', href: 'https://arxiv.org/abs/1' }])
  })

  it('drops extra links that point at the same GitHub repo as repoUrl', () => {
    const a = stubArticle({
      repoUrl: 'https://github.com/ronpicard/demo-repo',
      extraLinks: [
        { label: 'Source', href: 'https://github.com/ronpicard/demo-repo/blob/main/README.md' },
        { label: 'Paper', href: 'https://arxiv.org/abs/1' },
      ],
    })
    expect(filterExtraLinks(a)).toEqual([{ label: 'Paper', href: 'https://arxiv.org/abs/1' }])
  })
})

describe('pdfExtraLinks / thirdPartyArticleUrl / youtubeWatchUrl', () => {
  it('filters PDF extra links', () => {
    const a = stubArticle({
      extraLinks: [
        { label: 'PDF', href: 'https://example.com/paper.pdf' },
        { label: 'HTML', href: 'https://example.com/paper' },
      ],
    })
    expect(pdfExtraLinks(a)).toEqual([{ label: 'PDF', href: 'https://example.com/paper.pdf' }])
  })

  it('returns first third-party article URL', () => {
    const a = stubArticle({
      extraLinks: [
        { label: 'Code', href: 'https://github.com/ronpicard/x' },
        { label: 'Paper', href: 'https://doi.org/10.1/x' },
      ],
    })
    expect(thirdPartyArticleUrl(a)).toBe('https://doi.org/10.1/x')
  })

  it('builds YouTube watch URLs from safe ids only', () => {
    expect(youtubeWatchUrl('dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(youtubeWatchUrl('bad id!')).toBeNull()
  })
})

describe('showDemoButton / showCodeButton / getArticleTitleList', () => {
  it('gates buttons on demo/repo presence', () => {
    expect(showDemoButton(stubArticle({ demoUrl: 'https://ronpicard.github.io/x/' }))).toBe(true)
    expect(showDemoButton(stubArticle({}))).toBe(false)
    expect(showCodeButton(stubArticle({ repoUrl: 'https://github.com/ronpicard/x' }))).toBe(true)
    expect(showCodeButton(stubArticle({}))).toBe(false)
  })

  it('lists one card item per article with matching slug', () => {
    const list = getArticleTitleList()
    expect(list).toHaveLength(articles.length)
    expect(list[0]?.slug).toBe(articles[0]?.slug)
  })
})
