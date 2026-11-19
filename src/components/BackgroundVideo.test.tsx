// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BackgroundVideo } from './BackgroundVideo'

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void

let observers: { callback: Callback; observed: Element[]; disconnected: boolean }[]
let container: HTMLDivElement
let root: Root
let play: ReturnType<typeof vi.fn<() => Promise<void>>>
let pause: ReturnType<typeof vi.fn<() => void>>

class FakeObserver {
  record: (typeof observers)[number]
  constructor(callback: Callback) {
    this.record = { callback, observed: [], disconnected: false }
    observers.push(this.record)
  }
  observe(el: Element) {
    this.record.observed.push(el)
  }
  disconnect() {
    this.record.disconnected = true
  }
}

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduce && query.includes('reduce') }))
}

function render() {
  act(() => {
    root.render(<BackgroundVideo src="https://botlegger.com/video/hero_dark.mp4" poster="/resources/tour.webp" label="A tour" />)
  })
  return container.querySelector('video')!
}

function show(visible: boolean) {
  act(() => observers[0]!.callback([{ isIntersecting: visible }]))
}

const toggle = () => container.querySelector<HTMLButtonElement>('.background-video__toggle')

beforeEach(() => {
  ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  observers = []
  vi.stubGlobal('IntersectionObserver', FakeObserver)
  mockReducedMotion(false)
  play = vi.fn<() => Promise<void>>(() => Promise.resolve())
  pause = vi.fn<() => void>()
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(play)
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pause)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('BackgroundVideo', () => {
  it('renders a muted, looping video that loads nothing until played', () => {
    const video = render()
    expect(video.muted).toBe(true)
    expect(video.loop).toBe(true)
    expect(video.getAttribute('preload')).toBe('none')
    expect(video.getAttribute('poster')).toBe('/resources/tour.webp')
    expect(video.getAttribute('aria-label')).toBe('A tour')
    expect(video.hasAttribute('controls')).toBe(false)
    expect(video.querySelector('source')?.getAttribute('src')).toBe('https://botlegger.com/video/hero_dark.mp4')
  })

  it('plays only while in view', () => {
    const video = render()
    expect(observers[0]!.observed).toEqual([video])
    expect(play).not.toHaveBeenCalled()
    show(true)
    expect(play).toHaveBeenCalledTimes(1)
    show(false)
    expect(pause).toHaveBeenCalledTimes(1)
  })

  it('stays paused after the visitor pauses it, until they press play', () => {
    render()
    show(true)
    act(() => toggle()!.click())
    expect(pause).toHaveBeenCalled()
    expect(toggle()!.getAttribute('aria-label')).toBe('Play the background video')
    expect(toggle()!.getAttribute('aria-pressed')).toBe('true')
    show(false)
    show(true)
    expect(play).toHaveBeenCalledTimes(1)
    act(() => toggle()!.click())
    expect(play).toHaveBeenCalledTimes(2)
    expect(toggle()!.getAttribute('aria-label')).toBe('Pause the background video')
  })

  it('does not start playing when resumed off-screen', () => {
    render()
    act(() => toggle()!.click())
    act(() => toggle()!.click())
    expect(play).not.toHaveBeenCalled()
  })

  it('shows only the poster, with no toggle, under reduced motion', () => {
    mockReducedMotion(true)
    render()
    expect(observers).toHaveLength(0)
    expect(toggle()).toBeNull()
  })

  it('shows only the poster without IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    render()
    expect(toggle()).toBeNull()
  })

  it('stops observing when removed', () => {
    render()
    act(() => root.unmount())
    expect(observers[0]!.disconnected).toBe(true)
    root = createRoot(container)
  })
})
