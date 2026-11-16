import { useState } from 'react'
import { FIG_H, FIG_W, FigureSlider, PLOT, scale } from './FigureSlider'
import { MOM_A, MOM_ETA, MOM_START, momentumPath, stepsToReach, valleyLoss } from './momentumPath'

const STEPS = 60
const X_MAX = 0.6
const Y_MAX = 4.2

function fmt(n: number | null): string {
  return n === null ? 'more than 2000 steps' : `${n} step${n === 1 ? '' : 's'}`
}

export function momentumReadout(beta: number): string {
  return `Reaching ‖θ‖ < 0.05: plain gradient descent ${fmt(stepsToReach(0))}; momentum (β = ${beta.toFixed(2)}) ${fmt(stepsToReach(beta))}`
}

export function MomentumBetaFigure() {
  const [beta, setBeta] = useState(0.7)
  const sx = scale(-X_MAX, X_MAX, PLOT.l, FIG_W - PLOT.r)
  const sy = scale(-Y_MAX, Y_MAX, FIG_H - PLOT.b, PLOT.t)
  const toPoints = (path: { x: number; y: number }[]) => path.map((p) => `${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ')
  const levels = [0.25, 1, 2.5, 5, valleyLoss(MOM_START)]
  const plain = momentumPath(0, STEPS)
  const mom = momentumPath(beta, STEPS)
  const plotW = FIG_W - PLOT.l - PLOT.r
  const plotH = FIG_H - PLOT.t - PLOT.b
  return (
    <div className="interactive-figure" role="group" aria-label="Interactive figure: plain gradient descent versus momentum in a narrow valley">
      <svg viewBox={`0 0 ${FIG_W} ${FIG_H}`} role="img" aria-label={`Contours of a narrow valley with ${STEPS} steps of plain gradient descent and of momentum with β ${beta.toFixed(2)}, both starting from the same point`}>
        <defs>
          <clipPath id="mom-plot-clip">
            <rect x={PLOT.l} y={PLOT.t} width={plotW} height={plotH} />
          </clipPath>
        </defs>
        <rect className="interactive-figure__plot" x={PLOT.l} y={PLOT.t} width={plotW} height={plotH} />
        <g clipPath="url(#mom-plot-clip)">
          {levels.map((c) => (
            <ellipse key={c} className="interactive-figure__contour" cx={sx(0)} cy={sy(0)} rx={Math.abs(sx(Math.sqrt(c / 5)) - sx(0))} ry={Math.abs(sy(Math.sqrt(2 * c)) - sy(0))} />
          ))}
          <polyline className="interactive-figure__path interactive-figure__path--plain" points={toPoints(plain)} />
          <polyline className="interactive-figure__path interactive-figure__path--momentum" points={toPoints(mom)} />
          <circle className="interactive-figure__dot interactive-figure__dot--start" cx={sx(MOM_START.x)} cy={sy(MOM_START.y)} r={6} />
        </g>
        <circle className="interactive-figure__goal" cx={sx(0)} cy={sy(0)} r={4} />
        <text className="interactive-figure__tick" x={sx(0) + 8} y={sy(0) - 8}>goal</text>
        <text className="interactive-figure__tick" x={(PLOT.l + FIG_W - PLOT.r) / 2} y={FIG_H - 8} textAnchor="middle">x (steep direction)</text>
        <text className="interactive-figure__tick" x={PLOT.l + 8} y={PLOT.t + 16}>y (shallow direction)</text>
        <g transform={`translate(${FIG_W - PLOT.r - 250} ${FIG_H - PLOT.b - 62})`}>
          <rect className="interactive-figure__legend-box" x={-10} y={-4} width={250} height={56} rx={6} />
          <line className="interactive-figure__path interactive-figure__path--plain" x1={0} x2={34} y1={8} y2={8} />
          <text className="interactive-figure__tick" x={44} y={12}>plain gradient descent (dashed)</text>
          <line className="interactive-figure__path interactive-figure__path--momentum" x1={0} x2={34} y1={34} y2={34} />
          <text className="interactive-figure__tick" x={44} y={38}>momentum (solid)</text>
        </g>
      </svg>
      <FigureSlider label="Momentum β" value={beta} min={0} max={0.99} step={0.01} digits={2} onChange={setBeta} />
      <p className="interactive-figure__readout" aria-live="polite">{momentumReadout(beta)}</p>
      <p className="interactive-figure__note">Loss 0.5·({MOM_A}x² + y²), step size {MOM_ETA}, same start for both paths.</p>
    </div>
  )
}
