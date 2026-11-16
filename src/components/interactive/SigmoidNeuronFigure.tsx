import { useState } from 'react'
import { FIG_H, FIG_W, FigureSlider, PLOT, scale } from './FigureSlider'
import { SIGMOID_X_MAX, SIGMOID_X_MIN, decisionBoundary, neuronCurve } from './sigmoidNeuron'

export function sigmoidReadout(w: number, b: number): string {
  const x0 = decisionBoundary(w, b)
  if (x0 === null) return `w = 0: the output is the constant σ(${b.toFixed(1)}), so there is no decision boundary`
  return `Decision boundary at x = ${(x0 === 0 ? 0 : x0).toFixed(2)}`
}

export function SigmoidNeuronFigure() {
  const [w, setW] = useState(1)
  const [b, setB] = useState(0)
  const sx = scale(SIGMOID_X_MIN, SIGMOID_X_MAX, PLOT.l, FIG_W - PLOT.r)
  const sy = scale(0, 1, FIG_H - PLOT.b, PLOT.t)
  const points = neuronCurve(w, b).map((p) => `${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ')
  const x0 = decisionBoundary(w, b)
  const showBoundary = x0 !== null && x0 >= SIGMOID_X_MIN && x0 <= SIGMOID_X_MAX
  return (
    <div className="interactive-figure" role="group" aria-label="Interactive figure: a single sigmoid neuron">
      <svg viewBox={`0 0 ${FIG_W} ${FIG_H}`} role="img" aria-label={`Sigmoid of ${w.toFixed(1)}·x + ${b.toFixed(1)} for x from −6 to 6`}>
        <rect className="interactive-figure__plot" x={PLOT.l} y={PLOT.t} width={FIG_W - PLOT.l - PLOT.r} height={FIG_H - PLOT.t - PLOT.b} />
        <line className="interactive-figure__ref" x1={PLOT.l} x2={FIG_W - PLOT.r} y1={sy(0.5)} y2={sy(0.5)} />
        {showBoundary && (
          <>
            <line className="interactive-figure__boundary" x1={sx(x0)} x2={sx(x0)} y1={PLOT.t} y2={FIG_H - PLOT.b} />
            <circle className="interactive-figure__dot interactive-figure__dot--start" cx={sx(x0)} cy={sy(0.5)} r={6} />
          </>
        )}
        <polyline className="interactive-figure__curve" points={points} />
        <text className="interactive-figure__tick" x={PLOT.l - 8} y={sy(1) + 10} textAnchor="end">1</text>
        <text className="interactive-figure__tick" x={PLOT.l - 8} y={sy(0.5) + 4} textAnchor="end">0.5</text>
        <text className="interactive-figure__tick" x={PLOT.l - 8} y={sy(0)} textAnchor="end">0</text>
        <text className="interactive-figure__tick" x={PLOT.l} y={FIG_H - PLOT.b + 18} textAnchor="start">{SIGMOID_X_MIN}</text>
        <text className="interactive-figure__tick" x={sx(0)} y={FIG_H - PLOT.b + 18} textAnchor="middle">0</text>
        <text className="interactive-figure__tick" x={FIG_W - PLOT.r} y={FIG_H - PLOT.b + 18} textAnchor="end">{SIGMOID_X_MAX}</text>
        <text className="interactive-figure__tick" x={(PLOT.l + FIG_W - PLOT.r) / 2} y={FIG_H - 8} textAnchor="middle">input x (output ŷ = σ(w·x + b))</text>
        {showBoundary && (
          <text className="interactive-figure__tick" x={sx(x0) + 8} y={PLOT.t + 16}>boundary</text>
        )}
      </svg>
      <FigureSlider label="Weight w" value={w} min={-10} max={10} step={0.1} digits={1} onChange={setW} />
      <FigureSlider label="Bias b" value={b} min={-10} max={10} step={0.1} digits={1} onChange={setB} />
      <p className="interactive-figure__readout" aria-live="polite">{sigmoidReadout(w, b)}</p>
    </div>
  )
}
