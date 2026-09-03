/**
 * Pure simulation for the circuit-pulse background drawn by AmbientParticles.
 *
 * Pulses are short bars of light that travel along the page's 40px grid
 * lines, turn at intersections, occasionally branch, and fade out at the end
 * of their run, like signals on a circuit board. Nothing here touches the
 * DOM: `createField` seeds the pulses, `stepField` advances them by a time
 * delta, and `renderField` returns each pulse's trace (head plus the bent
 * tail behind it) for the canvas to draw. The canvas is cleared and redrawn
 * every frame, so tails are geometry here rather than leftover paint.
 *
 * A bar fades at both ends: `brightnessAt` is 0 at the leading tip, peaks a
 * short way behind it, and falls back to 0 at the tail's end, so the bright
 * core appears to sit inside a soft glow rather than at a hard front edge.
 */

/** 0 = right, 1 = down, 2 = left, 3 = up. */
export type Dir = 0 | 1 | 2 | 3

export type Point = { x: number; y: number }

/** Viewport-space rectangle, in CSS px. */
export type Rect = { x: number; y: number; w: number; h: number }

export type Pulse = {
  x: number
  y: number
  dir: Dir
  /** CSS px per second. */
  speed: number
  /** Distance covered so far, in px. */
  traveled: number
  /** Total distance this pulse runs before it dies, in px. */
  life: number
  /** Visible tail length behind the head, in px. */
  trailLen: number
  /** Stroke width of the core line in px. */
  width: number
  /**
   * Points the pulse has passed through, oldest first: the origin (or a
   * pruned anchor) followed by every corner still within the tail. The head
   * itself is not stored here.
   */
  path: Point[]
}

export type Field = {
  width: number
  height: number
  /** Steady-state population; dead pulses respawn while the count is below this. */
  target: number
  pulses: Pulse[]
  /** Regions pulses must not spawn in (the canvas also clips them out there); updated by the component as the page scrolls. */
  exclude: Rect[]
}

/** One pulse ready to draw: head first, then the tail bending back through its corners. */
export type Trace = {
  points: Point[]
  alpha: number
  width: number
  trailLen: number
}

export type Rand = () => number

/** Must match the body background grid in index.css. */
export const GRID_PX = 40
/** The CSS grid draws a 1px line at the start of each tile; its centre is half a pixel in. */
export const LINE_OFFSET = 0.5

/** Largest time slice the simulation will consume in one call (tab returns from background). */
export const MAX_STEP_MS = 100

const AREA_PER_PULSE_WIDE = 45_000
const AREA_PER_PULSE_NARROW = 70_000
const NARROW_MAX_PX = 640
const MIN_PULSES = 4
const MAX_PULSES = 40
/** Branching may grow the population to this multiple of the target. */
const CAP_FACTOR = 1.5

const SPEED_MIN = 36
const SPEED_MAX = 36
const LIFE_MIN = 250
const LIFE_MAX = 800
const TRAIL_MIN = 50
const TRAIL_MAX = 140
const WIDTH_MIN = 0.9
const WIDTH_MAX = 1.5

/** Where the brightest point of a bar sits, as a fraction of its length back from the leading tip. */
export const PEAK_FRACTION = 0.3
/** Sharpness of the fade on either side of the peak. */
const FADE_POWER = 1.4

/** Chance of turning 90° at an intersection. */
const TURN_PROBABILITY = 0.35
/** Chance of spawning a perpendicular child at an intersection. */
const BRANCH_PROBABILITY = 0.08
/** Fraction of life over which a freshly spawned pulse fades in from nothing. */
export const FADE_IN_END = 0.2
/** Fraction of life after which a pulse fades toward zero. */
const FADE_START = 0.7

/** Tries to find a spawn node outside the exclusion zones before giving up and using the last one. */
const SPAWN_ATTEMPTS = 12

const EPS = 1e-6

const DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
]

