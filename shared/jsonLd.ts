import { parseGithubRepoUrl } from './githubRepo.ts'
import {
  canonicalUrl,
  DEFAULT_DESCRIPTION,
  SOCIAL,
  truncateMetaDescription,
} from './siteMeta.ts'

const SITE_NAME = 'Ron Picard'
const PERSON_ID = canonicalUrl('/#person')
const WEBSITE_ID = canonicalUrl('/#website')
const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{6,32}$/

/** The site owner; posts reference it by @id as author and publisher. */
export function personJsonLd() {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: SITE_NAME,
    url: canonicalUrl('/'),
    sameAs: [SOCIAL.linkedin, SOCIAL.github],
  }
}

function personRef() {
  return { '@type': 'Person', '@id': PERSON_ID, name: SITE_NAME, url: canonicalUrl('/') }
}

function websiteJsonLd() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    url: canonicalUrl('/'),
    description: DEFAULT_DESCRIPTION,
    inLanguage: 'en-US',
    publisher: { '@id': PERSON_ID },
  }
}

export function homeJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [websiteJsonLd(), personJsonLd()],
  }
}

export function articleJsonLd(input: {
  title: string
  date: string
  description: string
  path: string
  imageAbs?: string | null
  youtubeId?: string | null
  repoUrl?: string | null
  /** The post's topic hub, as the middle breadcrumb. */
  topic?: { name: string; path: string } | null
}) {
  const url = canonicalUrl(input.path)
  const description = truncateMetaDescription(input.description)
  const datePublished = `${input.date}T12:00:00.000Z`
  const youtubeId = input.youtubeId?.trim()
  const videoId = youtubeId && YOUTUBE_ID_RE.test(youtubeId) ? youtubeId : null
  const repoUrl = parseGithubRepoUrl(input.repoUrl)?.url ?? null

  const posting = {
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: input.title,
    description,
    datePublished,
    url,
    mainEntityOfPage: url,
    inLanguage: 'en-US',
    ...(input.imageAbs ? { image: input.imageAbs } : {}),
    author: personRef(),
    publisher: personRef(),
    isPartOf: { '@id': WEBSITE_ID },
    ...(videoId ? { video: { '@id': `${url}#video` } } : {}),
  }
  const crumbs = [
    { name: 'Home', item: canonicalUrl('/') },
    ...(input.topic ? [{ name: input.topic.name, item: canonicalUrl(input.topic.path) }] : []),
    { name: input.title, item: url },
  ]
  const breadcrumbs = {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, ...c })),
  }
  // The data has no upload date, so the post date (when the video was shared) stands in.
  const video = videoId
    ? {
        '@type': 'VideoObject',
        '@id': `${url}#video`,
        name: input.title,
        description,
        thumbnailUrl: [`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`],
        uploadDate: datePublished,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      }
    : null
  const code = repoUrl
    ? {
        '@type': 'SoftwareSourceCode',
        name: input.title,
        description,
        codeRepository: repoUrl,
        url: repoUrl,
        author: { '@id': PERSON_ID },
      }
    : null

  return {
    '@context': 'https://schema.org',
    '@graph': [posting, breadcrumbs, personJsonLd(), ...(video ? [video] : []), ...(code ? [code] : [])],
  }
}

/** A topic hub: the page itself, its posts in order, and its breadcrumb trail. */
export function topicJsonLd(input: {
  name: string
  description: string
  path: string
  items: { title: string; path: string }[]
}) {
  const url = canonicalUrl(input.path)
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#page`,
        name: input.name,
        description: truncateMetaDescription(input.description),
        url,
        inLanguage: 'en-US',
        isPartOf: { '@id': WEBSITE_ID },
        author: personRef(),
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: input.items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.title,
            url: canonicalUrl(item.path),
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: canonicalUrl('/') },
          { '@type': 'ListItem', position: 2, name: input.name, item: url },
        ],
      },
    ],
  }
}
