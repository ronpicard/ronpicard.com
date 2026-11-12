import { describe, expect, it } from 'vitest'
import {
  articles,
  filterExtraLinks,
  articleExtraLinks,
  getArticle,
  getArticlesByTopic,
  getRelatedArticles,
  getArticleTitleList,
  isThirdPartyArticleLink,
  linkSeries,
  showCodeButton,
  showDemoButton,
  showReleasesButton,
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
    releasesUrl: null,
    extraLinks: [],
    sourceSlug: 'stub',
    slug: 'stub',
    kind: 'post',
    topic: null,
    prevSlug: null,
    nextSlug: null,
    series: null,
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

  it('labels every Software Lessons session as a lesson, whatever its source slug', () => {
    const sessions = articles.filter((a) => /^Software Lessons Session\b/.test(a.title))
    expect(sessions.length).toBeGreaterThan(20)
    expect(sessions.filter((a) => a.kind !== 'lesson').map((a) => a.title)).toEqual([])
  })

  it('labels release-shipped software as a desktop app', () => {
    const clamav = articles.find((a) => a.sourceSlug === 'clamav-antivirus-control-gui')
    expect(clamav?.kind).toBe('software')
  })

  it('keeps written articles about released software labelled as articles', () => {
    for (const sourceSlug of ['ai-rulebook-vscode-extension', 'auto-color-vscode-extension']) {
      const post = articles.find((a) => a.sourceSlug === sourceSlug)
      expect(post?.releasesUrl).toMatch(/^https:\/\/github\.com\/wyvernsystems\/.+\/releases\/latest$/)
      expect(post?.kind).toBe('post')
    }
  })

  it('keeps corrected titles reachable at their old URLs', () => {
    const post = getArticle('linear-regression-using-gradient-decent')
    expect(post?.title).toBe('Linear Regression Using Gradient Descent')
    expect(post?.slug).toBe('linear-regression-using-gradient-descent')
    const smt = getArticle('formal-methods-101-satisfiable-modulo-theories-smt')
    expect(smt?.title).toBe('Formal Methods 101: Satisfiability Modulo Theories (SMT)')
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

describe('BotLegger article', () => {
  it('leads with a BotLegger site link and plays the tour video from botlegger.com', () => {
    const botlegger = articles.find((a) => a.sourceSlug === 'botlegger')!
    expect(articles[0]).toBe(botlegger)
    const links = articleExtraLinks(botlegger)
    expect(links[0]).toMatchObject({ label: 'BotLegger', href: 'https://botlegger.com/', lead: true })
    expect(links.filter((l) => l.lead)).toHaveLength(1)
    expect(botlegger.video?.src).toBe('https://botlegger.com/video/hero_dark.mp4')
    expect(botlegger.video?.poster).toBe(botlegger.imageUrl)
  })
})

describe('linkSeries', () => {
  it('orders each series by part and links neighbours, ignoring posts outside a series', () => {
    const map = linkSeries([
      { slug: 'b', title: 'B', series: { name: 'S', part: 2 } },
      { slug: 'x', title: 'X' },
      { slug: 'c', title: 'C', series: { name: 'S', part: 3 } },
      { slug: 'a', title: 'A', series: { name: 'S', part: 1 } },
      { slug: 'z', title: 'Z', series: { name: 'Other', part: 1 } },
    ])
    expect(map.has('x')).toBe(false)
    expect(map.get('a')).toEqual({ name: 'S', part: 1, total: 3, prev: null, next: { slug: 'b', title: 'B', part: 2 } })
    expect(map.get('b')?.prev?.slug).toBe('a')
    expect(map.get('b')?.next?.slug).toBe('c')
    expect(map.get('c')?.next).toBeNull()
    expect(map.get('z')).toEqual({ name: 'Other', part: 1, total: 1, prev: null, next: null })
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

describe('articleExtraLinks / youtubeWatchUrl', () => {
  it('lists every extra link, labelling third-party papers Paper and other articles Article', () => {
    const a = stubArticle({
      extraLinks: [
        { label: 'PDF', href: 'https://example.com/paper.pdf' },
        { label: 'View paper', href: 'https://doi.org/10.1/x' },
        { label: 'Store', href: 'https://example.com/store', card: true },
        { label: 'Fighter jet flown by AI', href: 'https://www.aviationweek.com/story' },
        { label: ' ', href: 'resources/e55c259979a696.pdf' },
        { label: 'Empty', href: '' },
      ],
    })
    expect(articleExtraLinks(a)).toEqual([
      { label: 'PDF', href: 'https://example.com/paper.pdf', articleStyle: false },
      { label: 'Paper', href: 'https://doi.org/10.1/x', articleStyle: true },
      { label: 'Store', href: 'https://example.com/store', articleStyle: false },
      { label: 'Article', href: 'https://www.aviationweek.com/story', articleStyle: true },
      { label: 'PDF', href: 'resources/e55c259979a696.pdf', articleStyle: false },
    ])
  })

  it('drops extra links that repeat the demo or repo', () => {
    const a = stubArticle({
      demoUrl: 'https://ronpicard.github.io/x/',
      repoUrl: 'https://github.com/ronpicard/x',
      extraLinks: [
        { label: 'Play', href: 'https://ronpicard.github.io/x/' },
        { label: 'Repo', href: 'https://github.com/ronpicard/x' },
        { label: 'Gist', href: 'https://gist.github.com/ronpicard/abc' },
      ],
    })
    expect(articleExtraLinks(a).map((l) => l.label)).toEqual(['Gist'])
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

  it('gates the Releases button on a validated releasesUrl', () => {
    expect(
      showReleasesButton(
        stubArticle({ releasesUrl: 'https://github.com/ronpicard/x/releases/latest' }),
      ),
    ).toBe(true)
    expect(showReleasesButton(stubArticle({ releasesUrl: 'https://github.com/ronpicard/x' }))).toBe(
      false,
    )
    expect(showReleasesButton(stubArticle({}))).toBe(false)
  })

  it('exposes releasesUrl on card items only for posts that have one', () => {
    const list = getArticleTitleList()
    const clamav = articles.find((a) => a.sourceSlug === 'clamav-antivirus-control-gui')
    const card = list.find((item) => item.slug === clamav?.slug)
    expect(card?.releasesUrl).toBe('https://github.com/ronpicard/clamav-antivirus-ui/releases/latest')
    const withReleases = articles.filter((a) => a.releasesUrl).map((a) => a.slug)
    expect(list.filter((item) => item.releasesUrl).map((item) => item.slug)).toEqual(withReleases)
    // ClamAV, Auto-Color, AI Rulebook, and BotLegger ship releases.
    expect(withReleases).toHaveLength(4)
  })

  it('puts the extension store and company links on the extension cards', () => {
    const list = getArticleTitleList()
    for (const sourceSlug of ['ai-rulebook-vscode-extension', 'auto-color-vscode-extension']) {
      const slug = articles.find((a) => a.sourceSlug === sourceSlug)?.slug
      const card = list.find((item) => item.slug === slug)
      expect(card?.extraLinks.map((l) => l.label)).toEqual([
        'Open VSX Registry',
        'VS Code Marketplace',
        'Wyvern Systems',
      ])
    }
  })

  it('gives every card the same extra links as its article page', () => {
    const list = getArticleTitleList()
    for (const a of articles) {
      expect(list.find((item) => item.slug === a.slug)?.extraLinks).toEqual(articleExtraLinks(a))
    }
    const cnn = list.find((item) => item.slug === 'convolutional-neural-networks')
    expect(cnn?.extraLinks.map((l) => l.label)).toEqual(['View Code'])
  })

  it('lists one card item per article with matching slug', () => {
    const list = getArticleTitleList()
    expect(list).toHaveLength(articles.length)
    expect(list[0]?.slug).toBe(articles[0]?.slug)
  })

  it('gives cards plain-text summaries capped at 160 characters, 400 for pinned cards', () => {
    const items = getArticleTitleList().filter((item) => item.summary !== null)
    expect(items.length).toBeGreaterThan(0)
    for (const item of items) {
      expect(item.summary).not.toMatch(/<[^>]+>/)
      expect(item.summary).not.toContain('&amp;')
      expect(item.summary!.length).toBeLessThanOrEqual(item.pinned ? 400 : 160)
    }
  })
})

describe('topics', () => {
  it('assigns every article a topic', () => {
    for (const a of articles) expect(a.topic).not.toBeNull()
  })

  it('lists only posts of the requested topic', () => {
    const list = getArticlesByTopic('aviation')
    expect(list.length).toBeGreaterThan(0)
    for (const a of list) expect(a.topic).toBe('aviation')
  })

  it('returns the three nearest same-topic posts, never the post itself', () => {
    const lesson = articles.find((a) => a.kind === 'lesson')!
    const related = getRelatedArticles(lesson)
    expect(related).toHaveLength(3)
    for (const a of related) {
      expect(a.topic).toBe(lesson.topic)
      expect(a.slug).not.toBe(lesson.slug)
    }
  })

  it('puts the immediate topic neighbours first', () => {
    const peers = getArticlesByTopic(articles.find((a) => a.kind === 'lesson')!.topic!)
    const mid = peers[Math.floor(peers.length / 2)]!
    const i = peers.indexOf(mid)
    const related = getRelatedArticles(mid)
    expect(new Set(related.slice(0, 2).map((a) => a.slug))).toEqual(
      new Set([peers[i - 1]!.slug, peers[i + 1]!.slug]),
    )
  })

  it('returns nothing for a post without a topic', () => {
    expect(getRelatedArticles(stubArticle({ topic: null }))).toEqual([])
  })

  it('links the extension posts to their repositories', () => {
    const repos: Record<string, string> = {
      'ai-rulebook-vscode-extension': 'https://github.com/wyvernsystems/ai-rulebook',
      'auto-color-vscode-extension': 'https://github.com/wyvernsystems/auto-color',
    }
    for (const [sourceSlug, repoUrl] of Object.entries(repos)) {
      expect(articles.find((a) => a.sourceSlug === sourceSlug)?.repoUrl).toBe(repoUrl)
    }
  })
})