function lerp(min: number, max: number, t: number) {
  return min + (max - min) * t
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

/** Index of the last grid node whose coordinate still lies inside `length`. */
function lastNode(length: number) {
  return Math.floor((length - LINE_OFFSET) / GRID_PX)
}

export function targetCount(width: number, height: number): number {
  if (width <= 0 || height <= 0) return 0
  const per = width <= NARROW_MAX_PX ? AREA_PER_PULSE_NARROW : AREA_PER_PULSE_WIDE
  return clamp(Math.round((width * height) / per), MIN_PULSES, MAX_PULSES)
}

function makePulse(x: number, y: number, dir: Dir, rand: Rand, startInside: boolean): Pulse {
  const speed = lerp(SPEED_MIN, SPEED_MAX, rand())
  const life = lerp(LIFE_MIN, LIFE_MAX, rand())
  const trailLen = lerp(TRAIL_MIN, TRAIL_MAX, rand())
  const width = lerp(WIDTH_MIN, WIDTH_MAX, rand())
  const traveled = startInside ? rand() * life * FADE_START : 0
  const [dx, dy] = DIRS[dir]!
  // Origin sits behind the head by the distance already traveled so the tail is visible on first paint.
  const origin = { x: x - dx * traveled, y: y - dy * traveled }
  return { x, y, dir, speed, traveled, life, trailLen, width, path: [origin] }
}

function insideAny(rects: Rect[], x: number, y: number) {
  return rects.some((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h)
}

function spawnAtRandomNode(field: Field, rand: Rand, startInside: boolean): Pulse {
  let x = LINE_OFFSET
  let y = LINE_OFFSET
  for (let attempt = 0; attempt < SPAWN_ATTEMPTS; attempt++) {
    const nx = Math.floor(rand() * (lastNode(field.width) + 1))
    const ny = Math.floor(rand() * (lastNode(field.height) + 1))
    x = nx * GRID_PX + LINE_OFFSET
    y = ny * GRID_PX + LINE_OFFSET
    if (!insideAny(field.exclude, x, y)) break
  }
  const dir = (Math.floor(rand() * 4) & 3) as Dir
  return makePulse(x, y, dir, rand, startInside)
}

export function createField(width: number, height: number, rand: Rand = Math.random, exclude: Rect[] = []): Field {
  const field: Field = { width, height, target: targetCount(width, height), pulses: [], exclude }
  for (let i = 0; i < field.target; i++) {
    field.pulses.push(spawnAtRandomNode(field, rand, true))
  }
  return field
}

function lifeAlpha(p: Pulse) {
  const t = p.traveled / p.life
  if (t < FADE_IN_END) return Math.max(0, t / FADE_IN_END)
  if (t < FADE_START) return 1
  return Math.max(0, 1 - (t - FADE_START) / (1 - FADE_START))
}

/** Distance from the pulse to the next grid intersection along its heading, and that node's coordinate. */
function nextNode(p: Pulse): { dist: number; nodePos: number } {
  const horizontal = p.dir === 0 || p.dir === 2
  const pos = horizontal ? p.x : p.y
  const forward = p.dir === 0 || p.dir === 1
  const u = (pos - LINE_OFFSET) / GRID_PX
  const next = forward ? Math.floor(u + EPS) + 1 : Math.ceil(u - EPS) - 1
  const nodePos = next * GRID_PX + LINE_OFFSET
  return { dist: Math.abs(nodePos - pos), nodePos }
}

function insideViewport(field: Field, x: number, y: number) {
  return x >= 0 && x <= field.width && y >= 0 && y <= field.height
}

/** True once the head is more than a tail length outside the viewport, so nothing of it can show. */
function fullyOut(field: Field, p: Pulse) {
  const m = p.trailLen
  return p.x < -m || p.x > field.width + m || p.y < -m || p.y > field.height + m
}

function distance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/**
 * Brightness of a bar at `distanceFromFront` px behind its leading tip: 0 at
 * the tip, 1 at the peak, 0 again at `trailLen`, and 0 anywhere outside.
 */
export function brightnessAt(distanceFromFront: number, trailLen: number): number {
  if (trailLen <= 0 || distanceFromFront <= 0 || distanceFromFront >= trailLen) return 0
  const peak = trailLen * PEAK_FRACTION
  const t = distanceFromFront < peak ? distanceFromFront / peak : (trailLen - distanceFromFront) / (trailLen - peak)
  return Math.pow(t, FADE_POWER)
}


/** Drops path points that are no longer within the tail, always keeping one anchor to aim the tail at. */
function prunePath(p: Pulse) {
  while (p.path.length >= 2) {
    let d = distance(p, p.path[p.path.length - 1]!)
    for (let i = p.path.length - 1; i >= 2; i--) d += distance(p.path[i]!, p.path[i - 1]!)
    if (d < p.trailLen) break
    p.path.shift()
  }
}

/** Traces for every pulse at the field's current instant. */
export function renderField(field: Field): Trace[] {
  const out: Trace[] = []
  for (const p of field.pulses) {
    let remaining = Math.min(p.trailLen, p.traveled)
    const head = { x: p.x, y: p.y }
    const points: Point[] = [head]
    let cur = head
    for (let i = p.path.length - 1; i >= 0 && remaining > EPS; i--) {
      const q = p.path[i]!
      const seg = distance(cur, q)
      if (seg <= EPS) continue
      if (seg >= remaining) {
        const t = remaining / seg
        points.push({ x: cur.x + (q.x - cur.x) * t, y: cur.y + (q.y - cur.y) * t })
        remaining = 0
        break
      }
      points.push(q)
      remaining -= seg
      cur = q
    }
    out.push({ points, alpha: lifeAlpha(p), width: p.width, trailLen: p.trailLen })
  }
  return out
}

/**
 * Advances every pulse by `dtMs`. Movement is split at grid intersections so
 * turns happen exactly on the node; a pulse that runs out of life or carries
 * its whole tail off screen is respawned while the population is below
 * target, otherwise simply dropped.
 */
export function stepField(field: Field, dtMs: number, rand: Rand = Math.random): void {
  const dt = clamp(dtMs, 0, MAX_STEP_MS)
  const cap = Math.max(field.target, Math.round(field.target * CAP_FACTOR))
  const survivors: Pulse[] = []
  const spawned: Pulse[] = []

  for (const p of field.pulses) {
    let remaining = (p.speed * dt) / 1000
    let alive = true
    while (remaining > 0) {
      const { dist, nodePos } = nextNode(p)
      const d = Math.min(remaining, dist)
      const [dx, dy] = DIRS[p.dir]!
      if (d === dist) {
        if (dx !== 0) p.x = nodePos
        else p.y = nodePos
      } else {
        p.x += dx * d
        p.y += dy * d
      }
      p.traveled += d
      remaining -= d
      if (p.traveled >= p.life) {
        alive = false
        break
      }
      if (d === dist && insideViewport(field, p.x, p.y)) {
        if (rand() < TURN_PROBABILITY) {
          const side = rand() < 0.5 ? 3 : 1
          p.dir = ((p.dir + side) % 4) as Dir
          p.path.push({ x: p.x, y: p.y })
        }
        if (field.pulses.length + spawned.length < cap && rand() < BRANCH_PROBABILITY) {
          const side = rand() < 0.5 ? 1 : 3
          const dir = ((p.dir + side) % 4) as Dir
          spawned.push(makePulse(p.x, p.y, dir, rand, false))
        }
      }
    }
    if (alive && !fullyOut(field, p)) {
      prunePath(p)
      survivors.push(p)
    }
  }

  field.pulses = survivors.concat(spawned)
  while (field.pulses.length < field.target) {
    field.pulses.push(spawnAtRandomNode(field, rand, false))
  }
}
