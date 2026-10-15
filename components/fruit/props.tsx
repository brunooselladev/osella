'use client'

// Set dressing on and under the benches: the specimens' soil trays, seedling flats, crates,
// watering cans, a coiled hose and plant labels. Static; each group is one merged mesh.

// ===== External modules =====
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

// ===== Internal modules =====
import { Builder } from './build'
import { SPECIMENS } from './camera-path'
import { bumpTex, mossTex, rng, soilTex, woodTex } from './textures'
import { vec3 } from './vec'
import { BENCH_END, BENCH_IN, BENCH_OUT, BENCH_START, BENCH_TOP, HALF } from './world'

// ===== Types =====

type Flat = { x: number; z: number; rot: number }

// ===== Constants =====

/** Each specimen sits in its own galvanised tray of soil; COOPEF gets a long trough. */
export const TRAYS = SPECIMENS.map((specimen) => ({
  id: specimen.id,
  x: specimen.position[0],
  z: specimen.id === 'coopef-gym' ? specimen.position[2] + 0.02 : specimen.position[2],
  w: specimen.id === 'coopef-gym' ? 1.22 : 0.92,
  d: specimen.id === 'coopef-gym' ? 0.42 : 0.92,
}))

/** Soil surface inside a tray (m); the specimens stand on it. */
export const TRAY_TOP = BENCH_TOP + 0.075

/** Wood texture tile (m) for every crate and flat. */
const WOOD_TILE = 0.6

// ===== Helpers =====

/** True when nothing on that bench side sits within `pad` metres of z. */
const clearOfSpecimens = (side: number, z: number, pad = 0.95) =>
  SPECIMENS.every((specimen) => Math.sign(specimen.position[0]) !== side || Math.abs(specimen.position[2] - z) > pad)

/** One seedling: a stem and two leaves, scaled and tinted per instance. */
const seedlingGeometry = () => {
  const builder = new Builder(true)
  builder.add(new THREE.CylinderGeometry(0.0025, 0.003, 0.05, 4), [0, 0.025, 0], { tint: 0.8 })
  const leaf = new THREE.CircleGeometry(0.013, 8)
  leaf.scale(1.8, 0.9, 1)
  for (const side of [-1, 1]) builder.add(leaf.clone(), [side * 0.02, 0.052, 0], { rot: [-Math.PI / 2 + 0.35, 0, side * 0.4], tint: 1 })
  leaf.dispose()
  return builder.merge()
}

// ===== Component: Trays =====

const Trays = () => {
  // --- Refs & state ---
  const metal = useMemo(() => {
    const builder = new Builder()
    for (const tray of TRAYS) {
      const height = 0.08
      const y = BENCH_TOP + height / 2
      builder.box(tray.w, 0.008, tray.d, [tray.x, BENCH_TOP + 0.004, tray.z]) // base
      builder.box(0.012, height, tray.d, [tray.x - tray.w / 2, y, tray.z]) // sides
      builder.box(0.012, height, tray.d, [tray.x + tray.w / 2, y, tray.z])
      builder.box(tray.w, height, 0.012, [tray.x, y, tray.z - tray.d / 2])
      builder.box(tray.w, height, 0.012, [tray.x, y, tray.z + tray.d / 2])
      // rolled lip
      for (const sx of [-1, 1]) builder.add(new THREE.CylinderGeometry(0.009, 0.009, tray.d, 6), [tray.x + (sx * tray.w) / 2, BENCH_TOP + height, tray.z], { rot: [Math.PI / 2, 0, 0] })
      for (const sz of [-1, 1]) builder.add(new THREE.CylinderGeometry(0.009, 0.009, tray.w, 6), [tray.x, BENCH_TOP + height, tray.z + (sz * tray.d) / 2], { rot: [0, 0, Math.PI / 2] })
    }
    return builder.merge()
  }, [])
  // soil surface, slightly lumpy
  const soil = useMemo(() => {
    const builder = new Builder()
    for (const tray of TRAYS) {
      const plane = new THREE.PlaneGeometry(tray.w - 0.02, tray.d - 0.02, 16, 16)
      const random = rng(Math.round(tray.z * 100))
      const positions = plane.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < positions.count; i++) positions.setZ(i, (random() - 0.5) * 0.012 + 0.008 * Math.cos(positions.getX(i) * 9) * Math.sin(positions.getY(i) * 7))
      plane.computeVertexNormals()
      builder.add(plane, [tray.x, TRAY_TOP - 0.01, tray.z], { rot: [-Math.PI / 2, 0, 0] })
    }
    return builder.merge()
  }, [])
  const zinc = bumpTex(44, 32)
  const moss = useMemo(() => {
    const texture = mossTex().clone()
    texture.repeat.set(11, 11)
    texture.needsUpdate = true
    return texture
  }, [])

  // --- Render ---
  return (
    <group>
      <mesh geometry={metal} castShadow receiveShadow>
        <meshStandardMaterial color="#a7a69c" metalness={0.75} roughness={0.42} bumpMap={zinc} bumpScale={0.4} />
      </mesh>
      <mesh geometry={soil} receiveShadow>
        <meshStandardMaterial map={soilTex()} roughness={1} />
      </mesh>
      {/* moss patches on the soil */}
      <mesh geometry={soil} position={[0, 0.003, 0]}>
        <meshStandardMaterial map={moss} transparent alphaTest={0.12} roughness={1} />
      </mesh>
    </group>
  )
}

