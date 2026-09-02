// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AmbientParticles } from './AmbientParticles'

let container: HTMLDivElement
let root: Root

type FakeCtx = {
  fillRect: ReturnType<typeof vi.fn>
  setTransform: ReturnType<typeof vi.fn>
  clearRect: ReturnType<typeof vi.fn>
  beginPath: ReturnType<typeof vi.fn>
  moveTo: ReturnType<typeof vi.fn>
  lineTo: ReturnType<typeof vi.fn>
  stroke: ReturnType<typeof vi.fn>
  arc: ReturnType<typeof vi.fn>
  fill: ReturnType<typeof vi.fn>
  globalCompositeOperation: string
  globalAlpha: number
  fillStyle: string
  strokeStyle: string
  lineWidth: number
  lineCap: string
  shadowBlur: number
  shadowColor: string
}

function makeCtx(): FakeCtx {
  return {
    fillRect: vi.fn(),
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    globalCompositeOperation: 'source-over',
    globalAlpha: 1,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    lineCap: '',
    shadowBlur: 0,
    shadowColor: '',
  }
}

/** Number of strokes and fills issued so far. */
function painted() {
  return ctx.stroke.mock.calls.length + ctx.fill.mock.calls.length
}

let ctx: FakeCtx
let rafCallbacks: Map<number, FrameRequestCallback>
let rafId: number
let reducedMotion: boolean
let mediaListeners: Array<(e: { matches: boolean }) => void>

function runFrame(ts: number) {
  const pending = [...rafCallbacks.entries()]
  rafCallbacks.clear()
  for (const [, cb] of pending) cb(ts)
}

beforeEach(() => {
  ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)

  ctx = makeCtx()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () => ctx as unknown as CanvasRenderingContext2D,
  )

  rafCallbacks = new Map()
  rafId = 0
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((cb: FrameRequestCallback) => {
      rafId += 1
      rafCallbacks.set(rafId, cb)
      return rafId
    }),
  )
  vi.stubGlobal(
    'cancelAnimationFrame',
    vi.fn((id: number) => {
      rafCallbacks.delete(id)
    }),
  )

  reducedMotion = false
  mediaListeners = []
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      // Live getter: a real MediaQueryList updates `matches` before firing change.
      get matches() {
        return query.includes('reduce') ? reducedMotion : false
      },
      media: query,
      addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => {
        mediaListeners.push(fn)
      },
      removeEventListener: (_: string, fn: (e: { matches: boolean }) => void) => {
        mediaListeners = mediaListeners.filter((l) => l !== fn)
      },
    })),
  )

  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 })
  Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 1 })
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

async function mount() {
  await act(async () => {
    root.render(<AmbientParticles />)
  })
  return container.querySelector('canvas.ambient-particles') as HTMLCanvasElement
}

describe('AmbientParticles', () => {
  it('renders a single decorative canvas that keeps the ambient-particles hook class', async () => {
    const canvas = await mount()
    expect(canvas).not.toBeNull()
    expect(canvas.getAttribute('aria-hidden')).toBe('true')
    expect(container.querySelectorAll('.ambient-particles').length).toBe(1)
  })

  it('sizes the backing store to the viewport times the device pixel ratio', async () => {
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 1.5 })
    const canvas = await mount()
    expect(canvas.width).toBe(1500)
    expect(canvas.height).toBe(900)
    expect(ctx.setTransform).toHaveBeenCalledWith(1.5, 0, 0, 1.5, 0, 0)
  })

  it('caps the device pixel ratio at 2 so 3x phones do not pay for a 9x fill', async () => {
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 3 })
    const canvas = await mount()
    expect(canvas.width).toBe(2000)
    expect(canvas.height).toBe(1200)
  })

  it('paints an initial field immediately and then animates on requestAnimationFrame', async () => {
    await mount()
    expect(painted()).toBeGreaterThan(0)
    expect(ctx.stroke).toHaveBeenCalled()
    expect(ctx.fill).toHaveBeenCalled()
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1)

    ctx.stroke.mockClear()
    ctx.fill.mockClear()
    ctx.fillRect.mockClear()
    act(() => runFrame(0))
    act(() => runFrame(50))
    // A frame fades the previous trails (erase pass) and paints the newly covered segments.
    expect(ctx.fillRect).toHaveBeenCalled()
    expect(ctx.stroke).toHaveBeenCalled()
    expect(rafCallbacks.size).toBe(1)
  })

  it('fades using destination-out so the page background stays visible through the canvas', async () => {
    await mount()
    const ops: string[] = []
    ctx.fillRect.mockImplementation(() => {
      ops.push(ctx.globalCompositeOperation)
    })
    act(() => runFrame(0))
    act(() => runFrame(100))
    expect(ops).toContain('destination-out')
    // Traces are painted normally after the erase pass.
    expect(ctx.globalCompositeOperation).toBe('source-over')
  })

  it('draws a static field and never schedules a frame when reduced motion is preferred', async () => {
    reducedMotion = true
    await mount()
    expect(painted()).toBeGreaterThan(0)
    expect(requestAnimationFrame).not.toHaveBeenCalled()
  })

  it('starts and stops animating when the reduced-motion preference changes', async () => {
    await mount()
    expect(rafCallbacks.size).toBe(1)
    reducedMotion = true
    act(() => {
      for (const l of mediaListeners) l({ matches: true })
    })
    expect(rafCallbacks.size).toBe(0)
    reducedMotion = false
    act(() => {
      for (const l of mediaListeners) l({ matches: false })
    })
    expect(rafCallbacks.size).toBe(1)
  })

  it('rebuilds the field when the window resizes', async () => {
    const canvas = await mount()
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 300 })
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(canvas.width).toBe(500)
    expect(canvas.height).toBe(300)
  })

  it('cancels the frame loop and listeners on unmount', async () => {
    await mount()
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    act(() => root.unmount())
    expect(cancelAnimationFrame).toHaveBeenCalled()
    expect(rafCallbacks.size).toBe(0)
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(mediaListeners.length).toBe(0)
    // Re-create a root so afterEach's unmount has something harmless to unmount.
    root = createRoot(container)
  })

  it('does nothing when the 2d context is unavailable', async () => {
    ;(HTMLCanvasElement.prototype.getContext as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => null,
    )
    const canvas = await mount()
    expect(canvas).not.toBeNull()
    expect(requestAnimationFrame).not.toHaveBeenCalled()
  })

  it('keeps hydration-safe markup: no inline styles or children on the canvas', async () => {
    const canvas = await mount()
    expect(canvas.getAttribute('style')).toBeNull()
    expect(canvas.childNodes.length).toBe(0)
  })
})
