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
  /** History-router path, e.g. `/` or `/blog/my-slug` */
  path: string
  ogType?: 'website' | 'article'
  ogImage?: string | null
}

// JSON-LD is not emitted here: inline <script> can't be hoisted to <head> by
// React, so it would land in the prerendered body. scripts/prerender.mjs
// injects the per-route JSON-LD (shared/jsonLd) into each page's head instead.
export function Seo({ title, description, path, ogType = 'website', ogImage }: Props) {
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
      {imageAbs ? <meta property="og:image:secure_url" content={imageAbs} /> : null}

      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      {imageAbs ? <meta name="twitter:image" content={imageAbs} /> : null}
    </Helmet>
  )
}
