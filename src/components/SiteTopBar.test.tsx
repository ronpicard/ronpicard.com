// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { SOCIAL } from '../config/site'
import { SiteTopBar } from './SiteTopBar'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => {
    root.render(
      <MemoryRouter>
        <SiteTopBar />
      </MemoryRouter>,
    )
  })
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('SiteTopBar', () => {
  it.each([
    ['LinkedIn', SOCIAL.linkedin],
    ['GitHub', SOCIAL.github],
    ['Wyvern Systems', SOCIAL.wyvern],
  ])('links the %s icon to its site in a new, isolated tab', (label, href) => {
    const link = container.querySelector<HTMLAnchorElement>(`a[aria-label="${label}"]`)
    expect(link).not.toBeNull()
    expect(link?.getAttribute('href')).toBe(href)
    expect(link?.getAttribute('target')).toBe('_blank')
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('draws the Wyvern Systems icon from the company logo image', () => {
    const logo = container.querySelector<HTMLImageElement>(
      'a[aria-label="Wyvern Systems"] img.site-top-bar__wyvern',
    )
    expect(logo).not.toBeNull()
    expect(logo?.getAttribute('src')).toMatch(/\/wyvern-systems-logo\.png$/)
    expect(logo?.getAttribute('alt')).toBe('')
  })

  it('draws LinkedIn in its brand blue with a white "in"', () => {
    const icon = container.querySelector('a[aria-label="LinkedIn"] svg')
    expect(icon?.querySelector('path')?.getAttribute('fill')).toBe('#0a66c2')
    expect(icon?.querySelector('rect')?.getAttribute('fill')).toBe('#fff')
  })

  it('draws GitHub as its standard white mark', () => {
    const icon = container.querySelector('a[aria-label="GitHub"] svg')
    expect(icon?.querySelector('path')?.getAttribute('fill')).toBe('#fff')
  })

  it('shows the icons after the search control, with Wyvern Systems last', () => {
    const labels = Array.from(
      container.querySelectorAll('.site-top-bar__social > *'),
    ).map((el) => el.getAttribute('aria-label'))
    expect(labels.slice(-3)).toEqual(['LinkedIn', 'GitHub', 'Wyvern Systems'])
  })
})
