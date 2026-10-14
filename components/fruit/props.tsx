'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Builder } from './build'
import { SPECIMENS } from './camera-path'
import { bumpTex, mossTex, rng, soilTex, woodTex } from './textures'
import { BENCH_END, BENCH_IN, BENCH_OUT, BENCH_START, BENCH_TOP, HALF } from './world'

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

// Each specimen sits in its own galvanised tray of soil; COOPEF gets a long trough.
export const TRAYS = SPECIMENS.map((s) => ({
  id: s.id,
  x: s.position[0],
  z: s.id === 'coopef-gym' ? s.position[2] + 0.02 : s.position[2],
  w: s.id === 'coopef-gym' ? 1.22 : 0.92,
  d: s.id === 'coopef-gym' ? 0.42 : 0.92,
}))

export const TRAY_TOP = BENCH_TOP + 0.075

function clearOfSpecimens(side: number, z: number, pad = 0.95) {
  return SPECIMENS.every((s) => Math.sign(s.position[0]) !== side || Math.abs(s.position[2] - z) > pad)
}

function Trays() {
  const metal = useMemo(() => {
    const b = new Builder()
    for (const t of TRAYS) {
      const h = 0.08
      const y = BENCH_TOP + h / 2
      b.box(t.w, 0.008, t.d, [t.x, BENCH_TOP + 0.004, t.z])
      b.box(0.012, h, t.d, [t.x - t.w / 2, y, t.z])
      b.box(0.012, h, t.d, [t.x + t.w / 2, y, t.z])
      b.box(t.w, h, 0.012, [t.x, y, t.z - t.d / 2])
      b.box(t.w, h, 0.012, [t.x, y, t.z + t.d / 2])
      // rolled lip
      for (const sx of [-1, 1]) b.add(new THREE.CylinderGeometry(0.009, 0.009, t.d, 6), [t.x + (sx * t.w) / 2, BENCH_TOP + h, t.z], { rot: [Math.PI / 2, 0, 0] })
      for (const sz of [-1, 1]) b.add(new THREE.CylinderGeometry(0.009, 0.009, t.w, 6), [t.x, BENCH_TOP + h, t.z + (sz * t.d) / 2], { rot: [0, 0, Math.PI / 2] })
    }
    return b.merge()
  }, [])
  const soil = useMemo(() => {
    const b = new Builder()
    for (const t of TRAYS) {
      const g = new THREE.PlaneGeometry(t.w - 0.02, t.d - 0.02, 16, 16)
      const r = rng(Math.round(t.z * 100))
      const pos = g.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < pos.count; i++) pos.setZ(i, (r() - 0.5) * 0.012 + 0.008 * Math.cos(pos.getX(i) * 9) * Math.sin(pos.getY(i) * 7))
      g.computeVertexNormals()
      b.add(g, [t.x, TRAY_TOP - 0.01, t.z], { rot: [-Math.PI / 2, 0, 0] })
    }
    return b.merge()
  }, [])
  const zinc = bumpTex(44, 32)
  const moss = useMemo(() => {
    const t = mossTex().clone()
    t.repeat.set(11, 11)
    t.needsUpdate = true
    return t
  }, [])
  return (
    <group>
      <mesh geometry={metal} castShadow receiveShadow>
        <meshStandardMaterial color="#a7a69c" metalness={0.75} roughness={0.42} bumpMap={zinc} bumpScale={0.4} />
      </mesh>
      <mesh geometry={soil} receiveShadow>
        <meshStandardMaterial map={soilTex()} roughness={1} />
      </mesh>
      <mesh geometry={soil} position={[0, 0.003, 0]}>
        <meshStandardMaterial map={moss} transparent alphaTest={0.12} roughness={1} />
      </mesh>
    </group>
  )
}

/* ---------------------------------------------------------------- seedling flats */

function seedlingGeometry() {
  const b = new Builder(true)
  b.add(new THREE.CylinderGeometry(0.0025, 0.003, 0.05, 4), [0, 0.025, 0], { tint: 0.8 })
  const leaf = new THREE.CircleGeometry(0.013, 8)
  leaf.scale(1.8, 0.9, 1)
  for (const s of [-1, 1]) b.add(leaf.clone(), [s * 0.02, 0.052, 0], { rot: [-Math.PI / 2 + 0.35, 0, s * 0.4], tint: 1 })
  leaf.dispose()
  return b.merge()
}

