/**
 * Pure simulation for the circuit-pulse background drawn by AmbientParticles.
 *
 * Pulses are bright points that travel along the page's 40px grid lines,
 * turn at intersections, occasionally branch, and fade out at the end of
 * their run, like signals on a circuit board. Nothing here touches the DOM:
 * `createField` seeds the pulses, `stepField` advances them by a time delta
 * and returns what to paint, and the component turns that into canvas
 * strokes. Trails are not simulated — the canvas keeps them by partially
 * erasing the previous frame (see `fadeAlpha`), so each step paints only the
 * segment a pulse just covered.
 */

export type Hue = 'cyan' | 'magenta'

/** 0 = right, 1 = down, 2 = left, 3 = up. */
export type Dir = 0 | 1 | 2 | 3

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
  hue: Hue
  /** Stroke width of the core line in px. */
  width: number
}

export type Field = {
  width: number
  height: number
  /** Steady-state population; dead pulses respawn while the count is below this. */
  target: number
  pulses: Pulse[]
}

export type Paint =
  | { kind: 'segment'; x1: number; y1: number; x2: number; y2: number; hue: Hue; alpha: number; width: number }
  | { kind: 'head'; x: number; y: number; hue: Hue; alpha: number; width: number }
  | { kind: 'node'; x: number; y: number; hue: Hue; alpha: number }

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

const SPEED_MIN = 140
const SPEED_MAX = 440
const LIFE_MIN = 500
const LIFE_MAX = 1800
const WIDTH_MIN = 1.4
const WIDTH_MAX = 2.4

/** Chance of turning 90° at an intersection. */
const TURN_PROBABILITY = 0.35
/** Chance of spawning a perpendicular child at an intersection. */
const BRANCH_PROBABILITY = 0.08
/** Fraction of life after which a pulse fades toward zero. */
const FADE_START = 0.7

/** Fraction of trail alpha that remains after one second of fading. */
const REMAIN_PER_SECOND = 0.015

const CYAN_SHARE = 0.6
/** Length of the static trail painted behind each pulse on first paint. */
const PRIME_TRAIL_PX = 120

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

function makePulse(x: number, y: number, dir: Dir, rand: Rand, startInside: boolean, hue?: Hue): Pulse {
  const speed = lerp(SPEED_MIN, SPEED_MAX, rand())
  const life = lerp(LIFE_MIN, LIFE_MAX, rand())
  const width = lerp(WIDTH_MIN, WIDTH_MAX, rand())
  const h: Hue = hue ?? (rand() < CYAN_SHARE ? 'cyan' : 'magenta')
  const traveled = startInside ? rand() * life * FADE_START : 0
  return { x, y, dir, speed, traveled, life, hue: h, width }
}

function spawnAtRandomNode(field: Field, rand: Rand, startInside: boolean): Pulse {
  const nx = Math.floor(rand() * (lastNode(field.width) + 1))
  const ny = Math.floor(rand() * (lastNode(field.height) + 1))
  const dir = (Math.floor(rand() * 4) & 3) as Dir
  return makePulse(nx * GRID_PX + LINE_OFFSET, ny * GRID_PX + LINE_OFFSET, dir, rand, startInside)
}

export function createField(width: number, height: number, rand: Rand = Math.random): Field {
  const field: Field = { width, height, target: targetCount(width, height), pulses: [] }
  for (let i = 0; i < field.target; i++) {
    field.pulses.push(spawnAtRandomNode(field, rand, true))
  }
  return field
}

function lifeAlpha(p: Pulse) {
  const t = p.traveled / p.life
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

/** Distance from the pulse to the viewport edge it is heading toward. */
function edgeDistance(field: Field, p: Pulse) {
  switch (p.dir) {
    case 0:
      return field.width - p.x
    case 1:
      return field.height - p.y
    case 2:
      return p.x
    default:
      return p.y
  }
}

/**
 * Paint list for the first frame (or the whole picture under reduced
 * motion): a short straight trail behind each pulse plus its head.
 */
export function primeField(field: Field): Paint[] {
  const out: Paint[] = []
  for (const p of field.pulses) {
    const [dx, dy] = DIRS[p.dir]!
    const behind = edgeDistance(field, { ...p, dir: ((p.dir + 2) % 4) as Dir })
    const back = Math.min(p.traveled, PRIME_TRAIL_PX, behind)
    out.push({
      kind: 'segment',
      x1: p.x - dx * back,
      y1: p.y - dy * back,
      x2: p.x,
      y2: p.y,
      hue: p.hue,
      alpha: 0.6,
      width: p.width,
    })
    out.push({ kind: 'head', x: p.x, y: p.y, hue: p.hue, alpha: lifeAlpha(p), width: p.width })
  }
  return out
}

/**
 * Advances every pulse by `dtMs` and returns what changed. Movement is split
 * at grid intersections so turns happen exactly on the node; a pulse that
 * runs out of life or leaves the viewport is respawned while the population
 * is below target, otherwise simply dropped.
 */
export function stepField(field: Field, dtMs: number, rand: Rand = Math.random): Paint[] {
  const out: Paint[] = []
  const dt = clamp(dtMs, 0, MAX_STEP_MS)
  const cap = Math.max(field.target, Math.round(field.target * CAP_FACTOR))
  const survivors: Pulse[] = []
  const spawned: Pulse[] = []

  for (const p of field.pulses) {
    let remaining = (p.speed * dt) / 1000
    let alive = true
    while (remaining > 0 && alive) {
      const { dist, nodePos } = nextNode(p)
      const toEdge = edgeDistance(field, p)
      if (toEdge <= 0) {
        alive = false
        break
      }
      const d = Math.min(remaining, dist, toEdge)
      const [dx, dy] = DIRS[p.dir]!
      const x0 = p.x
      const y0 = p.y
      const alpha = lifeAlpha(p)
      if (d === dist) {
        if (dx !== 0) p.x = nodePos
        else p.y = nodePos
      } else {
        p.x += dx * d
        p.y += dy * d
      }
      p.traveled += d
      remaining -= d
      out.push({ kind: 'segment', x1: x0, y1: y0, x2: p.x, y2: p.y, hue: p.hue, alpha, width: p.width })

      if (p.traveled >= p.life || d === toEdge) {
        alive = false
      } else if (d === dist) {
        if (rand() < TURN_PROBABILITY) {
          const side = rand() < 0.5 ? 3 : 1
          p.dir = ((p.dir + side) % 4) as Dir
          out.push({ kind: 'node', x: p.x, y: p.y, hue: p.hue, alpha })
        }
        if (field.pulses.length + spawned.length < cap && rand() < BRANCH_PROBABILITY) {
          const side = rand() < 0.5 ? 1 : 3
          const dir = ((p.dir + side) % 4) as Dir
          spawned.push(makePulse(p.x, p.y, dir, rand, false, p.hue))
        }
      }
    }
    if (alive) {
      out.push({ kind: 'head', x: p.x, y: p.y, hue: p.hue, alpha: lifeAlpha(p), width: p.width })
      survivors.push(p)
    }
  }

  field.pulses = survivors.concat(spawned)
  while (field.pulses.length < field.target) {
    field.pulses.push(spawnAtRandomNode(field, rand, false))
  }
  return out
}

/**
 * Alpha for the per-frame erase pass. Frame-rate independent: after one
 * second of fading only REMAIN_PER_SECOND of a trail is left, however many
 * frames that second contained.
 */
export function fadeAlpha(dtMs: number): number {
  if (dtMs <= 0) return 0
  return 1 - Math.pow(REMAIN_PER_SECOND, dtMs / 1000)
}
