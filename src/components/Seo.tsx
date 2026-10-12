import { useEffect } from 'react'
import {
  buildSeoHeadTags,
  MANAGED_HEAD_SELECTOR,
  type HeadTag,
  type SeoHeadInput,
} from '../../shared/seoHead'

function createHeadElement(doc: Document, tag: HeadTag): HTMLElement {
  switch (tag.tag) {
    case 'title': {
      const el = doc.createElement('title')
      el.textContent = tag.text
      return el
    }
    case 'meta': {
      const el = doc.createElement('meta')
      el.setAttribute(tag.attr, tag.key)
      el.setAttribute('content', tag.content)
      return el
    }
    case 'link': {
      const el = doc.createElement('link')
      el.setAttribute('rel', tag.rel)
      el.setAttribute('href', tag.href)
      return el
    }
    case 'jsonld': {
      const el = doc.createElement('script')
      el.setAttribute('type', 'application/ld+json')
      el.textContent = tag.json
      return el
    }
  }
}

/** Replace every managed SEO tag in <head> (prerendered or from a previous route). */
export function applySeoHead(doc: Document, input: SeoHeadInput) {
  doc.head.querySelectorAll(MANAGED_HEAD_SELECTOR).forEach((el) => el.remove())
  for (const tag of buildSeoHeadTags(input)) {
    doc.head.appendChild(createHeadElement(doc, tag))
  }
}

/** True until the first route's head is settled; later routes always apply. */
let firstRoute = true

/**
 * Keeps <head> in sync with the current route after client navigation.
 * scripts/prerender.mjs writes the same tags (shared/seoHead) into each
 * page's static HTML; this swaps them in place, so there is one set of tags,
 * never a prerendered copy plus a client copy. On the first route, a
 * prerendered head for this URL is kept as is: it knows things the client
 * does not (real image sizes, whether the share card exists). Renders
 * nothing, so the prerendered body markup carries no head tags.
 */
export function Seo({ input }: { input: SeoHeadInput }) {
  const key = JSON.stringify(input)
  useEffect(() => {
    const next = JSON.parse(key) as SeoHeadInput
    const canonical = document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')
    // The title check rules out 404.html, whose canonical is the home URL.
    const keepPrerendered = firstRoute && canonical === next.url && document.title === next.title
    firstRoute = false
    if (!keepPrerendered) applySeoHead(document, next)
  }, [key])
  return null
}
