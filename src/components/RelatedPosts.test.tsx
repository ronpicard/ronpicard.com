// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { articles, getArticlesByTopic } from '../data/articles'
import { RelatedPosts } from './RelatedPosts'

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

function renderPosts(article: (typeof articles)[number]) {
  act(() => {
    root.render(
      <MemoryRouter>
        <RelatedPosts article={article} />
      </MemoryRouter>,
    )
  })
}

describe('RelatedPosts', () => {
  it('shows three trailing-slash post links and a topic hub link', () => {
    const article = getArticlesByTopic('aviation')[0]!
    renderPosts(article)
    expect(container.querySelector('h2')?.textContent).toBe('More in Aviation & Hobbies')
    const links = [...container.querySelectorAll('.related-posts__link')]
    expect(links).toHaveLength(3)
    for (const a of links) {
      expect(a.getAttribute('href')).toMatch(/^\/blog\/[^/]+\/$/)
    }
    const all = container.querySelector('.related-posts__all a')
    expect(all?.getAttribute('href')).toBe('/topics/aviation/')
    expect(all?.textContent).toContain('All Aviation & Hobbies posts')
  })

  it('renders nothing for a post without a topic', () => {
    renderPosts({ ...articles[0]!, topic: null })
    expect(container.innerHTML).toBe('')
  })
})
