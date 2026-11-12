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
  return <output data-testid="path">{location.pathname + location.search}</output>
}

/** Renders the search on a non-home page unless told otherwise. */
function renderSearch(initialPath = '/blog/some-post/') {
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

const path = () => container.querySelector('[data-testid="path"]')?.textContent
const root$ = () => container.querySelector<HTMLDivElement>('.site-search')!
const toggle = () => container.querySelector<HTMLButtonElement>('.site-search__toggle')!
const input = () => container.querySelector<HTMLInputElement>('.site-search__input')!
const options = () => container.querySelectorAll<HTMLAnchorElement>('.site-search__link')
const activeId = () => container.querySelector('[aria-selected="true"]')?.id

function focusInput() {
  act(() => input().focus())
}

function type(text: string) {
  const el = input()
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    setter.call(el, text)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function pressKey(key: string) {
  act(() => {
    input().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  })
}

describe('SiteSearch', () => {
  it('is a small always-present box with a "Search" placeholder', () => {
    renderSearch()
    expect(input().placeholder).toBe('Search')
    expect(input().type).toBe('search')
    expect(container.querySelector('.site-search__results')).toBeNull()
  })

  it('opens the box from the phone toggle and focuses it within the tap', () => {
    renderSearch()
    expect(root$().dataset.expanded).toBeUndefined()
    expect(toggle().getAttribute('aria-expanded')).toBe('false')
    act(() => toggle().click())
    expect(root$().dataset.expanded).toBe('true')
    expect(document.activeElement).toBe(input())

    // Leaving it empty collapses it again; leaving text keeps it open.
    act(() => input().blur())
    expect(root$().dataset.expanded).toBeUndefined()
    act(() => toggle().click())
    type('chess')
    act(() => input().blur())
    expect(root$().dataset.expanded).toBe('true')
  })

  describe('away from the home page', () => {
    it('lists matching posts in a dropdown and reports no matches otherwise', () => {
      renderSearch()
      focusInput()
      expect(input().getAttribute('role')).toBe('combobox')
      const known = getArticleTitleList()[0]!
      type(known.title.slice(0, 12))
      const titles = [...container.querySelectorAll('.site-search__link-title')].map(
        (el) => el.textContent,
      )
      expect(titles).toContain(known.title)
      expect(input().getAttribute('aria-expanded')).toBe('true')

      type('zzzz-no-such-article-zzzz')
      expect(container.querySelector('.site-search__empty')?.textContent).toBe('No matches.')
    })

    it('caps the dropdown at 24 results', () => {
      renderSearch()
      focusInput()
      type('a')
      expect(options().length).toBe(24)
    })

    it('supports arrow keys with wrap-around and Enter to open the active result', () => {
      renderSearch()
      focusInput()
      type('a')
      const count = options().length
      pressKey('ArrowDown')
      expect(activeId()).toMatch(/option-0$/)
      pressKey('ArrowUp')
      expect(activeId()).toMatch(new RegExp(`option-${count - 1}$`))
      pressKey('ArrowDown')
      expect(activeId()).toMatch(/option-0$/)

      const href = container.querySelector<HTMLAnchorElement>('[aria-selected="true"]')!
        .getAttribute('href')
      pressKey('Enter')
      expect(path()).toBe(href)
      // Moving to another page empties and closes the box.
      expect(input().value).toBe('')
      expect(container.querySelector('.site-search__results')).toBeNull()
    })

    it('sends Enter with no highlighted result to the filtered home page', () => {
      renderSearch()
      focusInput()
      type('  formal methods ')
      pressKey('Enter')
      expect(path()).toBe('/?q=formal+methods')
    })

    it('ignores arrow keys with no results and Enter on an empty box', () => {
      renderSearch()
      focusInput()
      type('zzzz-no-such-article-zzzz')
      pressKey('ArrowDown')
      expect(activeId()).toBeUndefined()
      type('')
      pressKey('Enter')
      expect(path()).toBe('/blog/some-post/')
    })

    it('marks the hovered option active', () => {
      renderSearch()
      focusInput()
      type('a')
      act(() => {
        // React drives onMouseEnter from delegated mouseover events.
        options()[1]!.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
      })
      expect(activeId()).toMatch(/option-1$/)
    })

    it('clears on Escape, then collapses on a second Escape', () => {
      renderSearch()
      act(() => toggle().click())
      type('chess')
      pressKey('Escape')
      expect(input().value).toBe('')
      expect(container.querySelector('.site-search__results')).toBeNull()
      expect(root$().dataset.expanded).toBe('true')
      pressKey('Escape')
      expect(root$().dataset.expanded).toBeUndefined()
    })

    it('closes the dropdown on clicks outside it but not inside', () => {
      renderSearch()
      focusInput()
      type('chess')
      act(() => {
        input().dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      })
      expect(container.querySelector('.site-search__results')).not.toBeNull()
      act(() => {
        document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      })
      expect(container.querySelector('.site-search__results')).toBeNull()
      expect(input().value).toBe('chess')
    })
  })

  describe('on the home page', () => {
    it('writes the query to ?q= instead of opening a dropdown', () => {
      renderSearch('/')
      focusInput()
      expect(input().getAttribute('role')).toBeNull()
      type('chess')
      expect(path()).toBe('/?q=chess')
      expect(container.querySelector('.site-search__results')).toBeNull()
      pressKey('ArrowDown')
      pressKey('Enter')
      expect(path()).toBe('/?q=chess')
      type('')
      expect(path()).toBe('/')
    })

    it('starts from the ?q= in the URL and shows the box open', () => {
      renderSearch('/?q=solo')
      expect(input().value).toBe('solo')
      expect(root$().dataset.expanded).toBe('true')
    })

    it('keeps every keystroke when typing faster than the URL updates', () => {
      renderSearch('/')
      act(() => {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
        for (const text of ['c', 'cl', 'cla', 'clam', 'clama', 'clamav']) {
          setter.call(input(), text)
          input().dispatchEvent(new Event('input', { bubbles: true }))
        }
      })
      expect(input().value).toBe('clamav')
      expect(path()).toBe('/?q=clamav')
    })
  })

  it('caps the query length', () => {
    renderSearch()
    type('x'.repeat(500))
    expect(input().value.length).toBeLessThan(500)
  })
})
