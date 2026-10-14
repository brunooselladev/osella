// While the greenhouse compiles, its line drawing (the board's gable frames receding to the door)
// sketches itself in faint ink. The real room then fades in over it. Server-rendered, no WebGL.

const VP = { x: 760, y: 470 }
// one gable frame at scale k, centred on the vanishing point
const frame = (k: number) => {
  const w = 760 * k
  return [
    [VP.x - w, VP.y + 430 * k],
    [VP.x - w, VP.y - 330 * k],
    [VP.x, VP.y - 640 * k],
    [VP.x + w, VP.y - 330 * k],
    [VP.x + w, VP.y + 430 * k],
  ]
}
const SCALES = [1.15, 0.72, 0.48, 0.33, 0.24, 0.18, 0.14]
const FRAMES = SCALES.map((k) => frame(k).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' '))
const outer = frame(SCALES[0])
// eaves, ridge and floor edges running back to the door
const RAILS = [outer[0], outer[1], outer[2], outer[3], outer[4]].map(([x, y]) => `M${x.toFixed(1)} ${y.toFixed(1)} L${VP.x} ${VP.y}`)
const DOOR = `M${VP.x - 16} ${VP.y + 60} V${VP.y + 6} H${VP.x + 16} V${VP.y + 60}`

export function FruitLoader({ done, label }: { done: boolean; label: string }) {
  return (
    <div className={`fruit-loader${done ? ' is-done' : ''}`} role="status" aria-live="polite" aria-busy={!done}>
      <svg viewBox="0 0 1520 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {RAILS.map((d, i) => (
          <path key={d} d={d} pathLength={1} className="fruit-loader-rail" style={{ animationDelay: `${i * 90}ms` }} />
        ))}
        {FRAMES.map((points, i) => (
          <polyline key={points} points={points} pathLength={1} className="fruit-loader-frame" style={{ animationDelay: `${300 + i * 170}ms` }} />
        ))}
        <path d={DOOR} pathLength={1} className="fruit-loader-door" />
      </svg>
      <span className="sr-only">{done ? '' : label}</span>
    </div>
  )
}
