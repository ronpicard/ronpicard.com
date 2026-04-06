import { Helmet } from 'react-helmet-async'
import {
  absoluteAssetUrl,
  canonicalUrl,
  DEFAULT_DESCRIPTION,
  truncateMetaDescription,
} from '../lib/siteMeta'

type Props = {
  title: string
  description: string
  /** Hash-router path, e.g. `/` or `/blog/my-slug` */
  path: string
  ogType?: 'website' | 'article'
  ogImage?: string | null
  jsonLd?: Record<string, unknown> | null
}

export function Seo({ title, description, path, ogType = 'website', ogImage, jsonLd }: Props) {
  const canonical = canonicalUrl(path === '/' ? '/' : path)
  const desc = truncateMetaDescription(description || DEFAULT_DESCRIPTION)
  const imageAbs = absoluteAssetUrl(ogImage ?? undefined)
  const twitterCard = imageAbs ? 'summary_large_image' : 'summary'

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      <meta name="description" content={desc} />
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Ron Picard" />
      <link rel="canonical" href={canonical} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Ron Picard" />
      <meta property="og:locale" content="en_US" />
      {imageAbs ? <meta property="og:image" content={imageAbs} /> : null}

      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      {imageAbs ? <meta name="twitter:image" content={imageAbs} /> : null}

      {jsonLd ? (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd).replace(/</g, '\\u003c')}
        </script>
      ) : null}
    </Helmet>
  )
}

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
