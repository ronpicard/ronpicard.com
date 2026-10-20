/**
 * Per-route SEO head tags, built once for both writers: scripts/prerender.mjs
 * serializes them into each page's static HTML, and src/components/Seo.tsx
 * swaps them into document.head on client navigation. One builder keeps the
 * two from drifting apart.
 */
import { escapeHtml, escapeHtmlAttr } from './htmlEscape.ts'
import { getArticleTopic, topicPath, type ArticleTopic } from './articleTopics.ts'
import { articleJsonLd, homeJsonLd, topicJsonLd } from './jsonLd.ts'
import { OG_HEIGHT, OG_WIDTH, postShareImage, RESOURCE_OG_DIR, resourceOgPath } from './resourceOgImages.ts'
import { articlePath } from './siteArticlesRouting.ts'
import {
  absoluteAssetUrl,
  canonicalUrl,
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  stripTagsForMeta,
  truncateMetaDescription,
} from './siteMeta.ts'

export type SeoHeadInput = {
  title: string
  description: string
  url: string
  ogType: 'website' | 'article'
  imageAbs?: string | null
  imageWidth?: number | null
  imageHeight?: number | null
  imageAlt?: string | null
  robots?: string
  /** YYYY-MM-DD; emitted as article:published_time. */
  publishedDate?: string | null
  jsonLd?: object | null
}

export type HeadTag =
  | { tag: 'title'; text: string }
  | { tag: 'meta'; attr: 'name' | 'property'; key: string; content: string }
  | { tag: 'link'; rel: 'canonical'; href: string }
  | { tag: 'jsonld'; json: string }

/** Every head element buildSeoHeadTags owns; the client removes these before inserting fresh ones. */
export const MANAGED_HEAD_SELECTOR = [
  'title',
  'meta[name="description"]',
  'meta[name="robots"]',
  'meta[name="author"]',
  'link[rel="canonical"]',
  'meta[property^="og:"]',
  'meta[property^="article:"]',
  'meta[name^="twitter:"]',
  'script[type="application/ld+json"]',
].join(', ')

/** JSON for an inline script: `<` escaped so the text can never close the tag. */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export function buildSeoHeadTags(input: SeoHeadInput): HeadTag[] {
  const { title, description, url, imageAbs } = input
  const hasDims =
    !!imageAbs && Number.isFinite(input.imageWidth) && Number.isFinite(input.imageHeight)
  const name = (key: string, content: string): HeadTag => ({ tag: 'meta', attr: 'name', key, content })
  const property = (key: string, content: string): HeadTag => ({
    tag: 'meta',
    attr: 'property',
    key,
    content,
  })
  const tags: (HeadTag | null)[] = [
    { tag: 'title', text: title },
    name('description', description),
    name('robots', input.robots ?? 'index, follow'),
    name('author', 'Ron Picard'),
    { tag: 'link', rel: 'canonical', href: url },
    property('og:title', title),
    property('og:description', description),
    property('og:url', url),
    property('og:type', input.ogType),
    property('og:site_name', 'Ron Picard'),
    property('og:locale', 'en_US'),
    imageAbs ? property('og:image', imageAbs) : null,
    imageAbs ? property('og:image:secure_url', imageAbs) : null,
    hasDims ? property('og:image:width', String(input.imageWidth)) : null,
    hasDims ? property('og:image:height', String(input.imageHeight)) : null,
    imageAbs && input.imageAlt ? property('og:image:alt', input.imageAlt) : null,
    input.publishedDate
      ? property('article:published_time', `${input.publishedDate}T12:00:00.000Z`)
      : null,
    input.publishedDate ? property('article:author', canonicalUrl('/')) : null,
    name('twitter:card', imageAbs ? 'summary_large_image' : 'summary'),
    name('twitter:title', title),
    name('twitter:description', description),
    imageAbs ? name('twitter:image', imageAbs) : null,
    imageAbs && input.imageAlt ? name('twitter:image:alt', input.imageAlt) : null,
    input.jsonLd ? { tag: 'jsonld', json: serializeJsonLd(input.jsonLd) } : null,
  ]
  return tags.filter((t): t is HeadTag => t !== null)
}

export function serializeHeadTag(tag: HeadTag): string {
  switch (tag.tag) {
    case 'title':
      return `<title>${escapeHtml(tag.text)}</title>`
    case 'meta':
      return `<meta ${tag.attr}="${escapeHtmlAttr(tag.key)}" content="${escapeHtmlAttr(tag.content)}" />`
    case 'link':
      return `<link rel="canonical" href="${escapeHtmlAttr(tag.href)}" />`
    case 'jsonld':
      return `<script type="application/ld+json">${tag.json}</script>`
  }
}

