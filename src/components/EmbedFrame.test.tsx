// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EmbedFrame } from './EmbedFrame'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  vi.stubGlobal('scrollTo', vi.fn())
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  document.body.removeAttribute('style')
  vi.unstubAllGlobals()
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
    Object.defineProperty(window, 'scrollY', { value: 120, configurable: true, writable: true })
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
    // iOS Safari ignores body overflow: hidden, so the lock also fixes the body in place.
    expect(document.body.style.position).toBe('fixed')
    expect(document.body.style.top).toBe('-120px')

    act(() => {
      button.click()
    })

    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(container.querySelector('.embed-frame--expanded')).toBeNull()
    expect(document.body.style.overflow).toBe('')
    expect(document.body.style.position).toBe('')
    expect(document.body.style.top).toBe('')
    expect(window.scrollTo).toHaveBeenCalledWith(0, 120)
  })

  it('guards the inline iframe behind a tap-to-interact overlay', () => {
    act(() => {
      root.render(
        <EmbedFrame
          title="Demo app"
          src="https://ronpicard.github.io/example/"
          sandbox="allow-scripts"
        />,
      )
    })

    const guard = container.querySelector('button.embed-frame__touch-guard') as HTMLButtonElement
    expect(guard).not.toBeNull()
    expect(guard.textContent).toMatch(/tap to interact/i)

    act(() => {
      guard.click()
    })

    expect(container.querySelector('.embed-frame__touch-guard')).toBeNull()
  })

  it('hides the touch guard in full view and restores it after exit if never activated', () => {
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
    expect(container.querySelector('.embed-frame__touch-guard')).toBeNull()

    act(() => {
      button.click()
    })
    expect(container.querySelector('.embed-frame__touch-guard')).not.toBeNull()
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
    expect(document.activeElement).toBe(button)
  })

  it('marks the expanded frame as a modal dialog and traps Tab focus inside it', () => {
    act(() => {
      root.render(
        <EmbedFrame
          title="Demo app"
          src="https://ronpicard.github.io/example/"
          sandbox="allow-scripts"
        />,
      )
    })

    const region = container.querySelector('.embed-frame--demo') as HTMLElement
    expect(region.getAttribute('role')).toBe('region')
    expect(region.getAttribute('aria-modal')).toBeNull()

    const button = container.querySelector('button.embed-frame__expand') as HTMLButtonElement
    act(() => {
      button.click()
    })

    expect(region.getAttribute('role')).toBe('dialog')
    expect(region.getAttribute('aria-modal')).toBe('true')
    expect(document.activeElement).toBe(button)

    const iframe = container.querySelector('iframe') as HTMLIFrameElement

    // Tab past the last focusable (iframe) wraps to the toggle button.
    iframe.focus()
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
      )
    })
    expect(document.activeElement).toBe(button)

    // Shift+Tab from the first focusable (button) wraps back to the iframe.
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }),
      )
    })
    expect(document.activeElement).toBe(iframe)

    // Focus that escaped the overlay is pulled back in on the next Tab.
    ;(document.body as HTMLElement).focus?.()
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
      )
    })
    expect(region.contains(document.activeElement)).toBe(true)
  })
})
