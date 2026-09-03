import { useEffect, useRef } from 'react'
import {
  brightnessAt,
  createField,
  PEAK_FRACTION,
  renderField,
  stepField,
  type Field,
  type Point,
  type Rect,
  type Trace,
} from './circuitPulses'

/** Backing-store scale cap; 3x phones get a 2x canvas, which is indistinguishable at this size. */
const MAX_DPR = 2

/** White light with a faint cool bloom so it still belongs to the site's palette. */
const CORE_RGB = '255, 255, 255'
const HALO_RGB = '190, 255, 235'

/** Elements carrying this attribute keep pulses from spawning or drawing underneath them. */
const EXCLUDE_SELECTOR = '[data-ambient-exclude]'

function excludedRects(): Rect[] {
  const out: Rect[] = []
  for (const el of document.querySelectorAll(EXCLUDE_SELECTOR)) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) out.push({ x: r.left, y: r.top, w: r.width, h: r.height })
  }
  return out
}

/** Restricts drawing to the viewport minus the excluded rectangles. Caller must restore. */
function clipExcluded(ctx: CanvasRenderingContext2D, field: Field) {
  if (field.exclude.length === 0) return
  ctx.beginPath()
  ctx.rect(0, 0, field.width, field.height)
  for (const r of field.exclude) ctx.rect(r.x, r.y, r.w, r.h)
  ctx.clip('evenodd')
}

function gradient(ctx: CanvasRenderingContext2D, a: Point, b: Point, rgb: string, a0: number, a1: number) {
  const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y)
  g.addColorStop(0, `rgba(${rgb}, ${a0})`)
  g.addColorStop(1, `rgba(${rgb}, ${a1})`)
  return g
}

function strokeSegment(ctx: CanvasRenderingContext2D, a: Point, b: Point, rgb: string, a0: number, a1: number, width: number) {
  ctx.strokeStyle = gradient(ctx, a, b, rgb, a0, a1)
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
}

/**
 * Strokes the bar as a chain of linear gradients that fade in from the
 * leading tip and out toward the tail. A linear gradient cannot bend, so the
 * segment holding the peak is split there to keep the bright point sharp.
 */
function strokeBar(ctx: CanvasRenderingContext2D, t: Trace, rgb: string, scale: number, width: number) {
  const peak = t.trailLen * PEAK_FRACTION
  const alphaAt = (d: number) => brightnessAt(d, t.trailLen) * t.alpha * scale
  let d = 0
  for (let i = 1; i < t.points.length; i++) {
    const a = t.points[i - 1]!
    const b = t.points[i]!
    const seg = Math.hypot(b.x - a.x, b.y - a.y)
    if (d < peak && peak < d + seg) {
      const k = (peak - d) / seg
      const mid = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }
      strokeSegment(ctx, a, mid, rgb, alphaAt(d), alphaAt(peak), width)
      strokeSegment(ctx, mid, b, rgb, alphaAt(peak), alphaAt(d + seg), width)
    } else {
      strokeSegment(ctx, a, b, rgb, alphaAt(d), alphaAt(d + seg), width)
    }
    d += seg
  }
}

function paint(ctx: CanvasRenderingContext2D, field: Field, traces: Trace[]) {
  ctx.clearRect(0, 0, field.width, field.height)
  ctx.save()
  clipExcluded(ctx, field)
  // Flush ends: the wide halo must not poke out past the core, so both read as one bar.
  ctx.lineCap = 'butt'
  ctx.globalAlpha = 1
  for (const t of traces) {
    strokeBar(ctx, t, HALO_RGB, 0.3, t.width * 3.6)
    strokeBar(ctx, t, CORE_RGB, 1, t.width)
  }
  ctx.restore()
}

/**
 * Runs the pulses on `canvas` until the returned cleanup is called. Handles
 * viewport sizing, reduced-motion (a single static frame), and the frame loop.
 */
function startPulses(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): () => void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  let field = createField(0, 0)
  let frame = 0
  let last: number | null = null

  function fit() {
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1)
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    field = createField(w, h, Math.random, excludedRects())
    paint(ctx, field, renderField(field))
  }

  function tick(ts: number) {
    const dt = last === null ? 0 : ts - last
    last = ts
    // The article column scrolls under the fixed canvas, so re-measure every frame.
    field.exclude = excludedRects()
    stepField(field, dt)
    paint(ctx, field, renderField(field))
    frame = window.requestAnimationFrame(tick)
  }

  function stop() {
    if (frame !== 0) window.cancelAnimationFrame(frame)
    frame = 0
    last = null
  }

  function apply() {
    stop()
    fit()
    if (!reduced.matches) frame = window.requestAnimationFrame(tick)
  }

  const onResize = () => apply()
  const onMotionChange = () => apply()

  apply()
  window.addEventListener('resize', onResize)
  reduced.addEventListener('change', onMotionChange)

  return () => {
    stop()
    window.removeEventListener('resize', onResize)
    reduced.removeEventListener('change', onMotionChange)
  }
}

/**
 * Full-viewport circuit-pulse animation behind the page: bars of white light
 * running along the body's grid lines. One canvas and one
 * requestAnimationFrame loop. Markup is a bare canvas so server and client
 * render identically.
 */
export function AmbientParticles() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    return startPulses(canvas, ctx)
  }, [])

  return <canvas ref={ref} className="ambient-particles" aria-hidden />
}