// ===== Component: Flats =====

/** Wooden seedling flats along the benches, each with a 4 × 6 grid of sprouts (some missing). */
const Flats = () => {
  // --- Refs & state ---
  const flats = useMemo(() => {
    const random = rng(303)
    const out: Flat[] = []
    for (const side of [-1, 1]) {
      let z = BENCH_START + 0.35
      while (z < BENCH_END - 0.4) {
        if (clearOfSpecimens(side, z) && z > 1.4) {
          const columns = random() < 0.5 ? 2 : 1
          for (let column = 0; column < columns; column++) {
            if (random() < 0.55) out.push({ x: side * (BENCH_IN + 0.32 + column * 0.42 + random() * 0.06), z: z + (random() - 0.5) * 0.04, rot: (random() - 0.5) * 0.06 })
          }
        }
        z += 0.75 + random() * 0.7
      }
    }
    return out
  }, [])
  const boxes = useMemo(() => {
    const builder = new Builder()
    for (const flat of flats) {
      const box = new Builder()
      box.box(0.36, 0.008, 0.54, [0, 0.004, 0], { tile: WOOD_TILE, grain: true }) // bottom
      box.box(0.012, 0.06, 0.54, [-0.174, 0.03, 0], { tile: WOOD_TILE, grain: true }) // sides
      box.box(0.012, 0.06, 0.54, [0.174, 0.03, 0], { tile: WOOD_TILE, grain: true })
      box.box(0.36, 0.06, 0.012, [0, 0.03, -0.264], { tile: WOOD_TILE, grain: true })
      box.box(0.36, 0.06, 0.012, [0, 0.03, 0.264], { tile: WOOD_TILE, grain: true })
      builder.add(box.merge(), [flat.x, BENCH_TOP, flat.z], { rot: [0, flat.rot, 0] })
    }
    return builder.merge()
  }, [flats])
  const soil = useMemo(() => {
    const builder = new Builder()
    for (const flat of flats) builder.add(new THREE.PlaneGeometry(0.34, 0.52), [flat.x, BENCH_TOP + 0.05, flat.z], { rot: [-Math.PI / 2, 0, flat.rot] })
    return builder.merge()
  }, [flats])
  const seedling = useMemo(seedlingGeometry, [])
  const sproutsRef = useRef<THREE.InstancedMesh>(null)
  const sproutCount = flats.length * 24

  // --- Effects ---
  // Places the sprouts: a 4 × 6 grid per flat, jittered, every fifth flat mostly empty.
  useLayoutEffect(() => {
    const mesh = sproutsRef.current
    if (!mesh) return
    const random = rng(17)
    const matrix = new THREE.Matrix4()
    const quaternion = new THREE.Quaternion()
    const euler = new THREE.Euler()
    const color = new THREE.Color()
    let index = 0
    flats.forEach((flat, flatIndex) => {
      const sparse = flatIndex % 5 === 3
      for (let row = 0; row < 4; row++) {
        for (let column = 0; column < 6; column++) {
          const missing = sparse ? random() < 0.6 : random() < 0.12
          const scale = missing ? 0.0001 : 0.55 + random() * 0.5 + (flatIndex % 3) * 0.2
          const localX = -0.12 + row * 0.08 + (random() - 0.5) * 0.02
          const localZ = -0.2 + column * 0.08 + (random() - 0.5) * 0.02
          const cos = Math.cos(flat.rot)
          const sin = Math.sin(flat.rot)
          matrix.compose(
            vec3(flat.x + localX * cos + localZ * sin, BENCH_TOP + 0.05, flat.z - localX * sin + localZ * cos),
            quaternion.setFromEuler(euler.set((random() - 0.5) * 0.3, random() * 6.28, (random() - 0.5) * 0.3)),
            vec3(scale, scale, scale),
          )
          mesh.setMatrixAt(index, matrix)
          mesh.setColorAt(index, color.setHSL(0.21 + random() * 0.06, 0.32 + random() * 0.18, 0.27 + random() * 0.1))
          index++
        }
      }
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [flats])

  // --- Render ---
  return (
    <group>
      <mesh geometry={boxes} castShadow receiveShadow>
        <meshStandardMaterial map={woodTex('crate')} roughness={0.85} color="#d8c3a0" />
      </mesh>
      <mesh geometry={soil} receiveShadow>
        <meshStandardMaterial map={soilTex()} roughness={1} />
      </mesh>
      {/* no castShadow: hundreds of 5 cm sprouts would cost a shadow pass for shadows nobody sees */}
      <instancedMesh ref={sproutsRef} args={[seedling, undefined, sproutCount]}>
        <meshStandardMaterial vertexColors roughness={0.6} side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  )
}

// ===== Component: WateringCan =====

const WateringCan = ({ position, rot = 0 }: { position: [number, number, number]; rot?: number }) => {
  // --- Refs & state ---
  const geometry = useMemo(() => {
    const builder = new Builder()
    // body as a lathe profile (x = radius, y = height, m)
    const bodyProfile = [
      [0.0, 0.0],
      [0.11, 0.0],
      [0.125, 0.02],
      [0.13, 0.2],
      [0.12, 0.25],
      [0.05, 0.27],
      [0.0, 0.27],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    builder.add(new THREE.LatheGeometry(bodyProfile, 28), [0, 0, 0], { rot: [0, 0, 0] })
    const spout = new THREE.CatmullRomCurve3([vec3(0.11, 0.05, 0), vec3(0.22, 0.16, 0), vec3(0.33, 0.3, 0)])
    builder.add(new THREE.TubeGeometry(spout, 12, 0.014, 8), [0, 0, 0])
    builder.add(new THREE.CylinderGeometry(0.035, 0.016, 0.04, 14), [0.345, 0.315, 0], { rot: [0, 0, -0.75] }) // rose
    const handle = new THREE.TorusGeometry(0.11, 0.011, 8, 20, Math.PI)
    builder.add(handle, [-0.02, 0.26, 0], { rot: [0, 0, 0.1] })
    return builder.merge()
  }, [])

  // --- Render ---
  return (
    <mesh geometry={geometry} position={position} rotation-y={rot} castShadow receiveShadow>
      <meshStandardMaterial color="#9fa29a" metalness={0.8} roughness={0.38} bumpMap={bumpTex(44, 32)} bumpScale={0.6} />
    </mesh>
  )
}

// ===== Component: Crates =====

/** Slatted crates on the lower shelves. */
const Crates = () => {
  // --- Refs & state ---
  const geometry = useMemo(() => {
    const builder = new Builder(true)
    const random = rng(88)
    const spots: [number, number][] = [
      [-1, 6.4],
      [1, 3.2],
      [-1, 9.6],
      [1, 11.7],
      [-1, 16.9],
      [1, 13.3],
    ]
    for (const [side, z] of spots) {
      const x = side * (BENCH_IN + 0.5)
      const bottom = 0.36 // shelf height (m)
      const w = 0.5
      const d = 0.36
      const h = 0.26
      const tint = 0.75 + random() * 0.3
      for (let slat = 0; slat < 3; slat++) {
        const y = bottom + 0.04 + slat * 0.09
        builder.box(w, 0.06, 0.012, [x, y, z - d / 2], { tile: WOOD_TILE, grain: true, tint })
        builder.box(w, 0.06, 0.012, [x, y, z + d / 2], { tile: WOOD_TILE, grain: true, tint })
        builder.box(0.012, 0.06, d, [x - w / 2, y, z], { tile: WOOD_TILE, grain: true, tint })
        builder.box(0.012, 0.06, d, [x + w / 2, y, z], { tile: WOOD_TILE, grain: true, tint })
      }
      builder.box(w, 0.012, d, [x, bottom + 0.006, z], { tile: WOOD_TILE, grain: true, tint: tint * 0.9 }) // base
      for (const cx of [-1, 1]) for (const cz of [-1, 1]) builder.box(0.03, h, 0.03, [x + (cx * (w - 0.03)) / 2, bottom + h / 2, z + (cz * (d - 0.03)) / 2], { tile: WOOD_TILE, grain: true, tint: tint * 0.85 }) // corner posts
    }
    return builder.merge()
  }, [])

  // --- Render ---
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial map={woodTex('crate')} vertexColors roughness={0.88} />
    </mesh>
  )
}

// ===== Component: Hose =====

/** A hose coiled on a hook on the left wall, its end trailing to the floor. */
const Hose = () => {
  // --- Refs & state ---
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = []
    for (let i = 0; i <= 260; i++) {
      const angle = (i / 260) * Math.PI * 2 * 4.2 // 4.2 turns
      const radius = 0.2 + Math.sin(i * 0.31) * 0.006
      points.push(vec3(Math.cos(angle) * 0.012 * (i / 60), Math.sin(angle) * radius - radius, Math.cos(angle) * radius))
    }
    points.push(vec3(0.05, -0.55, 0.05), vec3(0.04, -1.0, 0.12), vec3(0.12, -1.42, 0.3))
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 420, 0.012, 8)
  }, [])

  // --- Render ---
  return (
    <group position={[-(HALF - 0.12), 1.62, 10]}>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial color="#3f5a34" roughness={0.55} />
      </mesh>
      {/* the hook */}
      <mesh position={[0.02, 0.02, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.01, 0.01, 0.1, 6]} />
        <meshStandardMaterial color="#2f322a" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  )
}

