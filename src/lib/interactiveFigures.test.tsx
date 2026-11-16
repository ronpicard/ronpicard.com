// @vitest-environment jsdom

import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { INTERACTIVE_FIGURES, mountInteractiveFigures } from './interactiveFigures'
import { prepareArticleBodyHtml } from './sanitizeArticleHtml'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let host: HTMLDivElement

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
})

afterEach(() => {
  host.remove()
})

function mount(): () => void {
  let cleanup = () => {}
  act(() => {
    cleanup = mountInteractiveFigures(host)
  })
  return () => act(() => cleanup())
}

const PLACEHOLDER =
  '<div class="article-interactive article-interactive--gd-learning-rate"><figure id="fb"><p>static</p></figure></div>'

describe('mountInteractiveFigures', () => {
  it('registers the three figure keys', () => {
    expect(Object.keys(INTERACTIVE_FIGURES).sort()).toEqual(['gd-learning-rate', 'momentum-beta', 'sigmoid-neuron'])
  })

  it('does nothing when there are no placeholders', () => {
    host.innerHTML = '<p>hi</p>'
    const cleanup = mount()
    expect(host.innerHTML).toBe('<p>hi</p>')
    cleanup()
  })

  it('mounts known placeholders, hides the fallback, and leaves unknown keys alone', () => {
    host.innerHTML = `${PLACEHOLDER}<div class="article-interactive article-interactive--nope"><p>keep</p></div>`
    const cleanup = mount()
    const [known, unknown] = Array.from(host.querySelectorAll('.article-interactive'))
    expect(known.querySelector('input[type="range"]')).not.toBeNull()
    const fallback = known.querySelector('.article-interactive__fallback') as HTMLElement
    expect(fallback.hidden).toBe(true)
    expect(fallback.querySelector('figure')).not.toBeNull()
    expect(unknown.innerHTML).toBe('<p>keep</p>')
    cleanup()
  })

  it('is idempotent', () => {
    host.innerHTML = PLACEHOLDER
    const first = mount()
    const second = mount()
    expect(host.querySelectorAll('input[type="range"]')).toHaveLength(1)
    second()
    expect(host.querySelectorAll('input[type="range"]')).toHaveLength(1)
    first()
    expect(host.querySelectorAll('input[type="range"]')).toHaveLength(0)
  })

  it('cleanup unmounts and restores the original markup', () => {
    host.innerHTML = PLACEHOLDER
    const cleanup = mount()
    cleanup()
    expect(host.innerHTML).toBe(PLACEHOLDER)
    cleanup()
    expect(host.innerHTML).toBe(PLACEHOLDER)
  })

  it('mounts each component key', () => {
    host.innerHTML = Object.keys(INTERACTIVE_FIGURES)
      .map((k) => `<div class="article-interactive article-interactive--${k}"><p>x</p></div>`)
      .join('')
    const cleanup = mount()
    expect(host.querySelectorAll('.interactive-figure')).toHaveLength(3)
    cleanup()
  })
})

describe('sanitizer', () => {
  it('keeps the placeholder classes', () => {
    const out = prepareArticleBodyHtml(
      '<div class="article-interactive article-interactive--gd-learning-rate"><p>x</p></div>',
    )
    expect(out).toContain('class="article-interactive article-interactive--gd-learning-rate"')
  })
})
