import { describe, expect, it } from 'vitest'
import { gdLoss, gdPath, gdStatus, gdStepsToConverge, gdStep } from './gdPath'

describe('gdPath', () => {
  it('computes the loss and one step', () => {
    expect(gdLoss(3)).toBe(0)
    expect(gdLoss(-2)).toBe(25)
    expect(gdStep(-2, 0.1)).toBeCloseTo(-1, 10)
  })

  it('returns steps + 1 iterates starting at -2', () => {
    const p = gdPath(0.1, 20)
    expect(p).toHaveLength(21)
    expect(p[0]).toBe(-2)
  })

  it('jumps straight to the minimum at eta = 0.5', () => {
    expect(gdPath(0.5, 2)[1]).toBeCloseTo(3, 10)
    expect(gdStepsToConverge(0.5)).toBe(1)
  })

  it('classifies the learning rate', () => {
    expect(gdStatus(0.1)).toBe('converges')
    expect(gdStatus(0.99)).toBe('converges')
    expect(gdStatus(1)).toBe('oscillates')
    expect(gdStatus(1.05)).toBe('diverges')
    expect(gdStatus(1.1)).toBe('diverges')
  })

  it('counts steps to converge and returns null otherwise', () => {
    const n = gdStepsToConverge(0.1) as number
    expect(n).toBeGreaterThan(10)
    expect(Math.abs(gdPath(0.1, n)[n] - 3)).toBeLessThan(0.01)
    expect(Math.abs(gdPath(0.1, n - 1)[n - 1] - 3)).toBeGreaterThanOrEqual(0.01)
    expect(gdStepsToConverge(1)).toBeNull()
    expect(gdStepsToConverge(1.05)).toBeNull()
  })

  it('grows the error when eta > 1', () => {
    const p = gdPath(1.05, 20)
    expect(Math.abs(p[20] - 3)).toBeGreaterThan(Math.abs(p[0] - 3))
  })
})
