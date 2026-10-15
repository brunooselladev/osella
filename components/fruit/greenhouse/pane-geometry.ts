// Every pane of glass as flat quads with a seed each: the side walls, the lapped roof, both gables
// (kept clear of the doorway) and the open vent. The glass shader reads the seed to vary the wash.

// ===== Internal modules =====
import { QuadBuilder } from '../build'
import { rng } from '../textures'
import { vec3 } from '../vec'
import { BAY, BAYS, EAVE, ENTRY_H, ENTRY_W, HALF, KNEE, LENGTH, RIDGE, TRANSOM, roofY } from '../world'
import { VENT, VENT_LENGTH, ventPoint } from './vent'

// ===== Constants =====

/** Gap between a pane and its glazing bar (m). */
const INSET = 0.006
/** Lapped panes up each roof slope. */
const ROOF_ROWS = 5

// ===== Builder =====

export const paneGeometry = () => {
  const quads = new QuadBuilder(rng(7))

  // --- side walls and roof, four panes per bay ---
  for (const side of [-1, 1]) {
    const x = side * (HALF + 0.005)
    for (let k = 0; k < BAYS; k++) {
      for (let j = 0; j < 4; j++) {
        const z0 = k * BAY + j * 0.5 + INSET
        const z1 = z0 + 0.5 - INSET * 2
        // wall: two rows, knee to transom and transom to eave
        for (const [y0, y1] of [
          [KNEE + 0.05, TRANSOM],
          [TRANSOM, EAVE - 0.05],
        ]) {
          quads.quad(vec3(x, y0, z0), vec3(x, y0, z1), vec3(x, y1, z1), vec3(x, y1, z0))
        }
        // roof: lapped panes up the slope, skipping the vent's opening
        for (let row = 0; row < ROOF_ROWS; row++) {
          const t0 = row / ROOF_ROWS
          const t1 = (row + 1) / ROOF_ROWS + 0.012
          const zCentre = (z0 + z1) / 2
          if (side === VENT.side && zCentre > VENT.z0 && zCentre < VENT.z1 && t0 >= VENT.t0 - 0.05 && t1 <= VENT.t1 + 0.1) continue
          const onSlope = (t: number) => [side * HALF * (1 - t), EAVE + (RIDGE - EAVE) * t + 0.02] as const
          const [ax, ay] = onSlope(t0)
          const [bx, by] = onSlope(t1)
          quads.quad(vec3(ax, ay, z0), vec3(ax, ay, z1), vec3(bx, by, z1), vec3(bx, by, z0))
        }
      }
    }
  }

  // --- entrance gable, kept clear of the doorway ---
  const doorEdge = ENTRY_W / 2 + 0.08
  for (let x0 = -HALF; x0 < HALF - 0.01; x0 += 0.5) {
    const x1 = x0 + 0.5
    // split the 0.5 m column where it crosses the door posts
    const spans: [number, number, boolean][] = []
    if (x1 <= -doorEdge || x0 >= doorEdge) spans.push([x0, x1, false])
    else {
      if (x0 < -doorEdge) spans.push([x0, -doorEdge, false])
      spans.push([Math.max(x0, -doorEdge), Math.min(x1, doorEdge), true])
      if (x1 > doorEdge) spans.push([doorEdge, x1, false])
    }
    for (const [from, to, overDoor] of spans) {
      const rows: [number, number][] = overDoor
        ? [[ENTRY_H + 0.08, EAVE]]
        : [
            [KNEE + 0.04, TRANSOM],
            [TRANSOM, EAVE],
          ]
      for (const [y0, y1] of rows) quads.quad(vec3(from + INSET, y0, -0.01), vec3(to - INSET, y0, -0.01), vec3(to - INSET, y1, -0.01), vec3(from + INSET, y1, -0.01))
    }
    quads.quad(vec3(x0 + INSET, EAVE, -0.01), vec3(x1 - INSET, EAVE, -0.01), vec3(x1 - INSET, roofY(x1), -0.01), vec3(x0 + INSET, roofY(x0), -0.01)) // gable triangle
  }

  // --- end gable triangle above the brick wall ---
  for (let x0 = -HALF; x0 < HALF - 0.01; x0 += 0.5) {
    const x1 = x0 + 0.5
    quads.quad(vec3(x0, EAVE, LENGTH - 0.03), vec3(x1, EAVE, LENGTH - 0.03), vec3(x1, roofY(x1), LENGTH - 0.03), vec3(x0, roofY(x0), LENGTH - 0.03))
  }

  // --- the open vent pane (seed 0.99: left clean) ---
  quads.quad(ventPoint(0, VENT.z0), ventPoint(0, VENT.z1), ventPoint(-VENT_LENGTH, VENT.z1), ventPoint(-VENT_LENGTH, VENT.z0), 0.99)
  return quads.geometry()
}