function Flats() {
  const flats = useMemo(() => {
    const r = rng(303)
    const out: { x: number; z: number; rot: number }[] = []
    for (const side of [-1, 1]) {
      let z = BENCH_START + 0.35
      while (z < BENCH_END - 0.4) {
        if (clearOfSpecimens(side, z) && z > 1.4) {
          const cols = r() < 0.5 ? 2 : 1
          for (let c = 0; c < cols; c++) {
            if (r() < 0.55) out.push({ x: side * (BENCH_IN + 0.32 + c * 0.42 + r() * 0.06), z: z + (r() - 0.5) * 0.04, rot: (r() - 0.5) * 0.06 })
          }
        }
        z += 0.75 + r() * 0.7
      }
    }
    return out
  }, [])
  const box = useMemo(() => {
    const b = new Builder()
    for (const f of flats) {
      const g = new Builder()
      g.box(0.36, 0.008, 0.54, [0, 0.004, 0], { tile: 0.6, grain: true })
      g.box(0.012, 0.06, 0.54, [-0.174, 0.03, 0], { tile: 0.6, grain: true })
      g.box(0.012, 0.06, 0.54, [0.174, 0.03, 0], { tile: 0.6, grain: true })
      g.box(0.36, 0.06, 0.012, [0, 0.03, -0.264], { tile: 0.6, grain: true })
      g.box(0.36, 0.06, 0.012, [0, 0.03, 0.264], { tile: 0.6, grain: true })
      b.add(g.merge(), [f.x, BENCH_TOP, f.z], { rot: [0, f.rot, 0] })
    }
    return b.merge()
  }, [flats])
  const soil = useMemo(() => {
    const b = new Builder()
    for (const f of flats) b.add(new THREE.PlaneGeometry(0.34, 0.52), [f.x, BENCH_TOP + 0.05, f.z], { rot: [-Math.PI / 2, 0, f.rot] })
    return b.merge()
  }, [flats])
  const seedGeo = useMemo(seedlingGeometry, [])
  const sprouts = useRef<THREE.InstancedMesh>(null)
  const count = flats.length * 24
  useLayoutEffect(() => {
    const mesh = sprouts.current
    if (!mesh) return
    const r = rng(17)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const c = new THREE.Color()
    let i = 0
    flats.forEach((f, fi) => {
      const sparse = fi % 5 === 3
      for (let a = 0; a < 4; a++) {
        for (let b = 0; b < 6; b++) {
          const missing = sparse ? r() < 0.6 : r() < 0.12
          const s = missing ? 0.0001 : 0.55 + r() * 0.5 + (fi % 3) * 0.2
          const lx = -0.12 + a * 0.08 + (r() - 0.5) * 0.02
          const lz = -0.2 + b * 0.08 + (r() - 0.5) * 0.02
          const cos = Math.cos(f.rot)
          const sin = Math.sin(f.rot)
          m.compose(V(f.x + lx * cos + lz * sin, BENCH_TOP + 0.05, f.z - lx * sin + lz * cos), q.setFromEuler(e.set((r() - 0.5) * 0.3, r() * 6.28, (r() - 0.5) * 0.3)), V(s, s, s))
          mesh.setMatrixAt(i, m)
          mesh.setColorAt(i, c.setHSL(0.21 + r() * 0.06, 0.32 + r() * 0.18, 0.27 + r() * 0.1))
          i++
        }
      }
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [flats])
  return (
    <group>
      <mesh geometry={box} castShadow receiveShadow>
        <meshStandardMaterial map={woodTex('crate')} roughness={0.85} color="#d8c3a0" />
      </mesh>
      <mesh geometry={soil} receiveShadow>
        <meshStandardMaterial map={soilTex()} roughness={1} />
      </mesh>
      <instancedMesh ref={sprouts} args={[seedGeo, undefined, count]} castShadow>
        <meshStandardMaterial vertexColors roughness={0.6} side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  )
}

/* ---------------------------------------------------------------- clutter */

function WateringCan({ position, rot = 0 }: { position: [number, number, number]; rot?: number }) {
  const geo = useMemo(() => {
    const b = new Builder()
    const body = [
      [0.0, 0.0],
      [0.11, 0.0],
      [0.125, 0.02],
      [0.13, 0.2],
      [0.12, 0.25],
      [0.05, 0.27],
      [0.0, 0.27],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    b.add(new THREE.LatheGeometry(body, 28), [0, 0, 0], { rot: [0, 0, 0] })
    const spout = new THREE.CatmullRomCurve3([V(0.11, 0.05, 0), V(0.22, 0.16, 0), V(0.33, 0.3, 0)])
    b.add(new THREE.TubeGeometry(spout, 12, 0.014, 8), [0, 0, 0])
    b.add(new THREE.CylinderGeometry(0.035, 0.016, 0.04, 14), [0.345, 0.315, 0], { rot: [0, 0, -0.75] })
    const handle = new THREE.TorusGeometry(0.11, 0.011, 8, 20, Math.PI)
    b.add(handle, [-0.02, 0.26, 0], { rot: [0, 0, 0.1] })
    return b.merge()
  }, [])
  return (
    <mesh geometry={geo} position={position} rotation-y={rot} castShadow receiveShadow>
      <meshStandardMaterial color="#9fa29a" metalness={0.8} roughness={0.38} bumpMap={bumpTex(44, 32)} bumpScale={0.6} />
    </mesh>
  )
}

function Crates() {
  const geo = useMemo(() => {
    const b = new Builder(true)
    const r = rng(88)
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
      const y0 = 0.36
      const w = 0.5
      const d = 0.36
      const h = 0.26
      const t = 0.75 + r() * 0.3
      for (let k = 0; k < 3; k++) {
        const y = y0 + 0.04 + k * 0.09
        b.box(w, 0.06, 0.012, [x, y, z - d / 2], { tile: 0.6, grain: true, tint: t })
        b.box(w, 0.06, 0.012, [x, y, z + d / 2], { tile: 0.6, grain: true, tint: t })
        b.box(0.012, 0.06, d, [x - w / 2, y, z], { tile: 0.6, grain: true, tint: t })
        b.box(0.012, 0.06, d, [x + w / 2, y, z], { tile: 0.6, grain: true, tint: t })
      }
      b.box(w, 0.012, d, [x, y0 + 0.006, z], { tile: 0.6, grain: true, tint: t * 0.9 })
      for (const cx of [-1, 1]) for (const cz of [-1, 1]) b.box(0.03, h, 0.03, [x + (cx * (w - 0.03)) / 2, y0 + h / 2, z + (cz * (d - 0.03)) / 2], { tile: 0.6, grain: true, tint: t * 0.85 })
    }
    return b.merge()
  }, [])
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial map={woodTex('crate')} vertexColors roughness={0.88} />
    </mesh>
  )
}

function Hose() {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 260; i++) {
      const a = (i / 260) * Math.PI * 2 * 4.2
      const rad = 0.2 + Math.sin(i * 0.31) * 0.006
      pts.push(V(Math.cos(a) * 0.012 * (i / 60), Math.sin(a) * rad - rad, Math.cos(a) * rad))
    }
    pts.push(V(0.05, -0.55, 0.05), V(0.04, -1.0, 0.12), V(0.12, -1.42, 0.3))
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 420, 0.012, 8)
  }, [])
  return (
    <group position={[-(HALF - 0.12), 1.62, 10]}>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color="#3f5a34" roughness={0.55} />
      </mesh>
      <mesh position={[0.02, 0.02, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.01, 0.01, 0.1, 6]} />
        <meshStandardMaterial color="#2f322a" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  )
}

function Labels() {
  const geo = useMemo(() => {
    const b = new Builder()
    const r = rng(12)
    for (const t of TRAYS) {
      const s = Math.sign(t.x)
      const x = t.x - s * (t.w / 2 - 0.06)
      const z = t.z + t.d / 2 - 0.08
      b.box(0.004, 0.3, 0.004, [x, TRAY_TOP + 0.13, z], { rot: [0.08, 0, s * 0.12] })
      b.box(0.06, 0.1, 0.004, [x + s * 0.012, TRAY_TOP + 0.3, z + 0.02], { rot: [0.08, r() * 0.4 - 0.2, s * 0.12] })
    }
    return b.merge()
  }, [])
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color="#cfccc0" metalness={0.6} roughness={0.45} />
    </mesh>
  )
}

export function Props() {
  return (
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
}

