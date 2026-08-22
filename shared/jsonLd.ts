import {
  canonicalUrl,
  DEFAULT_DESCRIPTION,
  truncateMetaDescription,
} from './siteMeta.ts'

export function homeJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Ron Picard',
    url: canonicalUrl('/'),
    description: DEFAULT_DESCRIPTION,
  }
}

export function articleJsonLd(input: {
  title: string
  date: string
  description: string
  path: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.title,
    datePublished: `${input.date}T12:00:00.000Z`,
    description: truncateMetaDescription(input.description),
    url: canonicalUrl(input.path),
    author: { '@type': 'Person', name: 'Ron Picard' },
  }
}
