'use client'

// COOPEF Gym: a vine climbing a diamond trellis. It grows as you approach; rose flowers open along
// it. Built in the YZ plane at x = +BACK with the vine in front, then turned to stand across the
// bench, facing the walk. Leaves, petals and flower centres are instanced.

// ===== External modules =====
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ===== Internal modules =====
import { Builder } from '../build'
import { TRAY_TOP } from '../props'
import { leafTex, rng, woodTex } from '../textures'
import type { Vec3 } from '../vec'
import { bladeGeometry, profiles, Rim, taperTube, useSpecimen } from './shared'

// ===== Types =====

/** A leaf or flower on a vine curve: which curve, how far along it (0..1), pose and size. */
type Placement = { curve: number; t: number; rotation: THREE.Euler; scale: number }

// ===== Constants =====

/** Trellis width and height (m). */
const WIDTH = 1.18
const HEIGHT = 1.78
/** Trellis plane offset from the specimen's origin, x (m). */
const BACK = 0.1
/** Wood texture tile (m). */
const WOOD_TILE = 0.6
const FLOWER_COUNT = 30

// ===== Helpers =====

/** The frame and a diamond lattice, clipped to the panel. */
const trellisGeometry = () => {
  const builder = new Builder(true)
  const slat = 0.028
  const thickness = 0.015
  // frame
  builder.box(thickness * 2, HEIGHT, slat * 1.4, [BACK, HEIGHT / 2, -WIDTH / 2], { tile: WOOD_TILE, grain: true, tint: 0.8 })
  builder.box(thickness * 2, HEIGHT, slat * 1.4, [BACK, HEIGHT / 2, WIDTH / 2], { tile: WOOD_TILE, grain: true, tint: 0.8 })
  builder.box(thickness * 2, slat * 1.4, WIDTH, [BACK, HEIGHT, 0], { tile: WOOD_TILE, grain: true, tint: 0.8 })
  builder.box(thickness * 2, slat * 1.4, WIDTH, [BACK, 0.04, 0], { tile: WOOD_TILE, grain: true, tint: 0.8 })
  // diamond lattice: two families of diagonals, clipped to the panel
  const step = 0.24
  for (const direction of [1, -1]) {
    for (let c = -HEIGHT - WIDTH; c < HEIGHT + WIDTH; c += step) {
      // line: z = direction * (y - c)  → clip to |z| <= WIDTH/2, 0 <= y <= HEIGHT
      const ys = [c - WIDTH / 2 / direction, c + WIDTH / 2 / direction].sort((p, q) => p - q)
      const y0 = Math.max(0.04, ys[0])
      const y1 = Math.min(HEIGHT, ys[1])
      if (y1 - y0 < 0.05) continue
      const from = new THREE.Vector3(BACK + (direction > 0 ? 0.008 : -0.008), y0, direction * (y0 - c))
      const to = new THREE.Vector3(BACK + (direction > 0 ? 0.008 : -0.008), y1, direction * (y1 - c))
      builder.beam(from, to, slat, thickness, { tile: WOOD_TILE, grain: true, tint: 0.85 })
    }
  }
  return builder.merge()
}

/** The main stem up the trellis and three side branches, as curves. */
const vineCurves = () => {
  const random = rng(808)
  const main: THREE.Vector3[] = []
  for (let i = 0; i <= 12; i++) {
    const y = 0.02 + (i / 12) * (HEIGHT - 0.12)
    main.push(new THREE.Vector3(BACK - 0.05 - random() * 0.04, y, Math.sin(i * 0.95) * 0.24 + (random() - 0.5) * 0.08))
  }
  const branch = (from: number, direction: number) => {
    const start = main[from]
    const points = [start.clone()]
    for (let i = 1; i <= 6; i++) points.push(new THREE.Vector3(BACK - 0.05 - random() * 0.03, start.y + i * 0.12, start.z + direction * i * 0.1 + Math.sin(i) * 0.05))
    return points
  }
  return [main, branch(3, 1), branch(5, -1), branch(8, 1)].map((points) => new THREE.CatmullRomCurve3(points))
}

// ===== Component: Coopef =====

