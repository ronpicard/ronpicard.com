import { describe, expect, it } from 'vitest'
import {
  createField,
  fadeAlpha,
  GRID_PX,
  LINE_OFFSET,
  MAX_STEP_MS,
  primeField,
  stepField,
  targetCount,
  type Paint,
  type Pulse,
} from './circuitPulses'

/** Deterministic stand-in for Math.random: cycles a fixed sequence. */
function seq(values: number[]) {
  let i = 0
  return () => values[i++ % values.length]!
}

/** Small seeded LCG for tests that need varied but repeatable rolls. */
function lcg(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

const fixed = () => 0.3

function onLine(v: number) {
  return Math.abs(((v - LINE_OFFSET) % GRID_PX + GRID_PX) % GRID_PX) < 1e-6
}

/** A hand-built pulse at grid node (3, 2) heading right, mid-life. */
function pulse(over: Partial<Pulse> = {}): Pulse {
  return {
    x: 3 * GRID_PX + LINE_OFFSET,
    y: 2 * GRID_PX + LINE_OFFSET,
    dir: 0,
    speed: 400,
    traveled: 0,
    life: 1000,
    hue: 'cyan',
    width: 2,
    ...over,
  }
}

describe('targetCount', () => {
  it('grows with viewport area and is bounded', () => {
    expect(targetCount(0, 0)).toBe(0)
    expect(targetCount(1280, 720)).toBeGreaterThan(targetCount(640, 480))
    expect(targetCount(5000, 3000)).toBeLessThanOrEqual(40)
    expect(targetCount(320, 200)).toBeGreaterThanOrEqual(4)
  })

  it('is lighter per pixel on phones than on wide viewports', () => {
    expect(targetCount(400, 800) / (400 * 800)).toBeLessThan(targetCount(1400, 800) / (1400 * 800))
  })
})

describe('createField', () => {
  it('spawns the target number of pulses on grid nodes inside the viewport', () => {
    const field = createField(1280, 720, lcg(3))
    expect(field.pulses.length).toBe(targetCount(1280, 720))
    for (const p of field.pulses) {
      expect(onLine(p.x)).toBe(true)
      expect(onLine(p.y)).toBe(true)
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(1280)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(720)
      expect([0, 1, 2, 3]).toContain(p.dir)
      expect(p.speed).toBeGreaterThan(0)
      expect(p.life).toBeGreaterThan(0)
      expect(p.traveled).toBeLessThan(p.life)
      expect(['cyan', 'magenta']).toContain(p.hue)
    }
  })

  it('starts pulses mid-flight so the first frame is not empty', () => {
    const field = createField(1280, 720, lcg(11))
    expect(field.pulses.some((p) => p.traveled > 0)).toBe(true)
  })

  it('handles a zero-size viewport without producing pulses', () => {
    const field = createField(0, 0, fixed)
    expect(field.pulses).toEqual([])
    expect(primeField(field)).toEqual([])
    expect(stepField(field, 16, fixed)).toEqual([])
  })
})

describe('primeField', () => {
  it('paints a trailing segment and a head for every pulse, all inside the viewport', () => {
    const field = createField(800, 600, lcg(5))
    const cells = primeField(field)
    expect(cells.filter((c) => c.kind === 'head').length).toBe(field.pulses.length)
    expect(cells.filter((c) => c.kind === 'segment').length).toBe(field.pulses.length)
    for (const c of cells) {
      if (c.kind === 'segment') {
        expect(c.x1).toBeGreaterThanOrEqual(0)
        expect(c.x2).toBeLessThanOrEqual(800)
        expect(c.y1).toBeGreaterThanOrEqual(0)
        expect(c.y2).toBeLessThanOrEqual(600)
        // Straight along one grid line.
        expect(c.x1 === c.x2 || c.y1 === c.y2).toBe(true)
      }
      expect(c.alpha).toBeGreaterThan(0)
      expect(c.alpha).toBeLessThanOrEqual(1)
    }
  })

  it('draws the trail behind the direction of travel', () => {
    const field = createField(800, 600, fixed)
    field.pulses = [pulse({ dir: 0, traveled: 200 })]
    const seg = primeField(field).find((c) => c.kind === 'segment')!
    expect(seg.kind === 'segment' && seg.x1).toBeLessThan(field.pulses[0]!.x)
  })
})

describe('stepField', () => {
  it('moves a pulse along its grid line by speed × dt and paints the segment it covered', () => {
    const field = createField(800, 600, fixed)
    const p = pulse({ speed: 400 })
    field.pulses = [p]
    const startX = p.x
    const cells = stepField(field, 50, () => 0.99)
    expect(p.x).toBeCloseTo(startX + 20)
    expect(onLine(p.y)).toBe(true)
    const seg = cells.find((c) => c.kind === 'segment')!
    expect(seg.kind === 'segment' && seg.x1).toBeCloseTo(startX)
    expect(seg.kind === 'segment' && seg.x2).toBeCloseTo(startX + 20)
    expect(seg.kind === 'segment' && seg.y1).toBe(p.y)
    const head = cells.find((c) => c.kind === 'head')!
    expect(head.kind === 'head' && head.x).toBeCloseTo(p.x)
    expect(head.alpha).toBe(1)
  })

  it('moves in every direction', () => {
    for (const dir of [0, 1, 2, 3] as const) {
      const field = createField(800, 600, fixed)
      const p = pulse({ dir, speed: 200 })
      const { x, y } = p
      field.pulses = [p]
      stepField(field, 50, () => 0.99)
      const dx = p.x - x
      const dy = p.y - y
      const expected = [
        [10, 0],
        [0, 10],
        [-10, 0],
        [0, -10],
      ][dir]!
      expect(dx).toBeCloseTo(expected[0]!)
      expect(dy).toBeCloseTo(expected[1]!)
    }
  })

  it('snaps exactly onto the next node and turns 90° when the turn roll succeeds', () => {
    const field = createField(800, 600, fixed)
    const p = pulse({ dir: 0, speed: 400 })
    field.pulses = [p]
    // 100 ms at 400 px/s = 40 px: exactly one grid cell. Rolls: turn (0 → yes), side (0 → left/up), branch (0.99 → no).
    const cells = stepField(field, 100, seq([0, 0, 0.99]))
    expect(p.x).toBe(4 * GRID_PX + LINE_OFFSET)
    expect(p.dir).not.toBe(0)
    expect(p.dir === 1 || p.dir === 3).toBe(true)
    expect(cells.find((c) => c.kind === 'node')).toBeDefined()
  })

  it('continues straight through a node without a via when the turn roll fails', () => {
    const field = createField(800, 600, fixed)
    const p = pulse({ dir: 1, speed: 400 })
    field.pulses = [p]
    const cells = stepField(field, 100, () => 0.99)
    expect(p.dir).toBe(1)
    expect(cells.find((c) => c.kind === 'node')).toBeUndefined()
  })

  it('splits movement at a node so the segment before the turn stays on the original line', () => {
    const field = createField(800, 600, fixed)
    const p = pulse({ dir: 0, speed: 600 })
    field.pulses = [p]
    // 100 ms at 600 px/s = 60 px: 40 to the node, then 20 after turning.
    const cells = stepField(field, 100, seq([0, 0.9, 0.99]))
    const segs = cells.filter((c) => c.kind === 'segment')
    expect(segs.length).toBe(2)
    const [a, b] = segs as Extract<Paint, { kind: 'segment' }>[]
    expect(a!.y1).toBe(a!.y2)
    expect(a!.x2).toBe(4 * GRID_PX + LINE_OFFSET)
    expect(b!.x1).toBe(b!.x2)
    expect(Math.abs(b!.y2 - b!.y1)).toBeCloseTo(20)
  })

  it('branches a perpendicular pulse at a node when the branch roll succeeds', () => {
    const field = createField(800, 600, fixed)
    const p = pulse({ dir: 0, speed: 400 })
    field.pulses = [p]
    field.target = 1
    // turn roll fails (0.99), branch roll succeeds (0), then branch params.
    stepField(field, 100, seq([0.99, 0, 0.5]))
    expect(field.pulses.length).toBe(2)
    const child = field.pulses[1]!
    expect(child.x).toBe(4 * GRID_PX + LINE_OFFSET)
    expect(child.y).toBe(p.y)
    expect(child.dir === 1 || child.dir === 3).toBe(true)
    expect(child.hue).toBe(p.hue)
  })

  it('never branches beyond the population cap', () => {
    const field = createField(800, 600, fixed)
    field.pulses = Array.from({ length: field.target * 2 }, () => pulse({ dir: 0, speed: 400 }))
    stepField(field, 100, seq([0.99, 0, 0.5]))
    expect(field.pulses.length).toBe(field.target * 2)
  })

  it('fades a pulse over the last part of its life', () => {
    const field = createField(800, 600, fixed)
    const p = pulse({ life: 1000, traveled: 900, speed: 200 })
    field.pulses = [p]
    const head = stepField(field, 50, () => 0.99).find((c) => c.kind === 'head')!
    expect(head.alpha).toBeGreaterThan(0)
    expect(head.alpha).toBeLessThan(1)
  })

  it('respawns a pulse that has lived out its life so the population holds steady', () => {
    const field = createField(800, 600, fixed)
    const p = pulse({ life: 100, traveled: 95, speed: 400 })
    field.pulses = [p]
    field.target = 1
    stepField(field, 50, lcg(9))
    expect(field.pulses.length).toBe(1)
    expect(field.pulses[0]).not.toBe(p)
    expect(field.pulses[0]!.traveled).toBe(0)
  })

  it('drops a dead pulse instead of respawning when the population is above target', () => {
    const field = createField(800, 600, fixed)
    field.pulses = [pulse({ life: 100, traveled: 95, speed: 400 }), pulse({ dir: 1 })]
    field.target = 1
    stepField(field, 50, lcg(9))
    expect(field.pulses.length).toBe(1)
  })

  it('retires a pulse that leaves the viewport', () => {
    const field = createField(200, 200, fixed)
    const p = pulse({ x: 4 * GRID_PX + LINE_OFFSET, dir: 0, speed: 800 })
    field.pulses = [p]
    field.target = 1
    stepField(field, 100, lcg(2))
    expect(field.pulses[0]).not.toBe(p)
  })

  it('clamps a huge dt so a backgrounded tab does not fast-forward the field', () => {
    const field = createField(4000, 600, fixed)
    const p = pulse({ speed: 100, life: 100000 })
    const startX = p.x
    field.pulses = [p]
    stepField(field, 60_000, () => 0.99)
    expect(p.x - startX).toBeLessThanOrEqual((100 * MAX_STEP_MS) / 1000 + 1e-6)
  })

  it('keeps every painted element inside the viewport over a long run', () => {
    const field = createField(640, 400, lcg(21))
    const rand = lcg(42)
    const all: Paint[] = []
    for (let i = 0; i < 600; i++) all.push(...stepField(field, 16, rand))
    expect(all.length).toBeGreaterThan(0)
    for (const c of all) {
      if (c.kind === 'segment') {
        for (const v of [c.x1, c.x2]) {
          expect(v).toBeGreaterThanOrEqual(-1e-6)
          expect(v).toBeLessThanOrEqual(640 + 1e-6)
        }
        for (const v of [c.y1, c.y2]) {
          expect(v).toBeGreaterThanOrEqual(-1e-6)
          expect(v).toBeLessThanOrEqual(400 + 1e-6)
        }
        expect(onLine(c.x1) || onLine(c.y1)).toBe(true)
      } else {
        expect(c.x).toBeGreaterThanOrEqual(-1e-6)
        expect(c.x).toBeLessThanOrEqual(640 + 1e-6)
        expect(c.y).toBeGreaterThanOrEqual(-1e-6)
        expect(c.y).toBeLessThanOrEqual(400 + 1e-6)
      }
    }
    expect(field.pulses.length).toBeGreaterThanOrEqual(field.target)
  })
})

describe('fadeAlpha', () => {
  it('is zero for no elapsed time and grows with dt', () => {
    expect(fadeAlpha(0)).toBe(0)
    expect(fadeAlpha(16)).toBeGreaterThan(0)
    expect(fadeAlpha(32)).toBeGreaterThan(fadeAlpha(16))
  })

  it('never exceeds a full erase', () => {
    expect(fadeAlpha(10_000)).toBeLessThanOrEqual(1)
    expect(fadeAlpha(10_000)).toBeGreaterThan(0.99)
  })

  it('frame-to-frame erasure is gentle enough to leave a visible trail', () => {
    expect(fadeAlpha(16.7)).toBeLessThan(0.2)
  })
})
