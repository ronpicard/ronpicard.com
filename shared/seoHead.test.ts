import { describe, expect, it } from 'vitest'
import {
  articleDescription,
  articleSeoInput,
  buildSeoHeadTags,
  homeSeoInput,
  notFoundSeoInput,
  safeShareImage,
  topicSeoInput,
  serializeHeadTag,
  serializeJsonLd,
  type HeadTag,
} from './seoHead'
import { getArticleTopic } from './articleTopics'
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from './siteMeta'

const article = {
  slug: 'example-post',
  title: 'Example & Co',
  summary: 'Stack & Heap <b>basics</b>',
  date: '2026-08-22',
  imageUrl: 'resources/example.png',
  articleHeroUrl: null,
  youtubeId: null,
  repoUrl: null,
}

function metaContent(tags: HeadTag[], key: string): string | undefined {
  const tag = tags.find((t) => t.tag === 'meta' && t.key === key)
  return tag?.tag === 'meta' ? tag.content : undefined
}

describe('article SEO input', () => {
  it('uses the trailing-slash canonical, plain-text summary, and the og card by default', () => {
    const input = articleSeoInput(article)
    expect(input.title).toBe('Example & Co | Ron Picard')
    expect(input.url).toBe('https://ronpicard.com/blog/example-post/')
    expect(input.description).toBe('Stack & Heap basics')
    expect(input.imageAbs).toBe('https://ronpicard.com/resources/og/example.jpg')
    expect(input.imageWidth).toBe(1200)
    expect(input.imageHeight).toBe(630)
    expect(input.publishedDate).toBe('2026-08-22')
  })

  it('takes an explicit image and dimensions (prerender, when the card is missing)', () => {
    const input = articleSeoInput(article, { rel: 'resources/example.png', width: 3, height: 2 })
    expect(input.imageAbs).toBe('https://ronpicard.com/resources/example.png')
    expect(input.imageWidth).toBe(3)
    expect(input.imageHeight).toBe(2)
  })

  it('falls back to a site-level description when a post has no summary', () => {
    expect(articleDescription({ title: 'Untitled', summary: null })).toMatch(/^Untitled\. Interactive/)
    expect(articleDescription({ title: 'Untitled', summary: null }).length).toBeLessThanOrEqual(158)
  })
})

type GraphNode = Record<string, any>
const graph = (input: { jsonLd?: object | null }) => (input.jsonLd as { '@graph': GraphNode[] })['@graph']
const crumbs = (input: { jsonLd?: object | null }) =>
  graph(input).find((n) => n['@type'] === 'BreadcrumbList')!.itemListElement as GraphNode[]

describe('article SEO input: search title, noindex, topic', () => {
  it('uses seoTitle for the head while image alt and headline keep the article title', () => {
    const input = articleSeoInput({ ...article, seoTitle: 'Search Title' })
    expect(input.title).toBe('Search Title | Ron Picard')
    expect(input.imageAlt).toBe(article.title)
    expect(graph(input).find((n) => n['@type'] === 'BlogPosting')!.headline).toBe(article.title)
  })

  it('falls back to the article title without seoTitle', () => {
    expect(articleSeoInput(article).title).toBe(`${article.title} | Ron Picard`)
  })

  it('marks thin posts noindex, follow and defaults to index, follow', () => {
    const thin = articleSeoInput({ ...article, noindex: true })
    expect(thin.robots).toBe('noindex, follow')
    expect(metaContent(buildSeoHeadTags(thin), 'robots')).toBe('noindex, follow')
    const normal = articleSeoInput(article)
    expect(normal.robots).toBeUndefined()
    expect(metaContent(buildSeoHeadTags(normal), 'robots')).toBe('index, follow')
  })

  it('adds the topic hub as the middle breadcrumb only when the post has a topic', () => {
    const withTopic = crumbs(articleSeoInput({ ...article, topic: 'aviation' }))
    expect(withTopic).toHaveLength(3)
    expect(withTopic[0].name).toBe('Home')
    expect(withTopic[1]).toMatchObject({
      name: 'Aviation & Hobbies',
      item: 'https://ronpicard.com/topics/aviation/',
    })
    expect(withTopic[2].name).toBe(article.title)
    expect(crumbs(articleSeoInput(article))).toHaveLength(2)
  })

  it('uses the trailing-slash blog URL', () => {
    expect(articleSeoInput(article).url).toBe('https://ronpicard.com/blog/example-post/')
  })
})

