// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { articles } from '../data/articles'
import HomePage from './HomePage'

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

function SearchProbe() {
  const location = useLocation()
  return <output data-testid="search">{location.search}</output>
}

function renderHome(initialPath = '/') {
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <HomePage />
                <SearchProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    )
  })
}

function filterInput(): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('.site-search__input')
  if (!input) throw new Error('header search input not rendered')
  return input
}

function typeInto(input: HTMLInputElement, value: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

const cardCount = () => container.querySelectorAll('.project-list__item').length
const status = () => container.querySelector('.post-filter__status')?.textContent ?? ''
const search = () => container.querySelector('[data-testid="search"]')?.textContent ?? ''

describe('HomePage pinned posts', () => {
  const pinned = articles.filter((a) => a.pinned)

  it('leads the grid with each pinned post as a large featured card with a longer summary', () => {
    expect(pinned.map((a) => a.sourceSlug)).toEqual(['botlegger'])
    renderHome()
    const first = container.querySelector('.project-list__item')
    expect(first?.classList.contains('project-list__item--pinned')).toBe(true)
    expect(first?.querySelector('.project-card--featured')).not.toBeNull()
    expect(first?.textContent).toContain('BotLegger')
    expect(first?.querySelector('.project-card__summary')?.textContent).toBe(pinned[0]!.summary)
    expect(container.querySelectorAll('.project-list__item--pinned')).toHaveLength(1)
  })

  it('heads a pinned card with a Featured label and its pinned title', () => {
    renderHome()
    const head = container.querySelector('.project-list__item--pinned .pinned-feature__head')
    expect(head?.querySelector('.pinned-feature__eyebrow')?.textContent).toBe('Featured')
    expect(head?.querySelector('h2')?.textContent).toBe(pinned[0]!.pinnedTitle)
    expect(container.querySelectorAll('.pinned-feature__head')).toHaveLength(1)
  })

  it('shows search results as a uniform grid, pinned posts included', () => {
    renderHome('/?q=botlegger')
    expect(container.querySelector('.project-list__item')?.textContent).toContain('BotLegger')
    expect(container.querySelector('.project-list__item--pinned')).toBeNull()
    expect(container.querySelector('.project-card--featured')).toBeNull()
    expect(container.querySelector('.pinned-feature__head')).toBeNull()
  })
})

describe('HomePage live search', () => {
  it('shows every post, no count, and no big filter box before anything is typed', () => {
    renderHome()
    expect(cardCount()).toBe(articles.length)
    expect(status()).toBe('')
    expect(container.querySelector('.post-filter__input')).toBeNull()
    expect(filterInput().closest('.site-top-bar')).not.toBeNull()
  })

  it('narrows the cards live as the visitor types in the header box', () => {
    renderHome()
    const input = filterInput()

    typeInto(input, 'formal')
    const afterOneWord = cardCount()
    expect(afterOneWord).toBeGreaterThan(0)
    expect(afterOneWord).toBeLessThan(articles.length)

    typeInto(input, 'formal methods 101: induction')
    expect(cardCount()).toBe(1)
    expect(container.querySelector('.project-list__item')?.textContent).toContain('Induction')
    expect(status()).toBe(`1 of ${articles.length} posts match “formal methods 101: induction”`)
  })

  it('matches case-insensitively against full summaries, like the dropdown', () => {
    const long = articles.find((a) => (a.summary ?? '').length > 400)
    if (!long?.summary) throw new Error('expected a post with a long summary')
    // A phrase past the 160-character cut the card summaries use.
    const phrase = long.summary.slice(300, 340).trim().toUpperCase()
    renderHome()
    typeInto(filterInput(), phrase)
    const titles = [...container.querySelectorAll('.project-list__item')].map((li) => li.textContent)
    expect(titles.some((t) => t?.includes(long.title))).toBe(true)
  })

  it('offers a way back when nothing matches, clearing the header box too', () => {
    renderHome()
    typeInto(filterInput(), 'zzzz no such post zzzz')
    expect(cardCount()).toBe(0)

    const clear = container.querySelector<HTMLButtonElement>('.post-filter__clear')
    expect(clear?.textContent).toBe('Show all posts')
    act(() => clear?.click())
    expect(filterInput().value).toBe('')
    expect(cardCount()).toBe(articles.length)
    expect(search()).toBe('')
  })

  it('clears the filter on Escape', () => {
    renderHome()
    const input = filterInput()
    typeInto(input, 'chess')
    expect(cardCount()).toBeLessThan(articles.length)
    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(filterInput().value).toBe('')
    expect(cardCount()).toBe(articles.length)
  })

  it('follows a URL change made elsewhere, such as the Home link', () => {
    renderHome()
    typeInto(filterInput(), 'chess')
    const home = container.querySelector<HTMLAnchorElement>('.site-top-bar a[href="/"]')
    if (!home) throw new Error('home link not rendered')
    act(() => home.click())
    expect(search()).toBe('')
    expect(filterInput().value).toBe('')
    expect(cardCount()).toBe(articles.length)
  })

  it('restores the filter from the URL', () => {
    renderHome('/?q=chess')
    expect(filterInput().value).toBe('chess')
    expect(cardCount()).toBeLessThan(articles.length)
    expect(cardCount()).toBeGreaterThan(0)
  })
})
