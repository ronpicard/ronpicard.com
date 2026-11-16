import { describe, expect, it } from 'vitest'
import { decisionBoundary, neuron, neuronCurve, sigmoid } from './sigmoidNeuron'

describe('sigmoidNeuron', () => {
  it('sigmoid is 0.5 at 0, symmetric, and stable for large inputs', () => {
    expect(sigmoid(0)).toBe(0.5)
    expect(sigmoid(2) + sigmoid(-2)).toBeCloseTo(1, 12)
    expect(sigmoid(1000)).toBe(1)
    expect(sigmoid(-1000)).toBe(0)
  })

  it('neuron applies w and b', () => {
    expect(neuron(2, 1, -2)).toBe(0.5)
    expect(neuron(1, 10, 0)).toBeGreaterThan(0.99)
  })

  it('decision boundary is -b/w, none for w = 0', () => {
    expect(decisionBoundary(2, 4)).toBe(-2)
    expect(decisionBoundary(-5, 10)).toBe(2)
    expect(decisionBoundary(0, 3)).toBeNull()
    expect(neuron(decisionBoundary(2, 4) as number, 2, 4)).toBeCloseTo(0.5, 12)
  })

  it('samples the curve over [-6, 6]', () => {
    const c = neuronCurve(1, 0, 13)
    expect(c).toHaveLength(13)
    expect(c[0].x).toBe(-6)
    expect(c[12].x).toBe(6)
    expect(c[6].y).toBe(0.5)
  })
})
