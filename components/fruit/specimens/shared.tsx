'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { live } from '../bench-live'

export type Vec3 = [number, number, number]

type Opts = { spin?: boolean; lean?: number }

/**
 * Selection, phototropism, inertia spin and ripening for one specimen.
 * `ripen` 0..2: closed → ripe → open. Rises with camera proximity; an open sheet adds one stage.
 * `open` 0..1: reading the case in the sheet splits the specimen open, a little more per growth stage.
 */
export function useSpecimen(id: string, position: Vec3, { spin = true, lean = 1 }: Opts = {}) {
  const group = useRef<THREE.Group>(null)
  const state = useRef({ spin: 0, lean: 0, lift: 0, ripen: 0, open: 0 })
  const pos = useRef(new THREE.Vector3(...position))
  const dir = useRef(new THREE.Vector3())

  useFrame(({ camera }, dt) => {
    const g = group.current
    if (!g) return
    const s = state.current
    const selected = live.selectedId === id || live.hoverId === id
    const dist = camera.position.distanceTo(pos.current)
    let want = (1 - THREE.MathUtils.smoothstep(dist, 2.2, 7.5)) * 2
    const mine = live.sheetOpen && live.selectedId === id
    if (mine) want += 1
    if (mine && live.reading) want = 2
    want = THREE.MathUtils.clamp(want, 0, 2)
    s.ripen = live.reduce ? want : THREE.MathUtils.damp(s.ripen, want, 2.4, dt)
    g.userData.ripen = s.ripen
    const wantOpen = mine && live.reading ? 0.45 + 0.55 * (live.step / 4) : 0
    s.open = live.reduce ? wantOpen : THREE.MathUtils.damp(s.open, wantOpen, 2.2, dt)

    if (spin && !live.reduce) {
      s.spin += live.velocity * 0.0016
      s.spin *= Math.exp(-2.2 * dt)
    } else s.spin = 0
    s.lean = THREE.MathUtils.damp(s.lean, selected && !live.reduce ? 0.105 * lean : 0, 8, dt)
    s.lift = THREE.MathUtils.damp(s.lift, selected ? 0.065 : 0, 10, dt)

    dir.current.copy(camera.position).sub(pos.current)
    dir.current.y = 0
    const yaw = Math.atan2(dir.current.x, dir.current.z)
    g.position.y = s.lift
    g.rotation.y = s.spin * 0.35
    g.rotation.z = Math.sin(yaw) * s.lean
    g.rotation.x = -Math.cos(yaw) * s.lean * 0.35
  })

  return { group, state }
}

export function Rim({ id, at = [0.3, 0.42, 0.5] }: { id: string; at?: Vec3 }) {
  const light = useRef<THREE.PointLight>(null)
  useFrame((_, dt) => {
    if (!light.current) return
    const on = live.selectedId === id || live.hoverId === id
    light.current.intensity = THREE.MathUtils.damp(light.current.intensity, on ? 2.2 : 0, 10, dt)
  })
  return <pointLight ref={light} color="#e0566b" intensity={0} distance={2.2} decay={2} position={at} />
}

/** Shapes for blades: a leaf, a petal, a sepal. u along the blade (0 = base), returns half-width 0..1. */
export const profiles = {
  leaf: (u: number) => Math.pow(Math.sin(Math.PI * u), 0.75) * (1 - 0.25 * u),
  heart: (u: number) => {
    const body = Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.92 + 0.08)), 0.65) * (1.05 - 0.5 * u)
    return u < 0.1 ? body * (0.55 + 4.5 * u) : body
  },
  petal: (u: number) => Math.pow(Math.sin(Math.PI * (0.06 + u * 0.94)), 0.5) * (0.35 + 0.65 * Math.sqrt(u)) * (1 - Math.pow(u, 6)),
  sepal: (u: number) => Math.pow(1 - u, 0.8) * Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + u)), 0.4),
}

/**
 * A blade in the XY plane growing up +Y. `cup` curls the sides toward +Z, `bend` arches the tip toward +Z.
 * Real vertices across the blade so it can cup and bend.
 */