export const Coopef = ({ position }: { position: Vec3 }) => {
  // --- Refs & state ---
  const { group, state } = useSpecimen('coopef-gym', position, { spin: false, lean: 0.35 })
  const leafMeshRef = useRef<THREE.InstancedMesh>(null)
  const petalMeshRef = useRef<THREE.InstancedMesh>(null)
  const centerMeshRef = useRef<THREE.InstancedMesh>(null)
  /** The last growth/bloom key applied to the instances; see the frame below. */
  const appliedKey = useRef(-1)
  const trellis = useMemo(trellisGeometry, [])
  const curves = useMemo(vineCurves, [])
  const vines = useMemo(() => curves.map((curve, i) => taperTube(new THREE.TubeGeometry(curve, 90, i === 0 ? 0.017 : 0.01, 6), 1, 0.4)), [curves])
  const leafGeometry = useMemo(() => bladeGeometry(0.17, 0.16, profiles.heart, 0.22, 0.18, 10, 6), [])
  // one flower = five petals merged, so each flower is one instance
  const flowerGeometry = useMemo(() => {
    const builder = new Builder()
    for (let i = 0; i < 5; i++) {
      const petal = bladeGeometry(0.05, 0.045, profiles.petal, 0.4, 0.1, 6, 3)
      petal.rotateX(1.1)
      petal.rotateY((i / 5) * Math.PI * 2)
      builder.add(petal, [0, 0, 0])
    }
    return builder.merge()
  }, [])
  const centerGeometry = useMemo(() => new THREE.SphereGeometry(0.012, 8, 6), [])

  // leaf and flower placements along the curves
  const leaves = useMemo(() => {
    const random = rng(11)
    const out: Placement[] = []
    curves.forEach((_, curveIndex) => {
      const count = curveIndex === 0 ? 56 : 16
      for (let i = 0; i < count; i++) {
        const t = 0.06 + (i / count) * 0.92 + random() * 0.02
        out.push({ curve: curveIndex, t, rotation: new THREE.Euler(-0.3 + random() * 0.6, -Math.PI / 2 + (random() - 0.5) * 1.6, (random() - 0.5) * 2.4), scale: 0.5 + random() * 0.5 })
      }
    })
    return out
  }, [curves])
  const flowers = useMemo(() => {
    const random = rng(29)
    return Array.from({ length: FLOWER_COUNT }, (_, i): Placement => ({ curve: i % 4, t: 0.25 + random() * 0.72, rotation: new THREE.Euler((random() - 0.5) * 0.5, (random() - 0.5) * 0.6, Math.PI / 2 + (random() - 0.5) * 0.9), scale: 1 }))
  }, [])
  const scratch = useMemo(() => ({ matrix: new THREE.Matrix4(), quaternion: new THREE.Quaternion(), point: new THREE.Vector3(), scale: new THREE.Vector3(), color: new THREE.Color() }), [])

  // --- Effects ---
  // Leaf colours vary a little per instance.
  useLayoutEffect(() => {
    const mesh = leafMeshRef.current
    if (!mesh) return
    const random = rng(5)
    leaves.forEach((_, i) => mesh.setColorAt(i, scratch.color.setHSL(0.2 + random() * 0.05, 0.4 + random() * 0.2, 0.42 + random() * 0.16)))
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [leaves, scratch])

  // --- Frame ---
  useFrame(() => {
    const ripen = state.current.ripen
    const wide = state.current.open
    const growth = THREE.MathUtils.clamp(0.62 + ripen * 0.19 + wide, 0, 1)
    const bloom = THREE.MathUtils.smoothstep(ripen, 0.4, 1.9) * (1 + wide * 0.35)
    // Re-posing ~130 instances every frame is wasteful when nothing changed, so growth and bloom
    // are quantised into one key and the instances only update when it moves.
    const key = Math.round(growth * 200) + Math.round(bloom * 100) * 1000
    if (key === appliedKey.current) return
    appliedKey.current = key
    // the vines draw only up to the grown fraction of their triangles
    vines.forEach((vine) => vine.setDrawRange(0, Math.floor((vine.index!.count / 3) * growth) * 3))
    const { matrix, quaternion, point, scale } = scratch
    const leafMesh = leafMeshRef.current
    if (leafMesh) {
      leaves.forEach((leaf, i) => {
        const grown = THREE.MathUtils.clamp((growth - leaf.t) * 8, 0, 1)
        curves[leaf.curve].getPointAt(Math.min(leaf.t, 1), point)
        quaternion.setFromEuler(leaf.rotation)
        scale.setScalar(Math.max(1e-4, grown * leaf.scale))
        leafMesh.setMatrixAt(i, matrix.compose(point, quaternion, scale))
      })
      leafMesh.instanceMatrix.needsUpdate = true
    }
    const petalMesh = petalMeshRef.current
    const centerMesh = centerMeshRef.current
    if (petalMesh && centerMesh) {
      flowers.forEach((flower, i) => {
        const grown = THREE.MathUtils.clamp((growth - flower.t) * 8, 0, 1) * (0.35 + bloom * 0.65)
        curves[flower.curve].getPointAt(flower.t, point)
        point.x -= 0.03
        quaternion.setFromEuler(flower.rotation)
        scale.set(1, 0.4 + bloom * 0.6, 1).multiplyScalar(Math.max(1e-4, grown * 1.9))
        petalMesh.setMatrixAt(i, matrix.compose(point, quaternion, scale))
        scale.setScalar(Math.max(1e-4, grown * 1.6))
        centerMesh.setMatrixAt(i, matrix.compose(point, quaternion, scale))
      })
      petalMesh.instanceMatrix.needsUpdate = true
      centerMesh.instanceMatrix.needsUpdate = true
    }
  })

  // --- Derived ---
  const base = TRAY_TOP - position[1]
  const wood = woodTex('crate')
  const veins = leafTex()

  // --- Render ---
  return (
    <group position={position} rotation-y={-Math.PI / 2}>
      <group ref={group}>
        <group position={[0, base, 0]}>
          <mesh geometry={trellis} castShadow receiveShadow>
            <meshStandardMaterial map={wood} vertexColors color="#cdb38c" roughness={0.85} />
          </mesh>
          {vines.map((vine, i) => (
            <mesh key={i} geometry={vine} castShadow>
              <meshStandardMaterial color="#5d6b2c" roughness={0.6} />
            </mesh>
          ))}
          <instancedMesh ref={leafMeshRef} args={[leafGeometry, undefined, leaves.length]} castShadow>
            <meshStandardMaterial map={veins} color="#d6e6a0" roughness={0.55} side={THREE.DoubleSide} emissive="#4a6614" emissiveIntensity={0.22} />
          </instancedMesh>
          <instancedMesh ref={petalMeshRef} args={[flowerGeometry, undefined, flowers.length]}>
            <meshStandardMaterial color="#e0566b" roughness={0.45} side={THREE.DoubleSide} emissive="#e0566b" emissiveIntensity={0.18} />
          </instancedMesh>
          <instancedMesh ref={centerMeshRef} args={[centerGeometry, undefined, flowers.length]}>
            <meshStandardMaterial color="#f7e3a0" emissive="#f4d27a" emissiveIntensity={0.4} />
          </instancedMesh>
          <Rim id="coopef-gym" at={[-0.7, 0.9, 0.2]} />
        </group>
      </group>
    </group>
  )
}
