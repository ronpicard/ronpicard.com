import { useEffect, useRef } from 'react'
import { createField, fadeAlpha, primeField, stepField, type Field, type Hue, type Paint } from './circuitPulses'

/** Backing-store scale cap; 3x phones get a 2x canvas, which is indistinguishable at this size. */
const MAX_DPR = 2

const HEAD_COLOR: Record<Hue, string> = {
  cyan: '#e6fffa',
  magenta: '#ffe0f8',
}
const TRACE_COLOR: Record<Hue, string> = {
  cyan: 'rgb(0, 255, 200)',
  magenta: 'rgb(255, 43, 214)',
}
const GLOW_COLOR: Record<Hue, string> = {
  cyan: 'rgba(0, 255, 200, 0.9)',
  magenta: 'rgba(255, 43, 214, 0.9)',
}

const TAU = Math.PI * 2

function stroke(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, width: number) {
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.fill()
}

function paint(ctx: CanvasRenderingContext2D, cells: Paint[]) {
  ctx.lineCap = 'round'
  for (const c of cells) {
    if (c.kind === 'segment') {
      ctx.strokeStyle = TRACE_COLOR[c.hue]
      // Soft halo under a sharp core so traces read as lit, not drawn.
      ctx.globalAlpha = c.alpha * 0.28
      stroke(ctx, c.x1, c.y1, c.x2, c.y2, c.width * 3.2)
      ctx.globalAlpha = c.alpha
      stroke(ctx, c.x1, c.y1, c.x2, c.y2, c.width)
    } else if (c.kind === 'node') {
      ctx.fillStyle = TRACE_COLOR[c.hue]
      ctx.globalAlpha = c.alpha
      dot(ctx, c.x, c.y, 3)
    } else {
      ctx.fillStyle = HEAD_COLOR[c.hue]
      ctx.globalAlpha = c.alpha
      ctx.shadowColor = GLOW_COLOR[c.hue]
      ctx.shadowBlur = 12
      dot(ctx, c.x, c.y, c.width * 1.2)
      ctx.shadowBlur = 0
    }
  }
  ctx.globalAlpha = 1
}

function erase(ctx: CanvasRenderingContext2D, field: Field, alpha: number) {
  if (alpha <= 0) return
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`
  ctx.fillRect(0, 0, field.width, field.height)
  ctx.globalCompositeOperation = 'source-over'
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
    field = createField(w, h)
    ctx.clearRect(0, 0, w, h)
    paint(ctx, primeField(field))
  }

  function tick(ts: number) {
    const dt = last === null ? 0 : ts - last
    last = ts
    erase(ctx, field, fadeAlpha(dt))
    paint(ctx, stepField(field, dt))
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
 * Full-viewport circuit-pulse animation behind the page: lit signals running
 * along the body's grid lines. One canvas and one requestAnimationFrame loop.
 * Markup is a bare canvas so server and client render identically.
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
