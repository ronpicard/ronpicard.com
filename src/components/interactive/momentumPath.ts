/** Plain gradient descent vs heavy-ball momentum on L = 0.5 * (A*x^2 + B*y^2). */

export const MOM_A = 50
export const MOM_B = 1
export const MOM_ETA = 0.036
export const MOM_START: Point = { x: 0.4, y: 3 }
export const MOM_TOLERANCE = 0.05
const MAX_STEPS = 2000

export type Point = { x: number; y: number }

export function valleyLoss(p: Point): number {
  return 0.5 * (MOM_A * p.x * p.x + MOM_B * p.y * p.y)
}

export function valleyGrad(p: Point): Point {
  return { x: MOM_A * p.x, y: MOM_B * p.y }
}

export function norm(p: Point): number {
  return Math.hypot(p.x, p.y)
}

/** Iterates theta_0..theta_steps. beta = 0 is plain gradient descent. */
export function momentumPath(beta: number, steps: number, eta = MOM_ETA): Point[] {
  const path: Point[] = [MOM_START]
  let theta = MOM_START
  let v: Point = { x: 0, y: 0 }
  for (let i = 0; i < steps; i += 1) {
    const g = valleyGrad(theta)
    v = { x: beta * v.x + eta * g.x, y: beta * v.y + eta * g.y }
    theta = { x: theta.x - v.x, y: theta.y - v.y }
    path.push(theta)
  }
  return path
}

/** First step n with ||theta_n|| < tolerance, or null if not reached within the cap. */
export function stepsToReach(beta: number, tolerance = MOM_TOLERANCE, eta = MOM_ETA): number | null {
  let theta = MOM_START
  let v: Point = { x: 0, y: 0 }
  for (let n = 0; n <= MAX_STEPS; n += 1) {
    if (norm(theta) < tolerance) return n
    const g = valleyGrad(theta)
    v = { x: beta * v.x + eta * g.x, y: beta * v.y + eta * g.y }
    theta = { x: theta.x - v.x, y: theta.y - v.y }
  }
  return null
}
