import { describe, expect, it } from 'vitest'
import {
  brightnessAt,
  createField,
  FADE_IN_END,
  GRID_PX,
  LINE_OFFSET,
  MAX_STEP_MS,
  PEAK_FRACTION,
  renderField,
  stepField,
  targetCount,
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

function node(ix: number, iy: number) {
  return { x: ix * GRID_PX + LINE_OFFSET, y: iy * GRID_PX + LINE_OFFSET }
}

/** A hand-built pulse at grid node (3, 2) heading right, with a long straight run behind it. */
function pulse(over: Partial<Pulse> = {}): Pulse {
  const head = node(3, 2)
  return {
    ...head,
    dir: 0,
    speed: 400,
    traveled: 0,
    life: 1000,
    trailLen: 100,
    width: 2,
    path: [{ x: head.x - 1000, y: head.y }],
    ...over,
  }
}

function polylineLength(points: ReadonlyArray<{ x: number; y: number }>) {
  let len = 0
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i]!.x - points[i - 1]!.x, points[i]!.y - points[i - 1]!.y)
  }
  return len
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
      expect(p.trailLen).toBeGreaterThan(0)
      expect(p.width).toBeGreaterThan(0)
      expect(p.traveled).toBeLessThan(p.life)
      // Origin sits straight behind the head by the distance already traveled.
      expect(p.path.length).toBe(1)
      expect(Math.hypot(p.path[0]!.x - p.x, p.path[0]!.y - p.y)).toBeCloseTo(p.traveled)
    }
  })

  it('starts pulses mid-flight so the first frame is not empty', () => {
    const field = createField(1280, 720, lcg(11))
    expect(field.pulses.some((p) => p.traveled > 0)).toBe(true)
  })

  it('handles a zero-size viewport without producing pulses', () => {
    const field = createField(0, 0, fixed)
    expect(field.pulses).toEqual([])
    expect(renderField(field)).toEqual([])
    stepField(field, 16, fixed)
    expect(field.pulses).toEqual([])
  })
})

describe('renderField', () => {
  it('returns one trace per pulse with the head first and an alpha in (0, 1]', () => {
    const field = createField(800, 600, lcg(5))
    const traces = renderField(field)
    expect(traces.length).toBe(field.pulses.length)
    traces.forEach((t, i) => {
      const p = field.pulses[i]!
      expect(t.points[0]).toEqual({ x: p.x, y: p.y })
      expect(t.width).toBe(p.width)
      expect(t.alpha).toBeGreaterThanOrEqual(0)
      expect(t.alpha).toBeLessThanOrEqual(1)
      for (let k = 1; k < t.points.length; k++) {
        const a = t.points[k - 1]!
        const b = t.points[k]!
        expect(a.x === b.x || a.y === b.y).toBe(true)
      }
      expect(polylineLength(t.points)).toBeLessThanOrEqual(p.trailLen + 1e-6)
    })
  })

  it('draws a straight tail behind a pulse that has not turned, no longer than its trail length', () => {
    const field = createField(800, 600, fixed)
    field.pulses = [pulse({ traveled: 300, trailLen: 100 })]
    const [t] = renderField(field)
    expect(t!.points).toEqual([node(3, 2), { x: node(3, 2).x - 100, y: node(3, 2).y }])
  })

  it('shortens the tail to the distance actually traveled by a fresh pulse', () => {
    const field = createField(800, 600, fixed)
    field.pulses = [pulse({ traveled: 30, trailLen: 100 })]
    const [t] = renderField(field)
    expect(polylineLength(t!.points)).toBeCloseTo(30)
  })

  it('bends the tail around a recorded corner', () => {
    const field = createField(800, 600, fixed)
    // Came from the left along row 2, turned down at node (4, 2), now 40px below it.
    const corner = node(4, 2)
    const p = pulse({ x: corner.x, y: corner.y + 40, dir: 1, traveled: 200, trailLen: 100, path: [node(0, 2), corner] })
    field.pulses = [p]
    const [t] = renderField(field)
    expect(t!.points).toEqual([{ x: corner.x, y: corner.y + 40 }, corner, { x: corner.x - 60, y: corner.y }])
    expect(polylineLength(t!.points)).toBeCloseTo(100)
  })

  it('fades a pulse over the last part of its life', () => {
    const field = createField(800, 600, fixed)
    field.pulses = [pulse({ life: 1000, traveled: 900 })]
    const [t] = renderField(field)
    expect(t!.alpha).toBeGreaterThan(0)
    expect(t!.alpha).toBeLessThan(1)
  })

  it('fades a pulse in over the first part of its life instead of popping in', () => {
    const field = createField(800, 600, fixed)
    const at = (traveled: number) => {
      field.pulses = [pulse({ life: 1000, traveled })]
      return renderField(field)[0]!.alpha
    }
    expect(at(0)).toBe(0)
    const half = at((FADE_IN_END * 1000) / 2)
    expect(half).toBeGreaterThan(0)
    expect(half).toBeLessThan(1)
    expect(at(FADE_IN_END * 1000)).toBe(1)
    expect(at(500)).toBe(1)
  })
})

