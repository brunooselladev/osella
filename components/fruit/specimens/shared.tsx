'use client'

// What the four specimens have in common: the per-frame behaviour (ripening, opening, spin, lean),
// the rim light, and the geometry helpers that turn lathes, tubes and blades into organisms.

// ===== External modules =====
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// ===== Internal modules =====
import { live } from '../bench-live'
import { requestShadowUpdate } from '../scene/shadows'
import type { Vec3 } from '../vec'

// ===== Types =====

type SpecimenOptions = {
  /** Spin with the scroll's inertia. */
  spin?: boolean
  /** How far it leans toward the camera when selected (1 = full). */
  lean?: number
}

/** Per-specimen animation state, damped every frame. */
export type SpecimenState = { spin: number; lean: number; lift: number; ripen: number; open: number }

// ===== Constants =====

/** Shapes for blades: a leaf, a petal, a sepal. u along the blade (0 = base) → half-width 0..1. */
export const profiles = {
  leaf: (u: number) => Math.pow(Math.sin(Math.PI * u), 0.75) * (1 - 0.25 * u),
  heart: (u: number) => {
    const body = Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.92 + 0.08)), 0.65) * (1.05 - 0.5 * u)
    return u < 0.1 ? body * (0.55 + 4.5 * u) : body
  },
  petal: (u: number) => Math.pow(Math.sin(Math.PI * (0.06 + u * 0.94)), 0.5) * (0.35 + 0.65 * Math.sqrt(u)) * (1 - Math.pow(u, 6)),
  sepal: (u: number) => Math.pow(1 - u, 0.8) * Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + u)), 0.4),
}

// ===== Hook: useSpecimen =====

/**
 * Selection, phototropism, inertia spin and ripening for one specimen.
 * `ripen` 0..2: closed → ripe → open. Rises with camera proximity; an open sheet adds one stage.
 * `open` 0..1: reading the case in the sheet splits the specimen open, a little more per growth stage.
 * Returns the group to animate and the state the specimen reads in its own useFrame.
 */
export const useSpecimen = (id: string, position: Vec3, { spin = true, lean = 1 }: SpecimenOptions = {}) => {
  // --- Refs & state ---
  const group = useRef<THREE.Group>(null)
  const state = useRef<SpecimenState>({ spin: 0, lean: 0, lift: 0, ripen: 0, open: 0 })
  const anchor = useRef(new THREE.Vector3(...position))
  const scratchDirection = useRef(new THREE.Vector3())

  // --- Frame ---
  useFrame(({ camera }, dt) => {
    const node = group.current
    if (!node) return
    const current = state.current
    const before = current.ripen + current.open + current.spin + current.lean + current.lift
    const selected = live.selectedId === id || live.hoverId === id
    const distance = camera.position.distanceTo(anchor.current)
    let wantRipen = (1 - THREE.MathUtils.smoothstep(distance, 2.2, 7.5)) * 2
    const mine = live.sheetOpen && live.selectedId === id
    if (mine) wantRipen += 1
    if (mine && live.reading) wantRipen = 2
    wantRipen = THREE.MathUtils.clamp(wantRipen, 0, 2)
    current.ripen = live.reduce ? wantRipen : THREE.MathUtils.damp(current.ripen, wantRipen, 2.4, dt)
    node.userData.ripen = current.ripen
    const wantOpen = mine && live.reading ? 0.45 + 0.55 * (live.step / 4) : 0
    current.open = live.reduce ? wantOpen : THREE.MathUtils.damp(current.open, wantOpen, 2.2, dt)

    if (spin && !live.reduce) {
      current.spin += live.velocity * 0.0016
      current.spin *= Math.exp(-2.2 * dt)
    } else current.spin = 0
    current.lean = THREE.MathUtils.damp(current.lean, selected && !live.reduce ? 0.105 * lean : 0, 8, dt)
    current.lift = THREE.MathUtils.damp(current.lift, selected ? 0.065 : 0, 10, dt)

    // lean toward the camera, whichever side it is on
    scratchDirection.current.copy(camera.position).sub(anchor.current)
    scratchDirection.current.y = 0
    const yaw = Math.atan2(scratchDirection.current.x, scratchDirection.current.z)
    node.position.y = current.lift
    node.rotation.y = current.spin * 0.35
    node.rotation.z = Math.sin(yaw) * current.lean
    node.rotation.x = -Math.cos(yaw) * current.lean * 0.35

    // still ripening, opening, spinning or leaning: its shadow has to follow
    const after = current.ripen + current.open + current.spin + current.lean + current.lift
    if (Math.abs(after - before) > 1e-4) requestShadowUpdate('specimen')
  })

  return { group, state }
}

// ===== Component: Rim =====

/** A rose point light that comes on when the specimen is selected or hovered. */
export const Rim = ({ id, at = [0.3, 0.42, 0.5] }: { id: string; at?: Vec3 }) => {
  // --- Refs & state ---
  const lightRef = useRef<THREE.PointLight>(null)

  // --- Frame ---
  useFrame((_, dt) => {
    if (!lightRef.current) return
    const on = live.selectedId === id || live.hoverId === id
    lightRef.current.intensity = THREE.MathUtils.damp(lightRef.current.intensity, on ? 2.2 : 0, 10, dt)
  })

  // --- Render ---
  return <pointLight ref={lightRef} color="#e0566b" intensity={0} distance={2.2} decay={2} position={at} />
}

// ===== Helpers: geometry =====

