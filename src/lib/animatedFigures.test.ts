// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PAUSE_HINT, PLAY_HINT, playAnimatedFigures } from './animatedFigures'

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void
let observers: { callback: Callback; observed: Element[]; disconnected: boolean }[]

class FakeObserver {
  observed: Element[] = []
  disconnected = false
  constructor(public callback: Callback) {
    observers.push(this)
  }
  observe(el: Element) {
    this.observed.push(el)
  }
  disconnect() {
    this.disconnected = true
  }
}

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduce && query.includes('reduce') }))
}

function figure(src: string, animated = true): HTMLImageElement {
  const img = document.createElement('img')
  img.setAttribute('src', src)
  if (animated) img.className = 'article-animated'
  document.body.append(img)
  return img
}

function show(img: Element, ratio: number) {
  observers[0]!.callback([{ target: img, isIntersecting: ratio > 0, intersectionRatio: ratio }])
}

beforeEach(() => {
  observers = []
  vi.stubGlobal('IntersectionObserver', FakeObserver)
  mockReducedMotion(false)
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('playAnimatedFigures', () => {
  it('watches only figures marked as animated', () => {
    const animated = figure('/resources/a.svg')
    figure('/resources/b.svg', false)
    playAnimatedFigures(document.body)
    expect(observers).toHaveLength(1)
    expect(observers[0]!.observed).toEqual([animated])
  })

  it('plays a figure once it is mostly visible and resets it when it leaves, so it replays', () => {
    const img = figure('/resources/a.svg')
    playAnimatedFigures(document.body)

    show(img, 0.3)
    expect(img.getAttribute('src')).toBe('/resources/a.svg')
    show(img, 0.8)
    expect(img.getAttribute('src')).toBe('/resources/a.svg#play')
    show(img, 0.7)
    expect(img.getAttribute('src')).toBe('/resources/a.svg#play')
    show(img, 0)
    expect(img.getAttribute('src')).toBe('/resources/a.svg')
    show(img, 0.9)
    expect(img.getAttribute('src')).toBe('/resources/a.svg#play')
  })

  it('stops watching and restores the still frame on cleanup', () => {
    const img = figure('/resources/a.svg')
    const stop = playAnimatedFigures(document.body)
    show(img, 1)
    stop()
    expect(observers[0]!.disconnected).toBe(true)
    expect(img.getAttribute('src')).toBe('/resources/a.svg')
    expect(img.hasAttribute('tabindex')).toBe(false)
    expect(img.hasAttribute('title')).toBe(false)
    img.click()
    expect(img.getAttribute('src')).toBe('/resources/a.svg')
  })

  it('keeps the still frame for visitors who prefer reduced motion', () => {
    mockReducedMotion(true)
    const img = figure('/resources/a.svg')
    playAnimatedFigures(document.body)()
    expect(observers).toHaveLength(0)
    expect(img.getAttribute('src')).toBe('/resources/a.svg')
  })

  it('does nothing without IntersectionObserver or animated figures', () => {
    figure('/resources/a.svg', false)
    playAnimatedFigures(document.body)()
    expect(observers).toHaveLength(0)

    vi.stubGlobal('IntersectionObserver', undefined)
    figure('/resources/c.svg')
    expect(() => playAnimatedFigures(document.body)()).not.toThrow()
  })

  it('pauses and resumes on click or Enter/Space, and stays paused while visible', () => {
    const img = figure('/resources/a.svg')
    playAnimatedFigures(document.body)
    expect(img.tabIndex).toBe(0)
    show(img, 1)
    expect(img.getAttribute('src')).toBe('/resources/a.svg#play')
    expect(img.title).toBe(PAUSE_HINT)

    img.click()
    expect(img.getAttribute('src')).toBe('/resources/a.svg')
    expect(img.title).toBe(PLAY_HINT)
    show(img, 0)
    show(img, 1)
    expect(img.getAttribute('src')).toBe('/resources/a.svg')

    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })
    img.dispatchEvent(enter)
    expect(enter.defaultPrevented).toBe(true)
    expect(img.getAttribute('src')).toBe('/resources/a.svg#play')
    img.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
    expect(img.getAttribute('src')).toBe('/resources/a.svg')
    img.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    expect(img.getAttribute('src')).toBe('/resources/a.svg')
  })

  it('does not start a figure paused off-screen when it scrolls into view', () => {
    const img = figure('/resources/a.svg')
    playAnimatedFigures(document.body)
    img.click()
    show(img, 1)
    expect(img.getAttribute('src')).toBe('/resources/a.svg')
    img.click()
    expect(img.getAttribute('src')).toBe('/resources/a.svg#play')
  })

  it('ignores a figure with no source', () => {
    const img = figure('')
    playAnimatedFigures(document.body)
    show(img, 1)
    expect(img.getAttribute('src')).toBe('')
  })
})
