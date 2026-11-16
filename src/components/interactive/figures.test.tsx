// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { GdLearningRateFigure, gdReadout } from './GdLearningRateFigure'
import { MomentumBetaFigure, momentumReadout } from './MomentumBetaFigure'
import { SigmoidNeuronFigure, sigmoidReadout } from './SigmoidNeuronFigure'
import { scale } from './FigureSlider'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

function setSlider(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  act(() => {
    setter.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

const readout = () => container.querySelector('.interactive-figure__readout')!.textContent

describe('GdLearningRateFigure', () => {
  it('updates the readout when the slider moves', () => {
    act(() => root.render(<GdLearningRateFigure />))
    const input = container.querySelector('input[type="range"]') as HTMLInputElement
    expect(input.getAttribute('aria-label')).toBe('Learning rate η')
    expect(readout()).toContain('η = 0.10: reaches |w − 3| < 0.01 after')
    setSlider(input, '1.05')
    expect(readout()).toBe('η = 1.05: diverges, each step lands farther from the minimum')
    setSlider(input, '1')
    expect(readout()).toContain('oscillates')
    setSlider(input, '0.5')
    expect(readout()).toContain('after 1 step')
    expect(container.querySelectorAll('circle')).toHaveLength(21)
  })

  it('formats the readout', () => {
    expect(gdReadout(0.01)).toContain('η = 0.01')
  })
})

describe('MomentumBetaFigure', () => {
  it('updates the readout when beta moves', () => {
    act(() => root.render(<MomentumBetaFigure />))
    const input = container.querySelector('input[type="range"]') as HTMLInputElement
    const before = readout()
    expect(before).toContain('β = 0.70')
    setSlider(input, '0')
    expect(readout()).toContain('β = 0.00')
    expect(readout()).not.toBe(before)
    expect(container.textContent).toContain('plain gradient descent (dashed)')
  })

  it('reports an unreached target', () => {
    expect(momentumReadout(0.99)).toContain('β = 0.99')
  })
})

describe('SigmoidNeuronFigure', () => {
  it('shows the decision boundary and handles w = 0', () => {
    act(() => root.render(<SigmoidNeuronFigure />))
    const [w, b] = Array.from(container.querySelectorAll('input[type="range"]')) as HTMLInputElement[]
    expect(readout()).toBe('Decision boundary at x = 0.00')
    setSlider(b, '4')
    expect(readout()).toBe('Decision boundary at x = -4.00')
    setSlider(w, '0')
    expect(readout()).toContain('no decision boundary')
    expect(container.querySelector('.interactive-figure__boundary')).toBeNull()
    setSlider(w, '0.5')
    setSlider(b, '10')
    expect(readout()).toBe('Decision boundary at x = -20.00')
    expect(container.querySelector('.interactive-figure__boundary')).toBeNull()
  })

  it('formats helper output', () => {
    expect(sigmoidReadout(2, 0)).toBe('Decision boundary at x = 0.00')
  })
})

describe('scale', () => {
  it('maps linearly and clamps', () => {
    expect(scale(0, 10, 0, 100)(5)).toBe(50)
    expect(scale(0, 1, 0, 100)(1e9)).toBe(1e5)
    expect(scale(0, 1, 0, 100)(-1e9)).toBe(-1e5)
  })
})
