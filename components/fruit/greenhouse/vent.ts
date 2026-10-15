// The one roof vent, propped open on the right slope of bay 2. The frame and the glass pane need
// the same hinge and tilt, so both are computed here once.

// ===== External modules =====
import * as THREE from 'three'

// ===== Internal modules =====
import { EAVE, HALF, RIDGE, ROOF_SLOPE } from '../world'

// ===== Constants =====

/** Which slope (side) and where along it (z0..z1, m) the vent sits; t0..t1 is its span up the slope (0 eave, 1 ridge); open in radians. */
export const VENT = { side: 1, t0: 0.58, t1: 0.9, z0: 4.5, z1: 5.5, open: 0.42 }

/** Length of the vent along the slope (m). */
export const VENT_LENGTH = (VENT.t1 - VENT.t0) * Math.hypot(HALF, RIDGE - EAVE)

/** Hinge point: the vent's upper edge on the roof (x, y); z runs along the room. */
export const VENT_HINGE = new THREE.Vector3(VENT.side * HALF * (1 - VENT.t1), EAVE + (RIDGE - EAVE) * VENT.t1, 0)

/** Lays the vent (built hanging down -y from its hinge) onto the slope, then tilts it open. */
export const VENT_ROTATION = new THREE.Matrix4().makeRotationZ(VENT.side * (Math.PI / 2 - ROOF_SLOPE) + VENT.side * VENT.open)

// ===== Helpers =====

/** A point on the hanging vent (y down the vent, z along it) placed into the room. */
export const ventPoint = (y: number, z: number) => new THREE.Vector3(0, y, z).applyMatrix4(VENT_ROTATION).add(new THREE.Vector3(VENT_HINGE.x, VENT_HINGE.y, 0))