describe('topic SEO input', () => {
  it('builds a website-type hub with a CollectionPage listing absolute post URLs', () => {
    const topic = getArticleTopic('aviation')!
    const input = topicSeoInput(topic, [
      { title: 'A', slug: 'a' },
      { title: 'B', slug: 'b' },
    ])
    expect(input.title).toBe('Aviation & Hobbies | Ron Picard')
    expect(input.url).toBe('https://ronpicard.com/topics/aviation/')
    expect(input.ogType).toBe('website')
    expect(input.description).toBe(topic.description)
    const page = graph(input)[0]
    expect(page['@type']).toBe('CollectionPage')
    expect(page.mainEntity.itemListElement).toMatchObject([
      { position: 1, url: 'https://ronpicard.com/blog/a/' },
      { position: 2, url: 'https://ronpicard.com/blog/b/' },
    ])
  })
})

describe('buildSeoHeadTags', () => {
  it('emits article published time only for posts', () => {
    const post = buildSeoHeadTags(articleSeoInput(article))
    expect(metaContent(post, 'article:published_time')).toBe('2026-08-22T12:00:00.000Z')
    expect(metaContent(post, 'og:type')).toBe('article')
    const home = buildSeoHeadTags(homeSeoInput())
    expect(metaContent(home, 'article:published_time')).toBeUndefined()
    expect(home[0]).toEqual({ tag: 'title', text: DEFAULT_TITLE })
    expect(metaContent(home, 'description')).toBe(DEFAULT_DESCRIPTION)
  })

  it('emits image dimensions only when an image and both sizes are known', () => {
    const tags = buildSeoHeadTags({ ...homeSeoInput(), imageWidth: 10, imageHeight: null })
    expect(metaContent(tags, 'og:image:width')).toBeUndefined()
    const noImage = buildSeoHeadTags(notFoundSeoInput())
    expect(metaContent(noImage, 'og:image')).toBeUndefined()
    expect(metaContent(noImage, 'twitter:card')).toBe('summary')
    expect(metaContent(noImage, 'robots')).toBe('noindex, nofollow')
  })
})

describe('serializeHeadTag', () => {
  it('escapes text and attributes', () => {
    expect(serializeHeadTag({ tag: 'title', text: 'A <b> & c' })).toBe('<title>A &lt;b&gt; &amp; c</title>')
    expect(
      serializeHeadTag({ tag: 'meta', attr: 'name', key: 'description', content: 'say "hi" & <go>' }),
    ).toBe('<meta name="description" content="say &quot;hi&quot; &amp; &lt;go&gt;" />')
  })

  it('keeps JSON-LD from closing its script tag', () => {
    const json = serializeJsonLd({ value: '</script><script>alert(1)</script>' })
    expect(json).not.toContain('</script>')
    expect(JSON.parse(json)).toEqual({ value: '</script><script>alert(1)</script>' })
  })
})

describe('safeShareImage', () => {
  it('accepts mirrored local images and approved https hosts only', () => {
    expect(safeShareImage('resources/og/a.jpg')).toBe('resources/og/a.jpg')
    expect(safeShareImage('https://img.youtube.com/vi/x/maxresdefault.jpg')).toBe(
      'https://img.youtube.com/vi/x/maxresdefault.jpg',
    )
    expect(safeShareImage('http://img.youtube.com/vi/x/0.jpg')).toBeNull()
    expect(safeShareImage('https://evil.example/a.jpg')).toBeNull()
    expect(safeShareImage('resources/../secret.png')).toBeNull()
    expect(safeShareImage('resources/doc.pdf')).toBeNull()
    expect(safeShareImage(null)).toBeNull()
  })

  it('drops an unapproved share image from the head and JSON-LD', () => {
    const input = articleSeoInput({ ...article, imageUrl: 'https://evil.example/a.png' })
    expect(input.imageAbs).toBeNull()
    expect(JSON.stringify(input.jsonLd)).not.toContain('evil.example')
  })
})
