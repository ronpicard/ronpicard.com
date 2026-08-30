// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getArticleTitleList } from '../data/articles'
import { SiteSearch } from './SiteSearch'

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

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="path">{location.pathname}</output>
}

function renderSearch(initialPath = '/') {
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[initialPath]}>
        <SiteSearch />
        <Routes>
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    )
  })
}

function toggle() {
  return container.querySelector<HTMLButtonElement>('.site-search__toggle')!
}

function input() {
  return container.querySelector<HTMLInputElement>('.site-search__input')
}

function openPanel() {
  act(() => toggle().click())
}

function type(text: string) {
  const el = input()!
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    setter.call(el, text)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function pressKey(key: string) {
  act(() => {
    input()!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  })
}

describe('SiteSearch', () => {
  it('opens with the full result list capped at 24 and closes from the toggle', async () => {
    renderSearch()
    expect(input()).toBeNull()

    openPanel()
    expect(input()).not.toBeNull()
    // An empty query matches everything; the list is capped at 24 entries.
    expect(container.querySelectorAll('.site-search__link').length).toBe(24)

    // The deferred autofocus lands on the input.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5))
    })
    expect(document.activeElement).toBe(input())

    act(() => toggle().click())
    expect(input()).toBeNull()
  })

  it('lists matching articles for a query and reports no matches otherwise', () => {
    renderSearch()
    openPanel()

    const known = getArticleTitleList()[0]!
    type(known.title.slice(0, 12))
    const titles = Array.from(container.querySelectorAll('.site-search__link-title')).map(
      (el) => el.textContent,
    )
    expect(titles).toContain(known.title)

    type('zzzz-no-such-article-zzzz')
    expect(container.querySelector('.site-search__empty')?.textContent).toBe('No matches.')
  })

  it('supports arrow-key navigation with wrap-around and Enter to open the active result', () => {
    renderSearch()
    openPanel()
    type('a')
    const options = container.querySelectorAll('.site-search__link')
    expect(options.length).toBeGreaterThan(1)

    pressKey('ArrowDown')
    expect(container.querySelector('[aria-selected="true"]')?.id).toMatch(/option-0$/)
    pressKey('ArrowUp')
    expect(container.querySelector('[aria-selected="true"]')?.id).toMatch(
      new RegExp(`option-${options.length - 1}$`),
    )
    pressKey('ArrowDown')
    expect(container.querySelector('[aria-selected="true"]')?.id).toMatch(/option-0$/)

    const activeSlug = container
      .querySelector<HTMLAnchorElement>('[aria-selected="true"]')!
      .getAttribute('href')
    pressKey('Enter')
    expect(container.querySelector<HTMLOutputElement>('[data-testid="path"]')?.textContent).toBe(
      activeSlug,
    )
    // Navigation closes the panel.
    expect(input()).toBeNull()
  })

  it('ignores arrow keys with no results and Enter with no active option', () => {
    renderSearch()
    openPanel()
    type('zzzz-no-such-article-zzzz')
    pressKey('ArrowDown')
    pressKey('Enter')
    expect(input()).not.toBeNull()
    expect(container.querySelector<HTMLOutputElement>('[data-testid="path"]')?.textContent).toBe('/')
  })

  it('marks the hovered option active', () => {
    renderSearch()
    openPanel()
    type('a')
    const second = container.querySelectorAll<HTMLAnchorElement>('.site-search__link')[1]!
    act(() => {
      // React drives onMouseEnter from delegated mouseover events.
      second.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    })
    expect(container.querySelector('[aria-selected="true"]')?.id).toMatch(/option-1$/)
  })

  it('closes on Escape and on clicks outside the panel', () => {
    renderSearch()
    openPanel()
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    expect(input()).toBeNull()

    openPanel()
    act(() => {
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })
    expect(input()).toBeNull()

    // A click inside the panel keeps it open.
    openPanel()
    act(() => {
      input()!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })
    expect(input()).not.toBeNull()
  })

  it('caps the query length', () => {
    renderSearch()
    openPanel()
    type('x'.repeat(500))
    expect(input()!.value.length).toBeLessThan(500)
  })
})
