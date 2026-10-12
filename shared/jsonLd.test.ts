import { describe, expect, it } from 'vitest'
import { articleJsonLd, homeJsonLd } from './jsonLd'
import { SOCIAL } from './siteMeta'

type Node = Record<string, unknown>
const byType = (data: { '@graph': Node[] }, type: string) =>
  data['@graph'].find((node) => node['@type'] === type)

const base = {
  title: 'Example',
  date: '2026-08-22',
  description: 'Example article',
  path: '/blog/example/',
}

describe('JSON-LD builders', () => {
  it('builds the website and the person behind it', () => {
    const data = homeJsonLd()
    expect(data['@context']).toBe('https://schema.org')
    expect(byType(data, 'WebSite')).toMatchObject({
      name: 'Ron Picard',
      url: 'https://ronpicard.com/',
      publisher: { '@id': 'https://ronpicard.com/#person' },
    })
    expect(byType(data, 'Person')).toMatchObject({
      '@id': 'https://ronpicard.com/#person',
      name: 'Ron Picard',
      sameAs: [SOCIAL.linkedin, SOCIAL.github],
    })
  })

  it('builds a blog posting with author, publisher, image, and breadcrumbs', () => {
    const data = articleJsonLd({ ...base, imageAbs: 'https://ronpicard.com/resources/og/x.jpg' })
    expect(byType(data, 'BlogPosting')).toMatchObject({
      headline: 'Example',
      description: 'Example article',
      datePublished: '2026-08-22T12:00:00.000Z',
      url: 'https://ronpicard.com/blog/example/',
      mainEntityOfPage: 'https://ronpicard.com/blog/example/',
      image: 'https://ronpicard.com/resources/og/x.jpg',
      author: { '@type': 'Person', name: 'Ron Picard' },
      publisher: { '@type': 'Person', name: 'Ron Picard' },
    })
    expect(byType(data, 'BreadcrumbList')).toMatchObject({
      itemListElement: [
        { position: 1, name: 'Home', item: 'https://ronpicard.com/' },
        { position: 2, name: 'Example', item: 'https://ronpicard.com/blog/example/' },
      ],
    })
    expect(byType(data, 'Person')).toBeDefined()
    expect(byType(data, 'VideoObject')).toBeUndefined()
    expect(byType(data, 'SoftwareSourceCode')).toBeUndefined()
  })

  it('describes a valid YouTube video and links it from the posting', () => {
    const data = articleJsonLd({ ...base, youtubeId: 'idmsdgX5hJQ' })
    expect(byType(data, 'VideoObject')).toMatchObject({
      name: 'Example',
      uploadDate: '2026-08-22T12:00:00.000Z',
      thumbnailUrl: ['https://i.ytimg.com/vi/idmsdgX5hJQ/hqdefault.jpg'],
      embedUrl: 'https://www.youtube.com/embed/idmsdgX5hJQ',
    })
    expect(byType(data, 'BlogPosting')).toMatchObject({
      video: { '@id': 'https://ronpicard.com/blog/example/#video' },
    })
  })

  it('ignores YouTube ids that fail validation', () => {
    const data = articleJsonLd({ ...base, youtubeId: 'bad id"/><x' })
    expect(byType(data, 'VideoObject')).toBeUndefined()
    expect(byType(data, 'BlogPosting')).not.toHaveProperty('video')
  })

  it('describes GitHub source code, and only for GitHub repo URLs', () => {
    const data = articleJsonLd({ ...base, repoUrl: 'https://github.com/ronpicard/example' })
    expect(byType(data, 'SoftwareSourceCode')).toMatchObject({
      codeRepository: 'https://github.com/ronpicard/example',
    })
    const other = articleJsonLd({ ...base, repoUrl: 'https://evil.example/ronpicard/example' })
    expect(byType(other, 'SoftwareSourceCode')).toBeUndefined()
  })
})