describe('brightnessAt', () => {
  it('is dark at both ends of the bar and brightest at the peak', () => {
    expect(brightnessAt(0, 100)).toBe(0)
    expect(brightnessAt(100, 100)).toBe(0)
    expect(brightnessAt(PEAK_FRACTION * 100, 100)).toBeCloseTo(1)
  })

  it('rises toward the peak from the front and falls away from it toward the tail', () => {
    const peak = PEAK_FRACTION * 100
    let prev = -1
    for (let d = 0; d <= peak; d += peak / 10) {
      const b = brightnessAt(d, 100)
      expect(b).toBeGreaterThanOrEqual(prev)
      prev = b
    }
    prev = 2
    for (let d = peak; d <= 100; d += (100 - peak) / 10) {
      const b = brightnessAt(d, 100)
      expect(b).toBeLessThanOrEqual(prev)
      prev = b
    }
  })

  it('clamps distances beyond the bar to zero', () => {
    expect(brightnessAt(-5, 100)).toBe(0)
    expect(brightnessAt(150, 100)).toBe(0)
  })
})

describe('exclusion zones', () => {
  // Leaves only the first three and last two grid columns of an 800px field open.
  const zone = { x: 100, y: 0, w: 600, h: 600 }
  const outside = (p: Pulse) => p.x < 100 || p.x > 700

  it('spawns pulses outside excluded rectangles', () => {
    const field = createField(800, 600, lcg(4), [zone])
    expect(field.exclude).toEqual([zone])
    expect(field.pulses.length).toBe(field.target)
    for (const p of field.pulses) expect(outside(p)).toBe(true)
  })

  it('respawns outside excluded rectangles', () => {
    const field = createField(800, 600, fixed)
    field.exclude = [zone]
    field.pulses = [pulse({ life: 100, traveled: 95, speed: 400 })]
    field.target = 1
    const rand = lcg(9)
    for (let i = 0; i < 20; i++) {
      stepField(field, 50, rand)
      for (const p of field.pulses) {
        if (p.traveled === 0) expect(outside(p)).toBe(true)
      }
    }
  })

  it('still spawns when the exclusion covers the whole viewport, so a resize back out recovers', () => {
    const field = createField(800, 600, lcg(4), [{ x: 0, y: 0, w: 800, h: 600 }])
    expect(field.pulses.length).toBe(field.target)
  })
})

