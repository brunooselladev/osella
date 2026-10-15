// While the greenhouse compiles, its line drawing (the board's gable frames receding to the door)
// sketches itself in faint ink. The real room then fades in over it. Server-rendered, no WebGL.

// ===== Constants =====

/** Vanishing point in the 1520 × 900 viewBox. */
const VANISHING = { x: 760, y: 470 }
/** Scale of each gable frame, nearest first. */
const SCALES = [1.15, 0.72, 0.48, 0.33, 0.24, 0.18, 0.14]

// ===== Helpers =====

/** One gable frame at scale k, centred on the vanishing point: floor-left, eave-left, ridge, eave-right, floor-right. */
const frame = (k: number) => {
  const halfWidth = 760 * k
  return [
    [VANISHING.x - halfWidth, VANISHING.y + 430 * k],
    [VANISHING.x - halfWidth, VANISHING.y - 330 * k],
    [VANISHING.x, VANISHING.y - 640 * k],
    [VANISHING.x + halfWidth, VANISHING.y - 330 * k],
    [VANISHING.x + halfWidth, VANISHING.y + 430 * k],
  ]
}

const FRAMES = SCALES.map((k) => frame(k).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' '))
const nearest = frame(SCALES[0])
/** Eaves, ridge and floor edges running back to the door. */
const RAILS = nearest.map(([x, y]) => `M${x.toFixed(1)} ${y.toFixed(1)} L${VANISHING.x} ${VANISHING.y}`)
const DOOR = `M${VANISHING.x - 16} ${VANISHING.y + 60} V${VANISHING.y + 6} H${VANISHING.x + 16} V${VANISHING.y + 60}`

// ===== Component: FruitLoader =====

export const FruitLoader = ({ done, label }: { done: boolean; label: string }) => (
  <div className={`fruit-loader${done ? ' is-done' : ''}`} role="status" aria-live="polite" aria-busy={!done}>
    <svg viewBox="0 0 1520 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {RAILS.map((d, index) => (
        <path key={d} d={d} pathLength={1} className="fruit-loader-rail" style={{ animationDelay: `${index * 90}ms` }} />
      ))}
      {FRAMES.map((points, index) => (
        <polyline key={points} points={points} pathLength={1} className="fruit-loader-frame" style={{ animationDelay: `${300 + index * 170}ms` }} />
      ))}
      <path d={DOOR} pathLength={1} className="fruit-loader-door" />
    </svg>
    <span className="sr-only">{done ? '' : label}</span>
  </div>
)
