// Brickwork: the knee walls along both sides and the front, the limewashed end wall around the
// door, and the stone coping on top of the knee walls. Sizes in metres.

// ===== Internal modules =====
import { Builder } from '../build'
import { DOOR_H, DOOR_W, EAVE, ENTRY_W, HALF, KNEE, LENGTH } from '../world'

// ===== Constants =====

/** Knee wall thickness (m). */
const KNEE_THICKNESS = 0.22
/** End wall thickness (m). */
const END_THICKNESS = 0.24

// ===== Builders =====

/** Knee walls: both long sides, and the two stubs beside the entrance. */
export const wallGeometry = () => {
  const builder = new Builder()
  for (const side of [-1, 1]) builder.box(KNEE_THICKNESS, KNEE, LENGTH + KNEE_THICKNESS, [side * (HALF - 0.04), KNEE / 2, LENGTH / 2], { tile: 1 })
  const stub = HALF - ENTRY_W / 2 - 0.08
  for (const side of [-1, 1]) builder.box(stub, KNEE, KNEE_THICKNESS, [side * (ENTRY_W / 2 + 0.08 + stub / 2), KNEE / 2, 0], { tile: 1 })
  return builder.merge()
}

/** End wall up to the eave, with the door opening. */
export const endWallGeometry = () => {
  const builder = new Builder()
  const z = LENGTH + END_THICKNESS / 2 - 0.02
  const jamb = HALF - DOOR_W / 2 - 0.06
  for (const side of [-1, 1]) builder.box(jamb, EAVE, END_THICKNESS, [side * (DOOR_W / 2 + 0.06 + jamb / 2), EAVE / 2, z], { tile: 1 })
  builder.box(DOOR_W + 0.12, EAVE - DOOR_H - 0.06, END_THICKNESS, [0, (EAVE + DOOR_H + 0.06) / 2, z], { tile: 1 }) // above the door
  return builder.merge()
}

/** Stone coping on the knee walls, plus the entrance threshold. */
export const copingGeometry = () => {
  const builder = new Builder()
  for (const side of [-1, 1]) builder.box(0.3, 0.05, LENGTH + 0.3, [side * (HALF - 0.04), KNEE + 0.02, LENGTH / 2], { tile: 0.5 })
  const stub = HALF - ENTRY_W / 2 - 0.08
  for (const side of [-1, 1]) builder.box(stub, 0.05, 0.3, [side * (ENTRY_W / 2 + 0.08 + stub / 2), KNEE + 0.02, 0], { tile: 0.5 })
  builder.box(ENTRY_W + 0.3, 0.04, 0.5, [0, 0.02, 0]) // threshold
  return builder.merge()
}