export function bladeGeometry(length: number, width: number, profile: (u: number) => number, cup = 0.3, bend = 0.2, segU = 14, segV = 6) {
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= segU; i++) {
    const u = i / segU
    const hw = profile(u) * width * 0.5
    for (let j = 0; j <= segV; j++) {
      const v = (j / segV) * 2 - 1
      const x = v * hw
      const z = cup * v * v * hw + bend * u * u * length
      const y = u * length - bend * u * u * length * 0.25
      pos.push(x, y, z)
      uv.push(0.5 + v * 0.5 * (hw / (width * 0.5 || 1)), u)
    }
  }
  const row = segV + 1
  for (let i = 0; i < segU; i++) {
    for (let j = 0; j < segV; j++) {
      const a = i * row + j
      idx.push(a, a + 1, a + row, a + 1, a + row + 1, a + row)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return fixNormals(g)
}

/** Taper a TubeGeometry from `start` radius factor to `end` along its length. */
export function taperTube(tube: THREE.TubeGeometry, start = 1, end = 0.35) {
  const { tubularSegments, radialSegments, path } = tube.parameters
  const pos = tube.getAttribute('position') as THREE.BufferAttribute
  const c = new THREE.Vector3()
  const p = new THREE.Vector3()
  for (let i = 0; i <= tubularSegments; i++) {
    path.getPointAt(i / tubularSegments, c)
    const k = THREE.MathUtils.lerp(start, end, i / tubularSegments)
    for (let j = 0; j <= radialSegments; j++) {
      const n = i * (radialSegments + 1) + j
      p.fromBufferAttribute(pos, n).sub(c).multiplyScalar(k).add(c)
      pos.setXYZ(n, p.x, p.y, p.z)
    }
  }
  pos.needsUpdate = true
  tube.computeVertexNormals()
  return fixNormals(tube)
}

/** Deterministic low-frequency wobble so no two forms are perfect solids of revolution. */
export function wobble(geo: THREE.BufferGeometry, amount: number, freq = 3, seed = 1) {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const p = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i)
    const n =
      Math.sin(p.x * freq + seed) * Math.cos(p.z * freq * 1.3 + seed * 2) * 0.6 +
      Math.sin(p.y * freq * 1.7 + seed * 3) * 0.4
    const len = Math.hypot(p.x, p.z)
    if (len > 1e-4) {
      const k = 1 + n * amount
      pos.setX(i, p.x * k)
      pos.setZ(i, p.z * k)
    }
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
  return fixNormals(geo)
}

/**
 * Poles of lathes and parametric surfaces collapse to a point and get zero normals,
 * which turn into NaN pixels in the shader (and bloom smears them over the frame).
 */
export function fixNormals(geo: THREE.BufferGeometry) {
  const nor = geo.getAttribute('normal') as THREE.BufferAttribute
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  geo.computeBoundingBox()
  const cy = geo.boundingBox ? (geo.boundingBox.min.y + geo.boundingBox.max.y) / 2 : 0
  for (let i = 0; i < nor.count; i++) {
    const x = nor.getX(i)
    const y = nor.getY(i)
    const z = nor.getZ(i)
    const len = Math.hypot(x, y, z)
    if (!(len > 1e-6)) nor.setXYZ(i, 0, pos.getY(i) >= cy ? 1 : -1, 0)
  }
  nor.needsUpdate = true
  return geo
}

/**
 * Merges the closed parts and stores an "opened" pose as morph target 0,
 * so a single mesh (and a single transmission material) can split apart.
 */
export function openable(parts: THREE.BufferGeometry[], pose: (part: THREE.BufferGeometry, index: number) => void) {
  const flat = parts.map((p) => (p.index ? p.toNonIndexed() : p.clone()))
  const opened = flat.map((p, i) => {
    const c = p.clone()
    pose(c, i)
    return c
  })
  const base = mergeGeometries(flat, false)
  const target = mergeGeometries(opened, false)
  if (!base || !target) throw new Error('openable: merge failed')
  base.morphAttributes.position = [target.getAttribute('position')]
  base.morphAttributes.normal = [target.getAttribute('normal')]
  base.computeBoundingSphere()
  if (base.boundingSphere) base.boundingSphere.radius *= 1.6
  return base
}

/** Rotate a part about an axis through a pivot. */
export function hinge(part: THREE.BufferGeometry, pivot: THREE.Vector3, axis: THREE.Vector3, angle: number, shift = new THREE.Vector3()) {
  part.translate(-pivot.x, -pivot.y, -pivot.z)
  part.applyMatrix4(new THREE.Matrix4().makeRotationAxis(axis.clone().normalize(), angle))
  part.translate(pivot.x + shift.x, pivot.y + shift.y, pivot.z + shift.z)
}
