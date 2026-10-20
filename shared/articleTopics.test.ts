import { describe, expect, it } from 'vitest'
import {
  ARTICLE_TOPICS,
  deriveArticleKind,
  getArticleTopic,
  isArticleTopicSlug,
  resolveArticleTopic,
  topicPath,
} from './articleTopics'

const base = { slug: 'some-post', title: 'Some post', githubEmbed: null }

describe('deriveArticleKind', () => {
  it('treats a GitHub embed as an app', () => {
    expect(deriveArticleKind({ ...base, githubEmbed: 'https://example.github.io/app/' })).toBe(
      'app',
    )
  })

  it('treats releases without a body as software, and with a body as a post', () => {
    const releasesUrl = 'https://github.com/ronpicard/example/releases/latest'
    expect(deriveArticleKind({ ...base, releasesUrl, bodyPath: null })).toBe('software')
    expect(deriveArticleKind({ ...base, releasesUrl })).toBe('software')
    expect(
      deriveArticleKind({ ...base, releasesUrl, bodyPath: 'article-bodies/some-post.html' }),
    ).toBe('post')
  })

  it('detects lessons by slug or by title', () => {
    expect(deriveArticleKind({ ...base, slug: 'software-lessons-session-3' })).toBe('lesson')
    expect(deriveArticleKind({ ...base, title: 'Software Lessons Session 4: X' })).toBe('lesson')
  })

  it('defaults to post', () => {
    expect(deriveArticleKind(base)).toBe('post')
  })
})

describe('resolveArticleTopic', () => {
  it('prefers an explicit topic', () => {
    expect(resolveArticleTopic({ topic: 'aviation' }, 'app')).toBe('aviation')
  })

  it('falls back to the kind default', () => {
    expect(resolveArticleTopic({}, 'app')).toBe('web-apps-and-games')
    expect(resolveArticleTopic({}, 'software')).toBe('software-and-tools')
    expect(resolveArticleTopic({}, 'lesson')).toBe('software-engineering-lessons')
  })

  it('returns null for a post without a topic', () => {
    expect(resolveArticleTopic({}, 'post')).toBeNull()
    expect(resolveArticleTopic({ topic: null }, 'post')).toBeNull()
  })
})

describe('topic lookups', () => {
  it('validates topic slugs', () => {
    expect(isArticleTopicSlug('aviation')).toBe(true)
    expect(isArticleTopicSlug('nope')).toBe(false)
    expect(isArticleTopicSlug(42)).toBe(false)
    expect(isArticleTopicSlug(null)).toBe(false)
  })

  it('looks up a topic by slug', () => {
    expect(getArticleTopic('aviation')?.label).toBe('Aviation & Hobbies')
    expect(getArticleTopic('nope')).toBeUndefined()
    expect(getArticleTopic(null)).toBeUndefined()
    expect(getArticleTopic(undefined)).toBeUndefined()
  })

  it('builds the hub path with a trailing slash', () => {
    expect(topicPath('aviation')).toBe('/topics/aviation/')
  })
})

describe('ARTICLE_TOPICS', () => {
  it('has unique, URL-safe slugs', () => {
    const slugs = ARTICLE_TOPICS.map((t) => t.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/)
  })

  it('keeps meta descriptions within 158 characters', () => {
    for (const topic of ARTICLE_TOPICS) {
      expect(topic.description.length).toBeLessThanOrEqual(158)
    }
  })
})