// ===== Component: Labels =====

/** A zinc plant label stuck in each tray. */
const Labels = () => {
  // --- Refs & state ---
  const geometry = useMemo(() => {
    const builder = new Builder()
    const random = rng(12)
    for (const tray of TRAYS) {
      const side = Math.sign(tray.x)
      const x = tray.x - side * (tray.w / 2 - 0.06)
      const z = tray.z + tray.d / 2 - 0.08
      builder.box(0.004, 0.3, 0.004, [x, TRAY_TOP + 0.13, z], { rot: [0.08, 0, side * 0.12] }) // stake
      builder.box(0.06, 0.1, 0.004, [x + side * 0.012, TRAY_TOP + 0.3, z + 0.02], { rot: [0.08, random() * 0.4 - 0.2, side * 0.12] }) // tag
    }
    return builder.merge()
  }, [])

  // --- Render ---
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#cfccc0" metalness={0.6} roughness={0.45} />
    </mesh>
  )
}

// ===== Component: Props =====

export const Props = () => (
  <group>
    <Trays />
    <Flats />
    <Crates />
    <Labels />
    <WateringCan position={[-1.24, 0, 6.2]} rot={2.2} />
    <WateringCan position={[BENCH_OUT - 0.35, BENCH_TOP, 17.6]} rot={-0.6} />
    <Hose />
  </group>
)
