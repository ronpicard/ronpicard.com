import { describe, expect, it } from 'vitest'
import { MOM_A, MOM_ETA, MOM_START, momentumPath, norm, stepsToReach, valleyGrad, valleyLoss } from './momentumPath'

describe('momentumPath', () => {
  it('evaluates loss, gradient and norm', () => {
    expect(valleyLoss({ x: 1, y: 2 })).toBeCloseTo(0.5 * (MOM_A + 4), 10)
    expect(valleyGrad({ x: 1, y: 2 })).toEqual({ x: MOM_A, y: 2 })
    expect(norm({ x: 3, y: 4 })).toBe(5)
  })

  it('starts at the fixed start and has steps + 1 points', () => {
    const p = momentumPath(0.9, 30)
    expect(p).toHaveLength(31)
    expect(p[0]).toEqual(MOM_START)
  })

  it('beta = 0 is plain gradient descent', () => {
    const p = momentumPath(0, 1)
    expect(p[1].x).toBeCloseTo(MOM_START.x * (1 - MOM_ETA * MOM_A), 10)
    expect(p[1].y).toBeCloseTo(MOM_START.y * (1 - MOM_ETA), 10)
  })

  it('counts steps to reach the tolerance for both methods', () => {
    const plain = stepsToReach(0) as number
    const mom = stepsToReach(0.9) as number
    expect(plain).toBeGreaterThan(20)
    expect(mom).toBeGreaterThan(0)
    expect(norm(momentumPath(0, plain)[plain])).toBeLessThan(0.05)
    expect(norm(momentumPath(0, plain - 1)[plain - 1])).toBeGreaterThanOrEqual(0.05)
    expect(norm(momentumPath(0.9, mom)[mom])).toBeLessThan(0.05)
  })

  it('lets momentum beat plain descent in the valley, which is the point of the figure', () => {
    const plain = stepsToReach(0) as number
    for (const beta of [0.5, 0.7, 0.8, 0.9]) expect(stepsToReach(beta) as number).toBeLessThan(plain)
    // Each plain step flips x and keeps over half its size (factor 1 − η·a < −0.5): a visible zig-zag.
    expect(1 - MOM_ETA * MOM_A).toBeLessThan(-0.5)
  })

  it('returns null when the tolerance is not reached within the cap', () => {
    expect(stepsToReach(0, 1e-300)).toBeNull()
  })
})
