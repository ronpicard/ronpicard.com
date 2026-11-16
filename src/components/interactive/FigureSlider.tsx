import { useId } from 'react'

type Props = {
  label: string
  value: number
  min: number
  max: number
  step: number
  digits: number
  onChange: (value: number) => void
}

/** Labelled range input with a visible current value. */
export function FigureSlider({ label, value, min, max, step, digits, onChange }: Props) {
  const id = useId()
  return (
    <div className="interactive-figure__control">
      <label htmlFor={id}>
        {label} = <output htmlFor={id}>{value.toFixed(digits)}</output>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}

export const FIG_W = 720
export const FIG_H = 400
export const PLOT = { l: 56, r: 20, t: 20, b: 44 }

/** Linear map from a data range to a pixel range; values are clamped to +-1e5 px to keep SVG finite. */
export function scale(d0: number, d1: number, p0: number, p1: number) {
  return (v: number) => {
    const px = p0 + ((v - d0) / (d1 - d0)) * (p1 - p0)
    return Math.max(-1e5, Math.min(1e5, px))
  }
}