/**
 * A blade in the XY plane growing up +Y. `cup` curls the sides toward +Z, `bend` arches the tip
 * toward +Z. Real vertices across the blade so it can cup and bend.
 */
export const bladeGeometry = (length: number, width: number, profile: (u: number) => number, cup = 0.3, bend = 0.2, segmentsAlong = 14, segmentsAcross = 6) => {
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  for (let i = 0; i <= segmentsAlong; i++) {
    const u = i / segmentsAlong
    const halfWidth = profile(u) * width * 0.5
    for (let j = 0; j <= segmentsAcross; j++) {
      const v = (j / segmentsAcross) * 2 - 1
      const x = v * halfWidth
      const z = cup * v * v * halfWidth + bend * u * u * length
      const y = u * length - bend * u * u * length * 0.25
      positions.push(x, y, z)
      uvs.push(0.5 + v * 0.5 * (halfWidth / (width * 0.5 || 1)), u)
    }
  }
  const row = segmentsAcross + 1
  for (let i = 0; i < segmentsAlong; i++) {
    for (let j = 0; j < segmentsAcross; j++) {
      const a = i * row + j
      indices.push(a, a + 1, a + row, a + 1, a + row + 1, a + row)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return fixNormals(geometry)
}

/** Tapers a TubeGeometry from `start` radius factor to `end` along its length. */
export const taperTube = (tube: THREE.TubeGeometry, start = 1, end = 0.35) => {
  const { tubularSegments, radialSegments, path } = tube.parameters
  const positions = tube.getAttribute('position') as THREE.BufferAttribute
  const centre = new THREE.Vector3()
  const point = new THREE.Vector3()
  for (let i = 0; i <= tubularSegments; i++) {
    path.getPointAt(i / tubularSegments, centre)
    const factor = THREE.MathUtils.lerp(start, end, i / tubularSegments)
    for (let j = 0; j <= radialSegments; j++) {
      const index = i * (radialSegments + 1) + j
      point.fromBufferAttribute(positions, index).sub(centre).multiplyScalar(factor).add(centre)
      positions.setXYZ(index, point.x, point.y, point.z)
    }
  }
  positions.needsUpdate = true
  tube.computeVertexNormals()
  return fixNormals(tube)
}

/** Deterministic low-frequency wobble so no two forms are perfect solids of revolution. */
export const wobble = (geometry: THREE.BufferGeometry, amount: number, frequency = 3, seed = 1) => {
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute
  const point = new THREE.Vector3()
  for (let i = 0; i < positions.count; i++) {
    point.fromBufferAttribute(positions, i)
    const noise =
      Math.sin(point.x * frequency + seed) * Math.cos(point.z * frequency * 1.3 + seed * 2) * 0.6 +
      Math.sin(point.y * frequency * 1.7 + seed * 3) * 0.4
    const radius = Math.hypot(point.x, point.z)
    if (radius > 1e-4) {
      const factor = 1 + noise * amount
      positions.setX(i, point.x * factor)
      positions.setZ(i, point.z * factor)
    }
  }
  positions.needsUpdate = true
  geometry.computeVertexNormals()
  return fixNormals(geometry)
}

/**
 * Poles of lathes and parametric surfaces collapse to a point and get zero normals, which turn
 * into NaN pixels in the shader (and bloom smears them over the frame). Points them up or down.
 */
export const fixNormals = (geometry: THREE.BufferGeometry) => {
  const normals = geometry.getAttribute('normal') as THREE.BufferAttribute
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute
  geometry.computeBoundingBox()
  const middleY = geometry.boundingBox ? (geometry.boundingBox.min.y + geometry.boundingBox.max.y) / 2 : 0
  for (let i = 0; i < normals.count; i++) {
    const x = normals.getX(i)
    const y = normals.getY(i)
    const z = normals.getZ(i)
    const length = Math.hypot(x, y, z)
    if (!(length > 1e-6)) normals.setXYZ(i, 0, positions.getY(i) >= middleY ? 1 : -1, 0)
  }
  normals.needsUpdate = true
  return geometry
}

/**
 * Merges the closed parts and stores an "opened" pose as morph target 0, so a single mesh (and a
 * single transmission material) can split apart by animating `morphTargetInfluences[0]`.
 */
export const openable = (parts: THREE.BufferGeometry[], pose: (part: THREE.BufferGeometry, index: number) => void) => {
  const flat = parts.map((part) => (part.index ? part.toNonIndexed() : part.clone()))
  const opened = flat.map((part, index) => {
    const copy = part.clone()
    pose(copy, index)
    return copy
  })
  const closed = mergeGeometries(flat, false)
  const target = mergeGeometries(opened, false)
  if (!closed || !target) throw new Error('openable: merge failed')
  closed.morphAttributes.position = [target.getAttribute('position')]
  closed.morphAttributes.normal = [target.getAttribute('normal')]
  closed.computeBoundingSphere()
  // the opened pose reaches further than the closed one; keep it from being culled mid-way
  if (closed.boundingSphere) closed.boundingSphere.radius *= 1.6
  return closed
}

/** Rotates a part about an axis through a pivot, then shifts it. */
export const hinge = (part: THREE.BufferGeometry, pivot: THREE.Vector3, axis: THREE.Vector3, angle: number, shift = new THREE.Vector3()) => {
  part.translate(-pivot.x, -pivot.y, -pivot.z)
  part.applyMatrix4(new THREE.Matrix4().makeRotationAxis(axis.clone().normalize(), angle))
  part.translate(pivot.x + shift.x, pivot.y + shift.y, pivot.z + shift.z)
}
