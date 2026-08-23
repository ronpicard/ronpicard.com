// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { EmbedFrame } from './EmbedFrame'

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
  document.body.style.overflow = ''
})

describe('EmbedFrame', () => {
  it('renders a sandboxed demo iframe', () => {
    act(() => {
      root.render(
        <EmbedFrame
          title="Demo app"
          src="https://ronpicard.github.io/example/"
          sandbox="allow-scripts allow-same-origin"
          allow="clipboard-write; fullscreen"
        />,
      )
    })

    const iframe = container.querySelector('iframe')
    expect(iframe).not.toBeNull()
    expect(iframe?.getAttribute('src')).toBe('https://ronpicard.github.io/example/')
    expect(iframe?.getAttribute('sandbox')).toContain('allow-scripts')
    expect(iframe?.getAttribute('title')).toBe('Demo app')
    expect(container.querySelector('.embed-frame--demo')).not.toBeNull()
  })

  it('toggles full-view mode and locks body scroll while expanded', () => {
    act(() => {
      root.render(
        <EmbedFrame
          title="Demo app"
          src="https://ronpicard.github.io/example/"
          sandbox="allow-scripts"
        />,
      )
    })

    const button = container.querySelector('button.embed-frame__expand') as HTMLButtonElement
    expect(button).not.toBeNull()
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(container.querySelector('.embed-frame--expanded')).toBeNull()

    act(() => {
      button.click()
    })

    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(button.textContent).toMatch(/exit/i)
    expect(container.querySelector('.embed-frame--expanded')).not.toBeNull()
    expect(document.body.style.overflow).toBe('hidden')

    act(() => {
      button.click()
    })

    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(container.querySelector('.embed-frame--expanded')).toBeNull()
    expect(document.body.style.overflow).toBe('')
  })

  it('exits full view on Escape', () => {
    act(() => {
      root.render(
        <EmbedFrame
          title="Demo app"
          src="https://ronpicard.github.io/example/"
          sandbox="allow-scripts"
        />,
      )
    })

    const button = container.querySelector('button.embed-frame__expand') as HTMLButtonElement
    act(() => {
      button.click()
    })
    expect(container.querySelector('.embed-frame--expanded')).not.toBeNull()

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(container.querySelector('.embed-frame--expanded')).toBeNull()
    expect(document.body.style.overflow).toBe('')
  })
})