describe('stepField', () => {
  it('moves a pulse along its grid line by speed × dt', () => {
    const field = createField(800, 600, fixed)
    const p = pulse({ speed: 400 })
    field.pulses = [p]
    const startX = p.x
    stepField(field, 50, () => 0.99)
    expect(p.x).toBeCloseTo(startX + 20)
    expect(onLine(p.y)).toBe(true)
    expect(p.traveled).toBeCloseTo(20)
  })

  it('moves in every direction', () => {
    for (const dir of [0, 1, 2, 3] as const) {
      const field = createField(800, 600, fixed)
      const p = pulse({ dir, speed: 200 })
      const { x, y } = p
      field.pulses = [p]
      stepField(field, 50, () => 0.99)
      const expected = [
        [10, 0],
        [0, 10],
        [-10, 0],
        [0, -10],
      ][dir]!
      expect(p.x - x).toBeCloseTo(expected[0]!)
      expect(p.y - y).toBeCloseTo(expected[1]!)
    }
  })

  it('snaps exactly onto the next node, turns 90°, and records the corner when the turn roll succeeds', () => {
    const field = createField(800, 600, fixed)
    const p = pulse({ dir: 0, speed: 400 })
    field.pulses = [p]
    // 100 ms at 400 px/s = 40 px: exactly one grid cell. Rolls: turn (0 → yes), side (0), branch (0.99 → no).
    stepField(field, 100, seq([0, 0, 0.99]))
    expect(p.x).toBe(node(4, 2).x)
    expect(p.y).toBe(node(4, 2).y)
    expect(p.dir === 1 || p.dir === 3).toBe(true)
    expect(p.path.at(-1)).toEqual(node(4, 2))
    expect(p.path.length).toBe(2)
  })

  it('continues straight through a node without recording a corner when the turn roll fails', () => {
    const field = createField(800, 600, fixed)
    const p = pulse({ dir: 1, speed: 400 })
    field.pulses = [p]
    stepField(field, 100, () => 0.99)
    expect(p.dir).toBe(1)
    expect(p.path.length).toBe(1)
  })

  it('splits movement at a node so the remainder continues along the new heading', () => {
    const field = createField(800, 600, fixed)
    const p = pulse({ dir: 0, speed: 600 })
    field.pulses = [p]
    // 100 ms at 600 px/s = 60 px: 40 to the node, then 20 after turning down.
    stepField(field, 100, seq([0, 0.9, 0.99]))
    expect(p.dir).toBe(1)
    expect(p.x).toBe(node(4, 2).x)
    expect(p.y).toBeCloseTo(node(4, 2).y + 20)
  })

  it('prunes path points that have fallen off the end of the trail, keeping one anchor', () => {
    const field = createField(800, 600, fixed)
    const p = pulse({ dir: 0, speed: 400, trailLen: 60, life: 100000 })
    field.pulses = [p]
    stepField(field, 100, seq([0, 0.9, 0.99])) // turn down at (4, 2)
    expect(p.path.length).toBe(2)
    for (let i = 0; i < 5; i++) stepField(field, 100, () => 0.99) // 200 px further, straight
    expect(p.path).toEqual([node(4, 2)])
  })

  it('branches a child pulse at a node when the branch roll succeeds', () => {
    const field = createField(800, 600, fixed)
    const p = pulse({ dir: 0, speed: 400 })
    field.pulses = [p]
    field.target = 1
    // turn roll fails (0.99), branch roll succeeds (0), then branch params.
    stepField(field, 100, seq([0.99, 0, 0.5]))
    expect(field.pulses.length).toBe(2)
    const child = field.pulses[1]!
    expect(child.x).toBe(node(4, 2).x)
    expect(child.y).toBe(node(4, 2).y)
    expect(child.dir === 1 || child.dir === 3).toBe(true)
    expect(child.path).toEqual([node(4, 2)])
    expect(child.traveled).toBe(0)
  })

  it('never branches beyond the population cap', () => {
    const field = createField(800, 600, fixed)
    field.pulses = Array.from({ length: field.target * 2 }, () => pulse({ dir: 0, speed: 400 }))
    stepField(field, 100, seq([0.99, 0, 0.5]))
    expect(field.pulses.length).toBe(field.target * 2)
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

  it('lets a pulse run past the edge until its tail is out, then retires it', () => {
    const field = createField(200, 200, fixed)
    const p = pulse({ x: node(4, 0).x, y: node(0, 1).y, dir: 0, speed: 400, trailLen: 60, life: 100000 })
    field.pulses = [p]
    field.target = 1
    stepField(field, 100, () => 0.99) // head at 200.5: just past the edge, tail still inside
    expect(field.pulses[0]).toBe(p)
    stepField(field, 100, () => 0.99) // 240.5
    stepField(field, 100, () => 0.99) // 280.5: tail fully out
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

  it('keeps every trace on the grid and within a trail length of the viewport over a long run', () => {
    const field = createField(640, 400, lcg(21))
    const rand = lcg(42)
    let seen = 0
    for (let i = 0; i < 600; i++) {
      stepField(field, 16, rand)
      for (const t of renderField(field)) {
        seen++
        const p = t.points[0]!
        expect(onLine(p.x) || onLine(p.y)).toBe(true)
        expect(p.x).toBeGreaterThanOrEqual(-t.trailLen - 1e-6)
        expect(p.x).toBeLessThanOrEqual(640 + t.trailLen + 1e-6)
        expect(p.y).toBeGreaterThanOrEqual(-t.trailLen - 1e-6)
        expect(p.y).toBeLessThanOrEqual(400 + t.trailLen + 1e-6)
        expect(polylineLength(t.points)).toBeLessThanOrEqual(t.trailLen + 1e-6)
      }
      expect(field.pulses.length).toBeGreaterThanOrEqual(field.target)
    }
    expect(seen).toBeGreaterThan(0)
  })
})
