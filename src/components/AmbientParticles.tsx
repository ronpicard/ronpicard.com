import { useMemo, type CSSProperties } from 'react'

const SPARK_COUNT = 120

/** Half-range per leg (px); total path span scales with ~4 legs. */
const SEGMENT = 52

function pseudoRandom(seed: number) {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function leg(i: number, k: number) {
  return {
    x: (pseudoRandom(i * 17 + k * 31) - 0.5) * 2 * SEGMENT,
    y: (pseudoRandom(i * 17 + k * 31 + 79) - 0.5) * 2 * SEGMENT,
  }
}

function px(n: number) {
  return `${n.toFixed(1)}px`
}

export function AmbientParticles() {
  const sparks = useMemo(
    () =>
      Array.from({ length: SPARK_COUNT }, (_, i) => {
        const rPosX = pseudoRandom(i * 997 + 401)
        const rPosY = pseudoRandom(i * 541 + 203)
        const rTwA = pseudoRandom(i * 313 + 67)
        const rTwB = pseudoRandom(i * 211 + 89)
        const rSize = pseudoRandom(i * 433 + 11)
        const rCarry = pseudoRandom(i * 919 + 3)
        const rCarryDist = pseudoRandom(i * 727 + 17)

        const v1 = leg(i, 1)
        const v2 = leg(i, 2)
        const v3 = leg(i, 3)
        const v4 = leg(i, 4)

        const x1 = v1.x
        const y1 = v1.y
        const x2 = x1 + v2.x
        const y2 = y1 + v2.y
        const x3 = x2 + v3.x
        const y3 = y2 + v3.y
        const x4 = x3 + v4.x
        const y4 = y3 + v4.y

        const angle = rCarry * Math.PI * 2
        const dist = 40 + rCarryDist * 56
        const carryX = Math.cos(angle) * dist
        const carryY = Math.sin(angle) * dist

        return {
          id: `s-${i}`,
          left: `${(rPosX * 96 + 2).toFixed(2)}%`,
          top: `${(rPosY * 96 + 2).toFixed(2)}%`,
          size: `${2 + rSize * 4}px`,
          driftDur: `${22 + (i % 6) * 1.4 + rTwB * 14}s`,
          twDur: `${32 + (i % 9) * 1.6 + rTwA * 30}s`,
          driftDelay: `${(rTwB * -28).toFixed(2)}s`,
          twDelay: `${(rTwA * 36).toFixed(2)}s`,
          carryDur: `${22 + (i % 5) * 1.5 + rCarry * 20}s`,
          carryDelay: `${(rCarry * -14).toFixed(2)}s`,
          carryX: px(carryX),
          carryY: px(carryY),
          hue: pseudoRandom(i * 127 + 5) < 0.5 ? 'cyan' : 'magenta',
          x1: px(x1),
          y1: px(y1),
          x2: px(x2),
          y2: px(y2),
          x3: px(x3),
          y3: px(y3),
          x4: px(x4),
          y4: px(y4),
        }
      }),
    [],
  )

  return (
    <div className="ambient-particles" aria-hidden>
      {sparks.map((d) => (
        <span
          key={d.id}
          className="ambient-particles__carrier"
          style={
            {
              left: d.left,
              top: d.top,
              '--amb-carry-dur': d.carryDur,
              '--amb-carry-delay': d.carryDelay,
              '--amb-carry-x': d.carryX,
              '--amb-carry-y': d.carryY,
            } as CSSProperties
          }
        >
          <span
            className={`ambient-particles__dot ambient-particles__dot--${d.hue}`}
            style={
              {
                width: d.size,
                height: d.size,
                '--amb-drift-dur': d.driftDur,
                '--amb-tw-dur': d.twDur,
                '--amb-drift-delay': d.driftDelay,
                '--amb-tw-delay': d.twDelay,
                '--amb-x1': d.x1,
                '--amb-y1': d.y1,
                '--amb-x2': d.x2,
                '--amb-y2': d.y2,
                '--amb-x3': d.x3,
                '--amb-y3': d.y3,
                '--amb-x4': d.x4,
                '--amb-y4': d.y4,
              } as CSSProperties
            }
          />
        </span>
      ))}
    </div>
  )
}
