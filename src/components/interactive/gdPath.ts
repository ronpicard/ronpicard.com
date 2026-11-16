/** Gradient descent on L(w) = (w - 3)^2, the figure behind the learning-rate slider. */

export const GD_TARGET = 3
export const GD_START = -2
export const GD_TOLERANCE = 0.01
const MAX_STEPS = 100_000

export type GdStatus = 'converges' | 'oscillates' | 'diverges'

export function gdLoss(w: number): number {
  return (w - GD_TARGET) ** 2
}

/** One update w <- w - eta * L'(w), with L'(w) = 2(w - 3). */
export function gdStep(w: number, eta: number): number {
  return w - eta * 2 * (w - GD_TARGET)
}

/** Iterates w0..w_steps (length steps + 1). */
export function gdPath(eta: number, steps: number, start = GD_START): number[] {
  const path = [start]
  for (let i = 0; i < steps; i += 1) path.push(gdStep(path[i], eta))
  return path
}

/** The error shrinks by |1 - 2*eta| each step: below 1 converges, exactly 1 bounces, above 1 grows. */
export function gdStatus(eta: number): GdStatus {
  const factor = Math.abs(1 - 2 * eta)
  if (Math.abs(factor - 1) < 1e-9) return 'oscillates'
  return factor < 1 ? 'converges' : 'diverges'
}

/** Steps until |w - 3| < tolerance, or null when it never gets there. */
export function gdStepsToConverge(eta: number, tolerance = GD_TOLERANCE): number | null {
  if (gdStatus(eta) !== 'converges') return null
  let w = GD_START
  for (let n = 0; n <= MAX_STEPS; n += 1) {
    if (Math.abs(w - GD_TARGET) < tolerance) return n
    w = gdStep(w, eta)
  }
  return null
}
