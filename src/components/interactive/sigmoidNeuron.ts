/** A single neuron a = sigmoid(w*x + b) in one input dimension. */

export const SIGMOID_X_MIN = -6
export const SIGMOID_X_MAX = 6

export function sigmoid(z: number): number {
  return z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z))
}

export function neuron(x: number, w: number, b: number): number {
  return sigmoid(w * x + b)
}

/** x where the output equals 0.5, or null when w = 0 (a flat line has no boundary). */
export function decisionBoundary(w: number, b: number): number | null {
  return w === 0 ? null : -b / w
}

export function neuronCurve(w: number, b: number, samples = 121): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = []
  for (let i = 0; i < samples; i += 1) {
    const x = SIGMOID_X_MIN + ((SIGMOID_X_MAX - SIGMOID_X_MIN) * i) / (samples - 1)
    out.push({ x, y: neuron(x, w, b) })
  }
  return out
}