/** The home page's share image (also used by one post). */
export const HOME_SEO_IMAGE = 'resources/82f3c8eae802c3.jpg'

export function homeSeoInput(dims?: { width: number; height: number } | null): SeoHeadInput {
  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: canonicalUrl('/'),
    ogType: 'website',
    imageAbs: absoluteAssetUrl(HOME_SEO_IMAGE) ?? null,
    imageWidth: dims?.width ?? null,
    imageHeight: dims?.height ?? null,
    imageAlt: DEFAULT_TITLE,
    jsonLd: homeJsonLd(),
  }
}

/** Article fields the head needs; title and summary already entity-decoded. */
export type ArticleSeoSource = {
  /** Public route slug. */
  slug: string
  title: string
  summary: string | null
  date: string
  imageUrl?: string | null
  articleHeroUrl?: string | null
  youtubeId?: string | null
  repoUrl?: string | null
  /** Search-friendly title for the head tags; the page heading stays `title`. */
  seoTitle?: string | null
  /** Thin post: noindex, follow. */
  noindex?: boolean
  topic?: string | null
}

const LOCAL_SHARE_IMAGE_RE = /^resources\/(?:og\/)?[a-z0-9][a-z0-9._-]*\.(?:png|jpe?g|webp|gif|avif)$/i
const REMOTE_SHARE_IMAGE_HOSTS = new Set(['img.youtube.com', 'i.ytimg.com'])

/** A share image from JSON: a mirrored local image, or https on an approved host; else null. */
export function safeShareImage(raw: string | null | undefined): string | null {
  const value = raw?.trim()
  if (!value) return null
  if (LOCAL_SHARE_IMAGE_RE.test(value)) return value
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password) return null
    return REMOTE_SHARE_IMAGE_HOSTS.has(url.hostname) ? url.toString() : null
  } catch {
    return null
  }
}

export function articleDescription(article: Pick<ArticleSeoSource, 'title' | 'summary'>): string {
  const summary = truncateMetaDescription(stripTagsForMeta(article.summary))
  return summary || truncateMetaDescription(`${article.title}. ${DEFAULT_DESCRIPTION}`)
}

/**
 * Head input for a post. The share image defaults to the generated 1200×630
 * card; prerender overrides it (and its real dimensions) when the card file
 * is missing.
 */
export function articleSeoInput(
  article: ArticleSeoSource,
  image?: { rel: string | null; width?: number | null; height?: number | null },
): SeoHeadInput {
  const path = articlePath(article.slug)
  const shareImage = postShareImage(article)
  const imageRel = safeShareImage(image ? image.rel : (resourceOgPath(shareImage) ?? shareImage))
  const isCard = !image && !!imageRel?.startsWith(`${RESOURCE_OG_DIR}/`)
  const imageAbs = absoluteAssetUrl(imageRel) ?? null
  const description = articleDescription(article)
  const topic = getArticleTopic(article.topic)
  return {
    title: `${article.seoTitle || article.title} | Ron Picard`,
    description,
    url: canonicalUrl(path),
    ogType: 'article',
    imageAbs,
    imageWidth: image?.width ?? (isCard ? OG_WIDTH : null),
    imageHeight: image?.height ?? (isCard ? OG_HEIGHT : null),
    imageAlt: article.title,
    ...(article.noindex ? { robots: 'noindex, follow' } : {}),
    publishedDate: article.date,
    jsonLd: articleJsonLd({
      title: article.title,
      date: article.date,
      description,
      path,
      imageAbs,
      youtubeId: article.youtubeId,
      repoUrl: article.repoUrl,
      topic: topic ? { name: topic.label, path: topicPath(topic.slug) } : null,
    }),
  }
}

/** Head input for a topic hub; `items` are its posts in page order. */
export function topicSeoInput(
  topic: ArticleTopic,
  items: { title: string; slug: string }[],
): SeoHeadInput {
  const path = topicPath(topic.slug)
  return {
    title: `${topic.label} | Ron Picard`,
    description: truncateMetaDescription(topic.description),
    url: canonicalUrl(path),
    ogType: 'website',
    imageAbs: absoluteAssetUrl(HOME_SEO_IMAGE) ?? null,
    imageAlt: topic.label,
    jsonLd: topicJsonLd({
      name: topic.label,
      description: topic.description,
      path,
      items: items.map((item) => ({ title: item.title, path: articlePath(item.slug) })),
    }),
  }
}

export function notFoundSeoInput(): SeoHeadInput {
  return {
    title: 'Page not found | Ron Picard',
    description: 'The requested page could not be found.',
    url: canonicalUrl('/'),
    ogType: 'website',
    robots: 'noindex, nofollow',
  }
}
