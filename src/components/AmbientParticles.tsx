import { useMemo, type CSSProperties } from 'react'

const TOTAL = 120
/** Rough fraction of items that render as matrix glyphs instead of dots. */
const GLYPH_FRACTION = 0.36

/** Half-range per leg (px); total path span scales with ~4 legs. */
const SEGMENT = 52

const MATRIX_CHARS =
  'ｦｧｨｩｪｫｬｭｮｯｰアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789:・."=*+-<>¦|ﾊﾐﾋﾟﾊｴﾘｸﾀﾝﾅµﾃﾉﾎﾜ×÷§'

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

type AmbientItemBase = {
  id: string
  left: string
  top: string
  hue: 'cyan' | 'magenta'
  driftDur: string
  twDur: string
  driftDelay: string
  twDelay: string
  carryDur: string
  carryDelay: string
  carryX: string
  carryY: string
  x1: string
  y1: string
  x2: string
  y2: string
  x3: string
  y3: string
  x4: string
  y4: string
}

type AmbientItem =
  | (AmbientItemBase & { kind: 'dot'; size: string })
  | (AmbientItemBase & { kind: 'glyph'; char: string; fontSize: string })

function motionBase(i: number): Omit<AmbientItemBase, 'id'> {
  const rPosX = pseudoRandom(i * 997 + 401)
  const rPosY = pseudoRandom(i * 541 + 203)
  const rTwA = pseudoRandom(i * 313 + 67)
  const rTwB = pseudoRandom(i * 211 + 89)
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
    left: `${(rPosX * 96 + 2).toFixed(2)}%`,
    top: `${(rPosY * 96 + 2).toFixed(2)}%`,
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
}

function motionStyle(item: AmbientItemBase): CSSProperties {
  return {
    '--amb-drift-dur': item.driftDur,
    '--amb-tw-dur': item.twDur,
    '--amb-drift-delay': item.driftDelay,
    '--amb-tw-delay': item.twDelay,
    '--amb-x1': item.x1,
    '--amb-y1': item.y1,
    '--amb-x2': item.x2,
    '--amb-y2': item.y2,
    '--amb-x3': item.x3,
    '--amb-y3': item.y3,
    '--amb-x4': item.x4,
    '--amb-y4': item.y4,
  } as CSSProperties
}

export function AmbientParticles() {
  const items = useMemo((): AmbientItem[] => {
    const n = MATRIX_CHARS.length
    return Array.from({ length: TOTAL }, (_, i) => {
      const base = motionBase(i)
      const isGlyph = pseudoRandom(i * 444 + 2) < GLYPH_FRACTION
      if (isGlyph) {
        const ci = Math.min(n - 1, Math.floor(pseudoRandom(i * 883 + 44) * n))
        const fontSize = `${10 + pseudoRandom(i * 55 + 3) * 9}px`
        return {
          kind: 'glyph',
          id: `g-${i}`,
          ...base,
          char: MATRIX_CHARS[ci]!,
          fontSize,
        }
      }
      const rSize = pseudoRandom(i * 433 + 11)
      return {
        kind: 'dot',
        id: `s-${i}`,
        ...base,
        size: `${2 + rSize * 4}px`,
      }
    })
  }, [])

  return (
    <div className="ambient-particles" aria-hidden>
      {items.map((item) => (
        <span
          key={item.id}
          className="ambient-particles__carrier"
          style={
            {
              left: item.left,
              top: item.top,
              '--amb-carry-dur': item.carryDur,
              '--amb-carry-delay': item.carryDelay,
              '--amb-carry-x': item.carryX,
              '--amb-carry-y': item.carryY,
            } as CSSProperties
          }
        >
          {item.kind === 'dot' ? (
            <span
              className={`ambient-particles__dot ambient-particles__dot--${item.hue}`}
              style={
                {
                  width: item.size,
                  height: item.size,
                  ...motionStyle(item),
                } as CSSProperties
              }
            />
          ) : (
            <span
              className={`ambient-particles__glyph ambient-particles__glyph--${item.hue}`}
              style={
                {
                  fontSize: item.fontSize,
                  ...motionStyle(item),
                } as CSSProperties
              }
            >
              {item.char}
            </span>
          )}
        </span>
      ))}
    </div>
  )
}
