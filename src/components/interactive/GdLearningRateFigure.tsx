import { useState } from 'react'
import { FIG_H, FIG_W, FigureSlider, PLOT, scale } from './FigureSlider'
import { GD_TARGET, gdLoss, gdPath, gdStatus, gdStepsToConverge } from './gdPath'

const STEPS = 20
const W_MIN = -4
const W_MAX = 10
const L_MAX = 50

export function gdReadout(eta: number): string {
  const e = eta.toFixed(2)
  const status = gdStatus(eta)
  if (status === 'diverges') return `η = ${e}: diverges, each step lands farther from the minimum`
  if (status === 'oscillates') return `η = ${e}: oscillates, bouncing between two points forever`
  const n = gdStepsToConverge(eta)
  return `η = ${e}: reaches |w − 3| < 0.01 after ${n} step${n === 1 ? '' : 's'}`
}

export function GdLearningRateFigure() {
  const [eta, setEta] = useState(0.1)
  const sx = scale(W_MIN, W_MAX, PLOT.l, FIG_W - PLOT.r)
  const sy = scale(0, L_MAX, FIG_H - PLOT.b, PLOT.t)
  const curve = Array.from({ length: 141 }, (_, i) => {
    const w = W_MIN + ((W_MAX - W_MIN) * i) / 140
    return `${sx(w).toFixed(1)},${sy(gdLoss(w)).toFixed(1)}`
  }).join(' ')
  const path = gdPath(eta, STEPS)
  const pts = path.map((w) => ({ x: sx(w), y: sy(gdLoss(w)) }))
  return (
    <div className="interactive-figure" role="group" aria-label="Interactive figure: gradient descent and the learning rate">
      <svg viewBox={`0 0 ${FIG_W} ${FIG_H}`} role="img" aria-label={`Loss curve (w − 3)² with ${STEPS} gradient descent steps at learning rate ${eta.toFixed(2)}`}>
        <defs>
          <clipPath id="gd-plot-clip">
            <rect x={PLOT.l} y={PLOT.t} width={FIG_W - PLOT.l - PLOT.r} height={FIG_H - PLOT.t - PLOT.b} />
          </clipPath>
        </defs>
        <rect className="interactive-figure__plot" x={PLOT.l} y={PLOT.t} width={FIG_W - PLOT.l - PLOT.r} height={FIG_H - PLOT.t - PLOT.b} />
        <line className="interactive-figure__ref" x1={sx(GD_TARGET)} x2={sx(GD_TARGET)} y1={PLOT.t} y2={FIG_H - PLOT.b} />
        <g clipPath="url(#gd-plot-clip)">
          <polyline className="interactive-figure__curve" points={curve} />
          <polyline className="interactive-figure__path" points={pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} />
          {pts.map((p, i) => (
            <circle key={i} className={i === 0 ? 'interactive-figure__dot interactive-figure__dot--start' : 'interactive-figure__dot'} cx={p.x} cy={p.y} r={i === 0 ? 6 : 3.5} />
          ))}
        </g>
        <text className="interactive-figure__tick" x={sx(GD_TARGET)} y={FIG_H - PLOT.b + 18} textAnchor="middle">w = 3</text>
        <text className="interactive-figure__tick" x={PLOT.l} y={FIG_H - PLOT.b + 18} textAnchor="start">{W_MIN}</text>
        <text className="interactive-figure__tick" x={FIG_W - PLOT.r} y={FIG_H - PLOT.b + 18} textAnchor="end">{W_MAX}</text>
        <text className="interactive-figure__tick" x={(PLOT.l + FIG_W - PLOT.r) / 2} y={FIG_H - 8} textAnchor="middle">weight w</text>
        <text className="interactive-figure__tick" x={PLOT.l - 8} y={PLOT.t + 10} textAnchor="end">loss</text>
      </svg>
      <FigureSlider label="Learning rate η" value={eta} min={0.01} max={1.1} step={0.01} digits={2} onChange={setEta} />
      <p className="interactive-figure__readout" aria-live="polite">{gdReadout(eta)}</p>
    </div>
  )
}
