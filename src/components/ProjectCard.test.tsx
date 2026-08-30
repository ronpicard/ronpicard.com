// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ProjectCard, type ProjectListItem } from './ProjectCard'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

function item(overrides: Partial<ProjectListItem> = {}): ProjectListItem {
  return {
    slug: 'demo',
    title: 'Demo',
    date: '2026-01-01',
    kind: 'app',
    imageUrl: 'resources/card.png',
    showDemo: false,
    showCode: false,
    articleUrl: null,
    demoUrl: null,
    repoUrl: null,
    videoUrl: null,
    pdfLinks: [],
    ...overrides,
  }
}

function renderCard(props: { item: ProjectListItem; priority?: boolean }) {
  act(() => {
    root.render(
      <MemoryRouter>
        <ProjectCard {...props} />
      </MemoryRouter>,
    )
  })
  return container.querySelector('img')
}

describe('ProjectCard image loading', () => {
  it('loads the generated thumbnail lazily by default', () => {
    const img = renderCard({ item: item() })
    expect(img?.getAttribute('src')).toMatch(/\/resources\/thumbs\/card\.webp$/)
    expect(img?.getAttribute('loading')).toBe('lazy')
    expect(img?.getAttribute('fetchpriority')).toBeNull()
  })

  it('loads priority cards eagerly with high fetch priority', () => {
    const img = renderCard({ item: item(), priority: true })
    expect(img?.getAttribute('loading')).toBe('eager')
    expect(img?.getAttribute('fetchpriority')).toBe('high')
  })

  it('falls back to the original image when the thumbnail fails to load', () => {
    const img = renderCard({ item: item() })
    act(() => {
      img?.dispatchEvent(new Event('error'))
    })
    const fallback = container.querySelector('img')
    expect(fallback?.getAttribute('src')).toMatch(/\/resources\/card\.png$/)
  })

  it('uses external thumbnails as-is', () => {
    const url = 'https://img.youtube.com/vi/Glhr3OIjwsI/maxresdefault.jpg'
    const img = renderCard({ item: item({ imageUrl: url }) })
    expect(img?.getAttribute('src')).toBe(url)
  })

  it('renders no image element when there is no title image', () => {
    const img = renderCard({ item: item({ imageUrl: null }) })
    expect(img).toBeNull()
  })
})
