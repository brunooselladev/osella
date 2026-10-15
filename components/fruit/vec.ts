// Tiny vector helpers shared by the room, the props and the specimens.

// ===== External modules =====
import * as THREE from 'three'

// ===== Types =====

/** A point or direction as a plain tuple. 1 unit = 1 metre. */
export type Vec3 = [number, number, number]

// ===== Helpers =====

/** Shorthand for `new THREE.Vector3(x, y, z)`; the geometry builders call it a lot. */
export const vec3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
