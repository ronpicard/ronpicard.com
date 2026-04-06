import { useMemo, type CSSProperties } from 'react'

const COUNT = 42

function pseudoRandom(seed: number) {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453
  return x - Math.floor(x)
}

export function AmbientParticles() {
  const dots = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const r1 = pseudoRandom(i * 3 + 1)
        const r2 = pseudoRandom(i * 3 + 2)
        const r3 = pseudoRandom(i * 3 + 3)
        return {
          id: i,
          left: `${(r1 * 94 + 3).toFixed(2)}%`,
          top: `${(r2 * 88 + 6).toFixed(2)}%`,
          size: `${2 + (i % 4) + r3 * 2}px`,
          delay: `${(r1 * 6).toFixed(2)}s`,
          duration: `${5 + (i % 6) + r2 * 3}s`,
          dx: `${(r2 - 0.5) * 28}px`,
          dy: `${(r1 - 0.5) * 36}px`,
          hue: i % 2 === 0 ? 'cyan' : 'magenta',
        }
      }),
    [],
  )

  return (
    <div className="ambient-particles" aria-hidden>
      {dots.map((d) => (
        <span
          key={d.id}
          className={`ambient-particles__dot ambient-particles__dot--${d.hue}`}
          style={
            {
              left: d.left,
              top: d.top,
              width: d.size,
              height: d.size,
              animationDelay: d.delay,
              animationDuration: d.duration,
              '--amb-dx': d.dx,
              '--amb-dy': d.dy,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
