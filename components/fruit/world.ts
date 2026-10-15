// Greenhouse dimensions. 1 unit = 1 metre. The entrance gable sits at z = 0, the end wall at
// z = LENGTH, the aisle runs down +z. Everything that builds the room reads these.

// ===== Internal modules =====
import type { Vec3 } from './vec'

// ===== Constants =====

// --- Shell ---
/** Half the inside width (m); the room is 5.9 m wide. */
export const HALF = 2.95
/** Top of the brick knee wall (m); the glass starts here. */
export const KNEE = 0.72
/** Eave height (m), where the side glass meets the roof. */
export const EAVE = 2.8
/** Ridge height (m). */
export const RIDGE = 4.35
/** Length of the room (m). */
export const LENGTH = 20
/** Distance between structural frames (m). */
export const BAY = 2
/** Number of bays down the room. */
export const BAYS = LENGTH / BAY
/** Height of the transom bar halfway up the side glass (m). */
export const TRANSOM = (KNEE + EAVE) / 2
/** Roof pitch (radians), eave to ridge. */
export const ROOF_SLOPE = Math.atan2(RIDGE - EAVE, HALF)

// --- Benches ---
/** Bench surface height (m). */
export const BENCH_TOP = 0.86
/** Inner bench edge, distance from the aisle centre (m). */
export const BENCH_IN = 1.42
/** Outer bench edge (m). */
export const BENCH_OUT = 2.7
/** First plank, z (m). */
export const BENCH_START = 0.9
/** Last plank, z (m). */
export const BENCH_END = 19.25

// --- Doors ---
/** End door leaf, width and height (m). */
export const DOOR_W = 1.0
export const DOOR_H = 2.15
/** Entrance opening in the front gable, width and height (m). */
export const ENTRY_W = 1.56
export const ENTRY_H = 2.3

// --- Members ---
/** Square post section (m). */
export const POST = 0.075
/** Glazing bar section (m). */
export const BAR = 0.028

// --- Fixtures ---
/** The lantern on the left bench near the end wall; the glass mirrors it at night. */
export const LAMP_POS: Vec3 = [-1.95, BENCH_TOP + 0.42, 18.7]

// ===== Helpers =====

/** Roof height at a given x across the room (m). */
export const roofY = (x: number) => EAVE + (RIDGE - EAVE) * (1 - Math.abs(x) / HALF)
