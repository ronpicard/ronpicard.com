// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { ArticleSeries } from '../data/articles'
import { SeriesNav, seriesPartLabel } from './SeriesNav'

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

function render(series: ArticleSeries) {
  act(() => {
    root.render(
      <MemoryRouter>
        <SeriesNav series={series} />
      </MemoryRouter>,
    )
  })
}

const middle: ArticleSeries = {
  name: 'Formal Methods 101',
  part: 4,
  total: 11,
  prev: { slug: 'formal-methods-101-zero-order-logic', title: 'Zero-Order Logic', part: 3 },
  next: { slug: 'formal-methods-101-second-order-logic', title: 'Second-Order Logic', part: 5 },
}

describe('SeriesNav', () => {
  it('labels the part and links the parts either side with trailing-slash URLs', () => {
    render(middle)
    expect(seriesPartLabel(middle)).toBe('Part 4 of 11')
    expect(container.querySelector('nav')?.getAttribute('aria-label')).toBe('Formal Methods 101 series')
    expect(container.textContent).toContain('Formal Methods 101 · Part 4 of 11')
    const links = [...container.querySelectorAll('a')]
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/blog/formal-methods-101-zero-order-logic/',
      '/blog/formal-methods-101-second-order-logic/',
    ])
    expect(links.map((a) => a.getAttribute('rel'))).toEqual(['prev', 'next'])
    expect(links[0]?.textContent).toContain('part 3')
    expect(links[1]?.textContent).toContain('Second-Order Logic')
  })

  it('shows only the link that exists at either end of a series', () => {
    render({ ...middle, part: 1, prev: null })
    expect(container.querySelectorAll('a')).toHaveLength(1)
    expect(container.querySelector('a')?.getAttribute('rel')).toBe('next')
    render({ ...middle, part: 11, next: null })
    expect(container.querySelector('a')?.getAttribute('rel')).toBe('prev')
  })
})
