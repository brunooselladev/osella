'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Builder } from '../build'
import { TRAY_TOP } from '../props'
import { leafTex, rng, woodTex } from '../textures'
import { bladeGeometry, profiles, Rim, taperTube, useSpecimen, type Vec3 } from './shared'

// A vine climbing a diamond trellis. It grows as you approach; rose flowers open along it.
// Built in the YZ plane at x = +BACK with the vine in front; turned to stand across the bench, facing the walk.

const W = 1.18
const H = 1.78
const BACK = 0.1

function trellis() {
  const b = new Builder(true)
  const t = 0.028
  const k = 0.015
  // frame
  b.box(k * 2, H, t * 1.4, [BACK, H / 2, -W / 2], { tile: 0.6, grain: true, tint: 0.8 })
  b.box(k * 2, H, t * 1.4, [BACK, H / 2, W / 2], { tile: 0.6, grain: true, tint: 0.8 })
  b.box(k * 2, t * 1.4, W, [BACK, H, 0], { tile: 0.6, grain: true, tint: 0.8 })
  b.box(k * 2, t * 1.4, W, [BACK, 0.04, 0], { tile: 0.6, grain: true, tint: 0.8 })
  // diamond lattice: two families of diagonals, clipped to the panel
  const step = 0.24
  for (const dir of [1, -1]) {
    for (let c = -H - W; c < H + W; c += step) {
      // line: z = dir * (y - c)  → clip to |z| <= W/2, 0 <= y <= H
      const ys = [c - W / 2 / dir, c + W / 2 / dir].sort((p, q) => p - q)
      const y0 = Math.max(0.04, ys[0])
      const y1 = Math.min(H, ys[1])
      if (y1 - y0 < 0.05) continue
      const a = new THREE.Vector3(BACK + (dir > 0 ? 0.008 : -0.008), y0, dir * (y0 - c))
      const e = new THREE.Vector3(BACK + (dir > 0 ? 0.008 : -0.008), y1, dir * (y1 - c))
      b.beam(a, e, t, k, { tile: 0.6, grain: true, tint: 0.85 })
    }
  }
  return b.merge()
}

function vinePaths() {
  const r = rng(808)
  const main: THREE.Vector3[] = []
  for (let i = 0; i <= 12; i++) {
    const y = 0.02 + (i / 12) * (H - 0.12)
    main.push(new THREE.Vector3(BACK - 0.05 - r() * 0.04, y, Math.sin(i * 0.95) * 0.24 + (r() - 0.5) * 0.08))
  }
  const branch = (from: number, dir: number) => {
    const p0 = main[from]
    const pts = [p0.clone()]
    for (let i = 1; i <= 6; i++) pts.push(new THREE.Vector3(BACK - 0.05 - r() * 0.03, p0.y + i * 0.12, p0.z + dir * i * 0.1 + Math.sin(i) * 0.05))
    return pts
  }
  return [main, branch(3, 1), branch(5, -1), branch(8, 1)].map((pts) => new THREE.CatmullRomCurve3(pts))
}

export function Coopef({ position }: { position: Vec3 }) {
  const { group, state } = useSpecimen('coopef-gym', position, { spin: false, lean: 0.35 })
  const lattice = useMemo(trellis, [])
  const curves = useMemo(vinePaths, [])
  const tubes = useMemo(() => curves.map((c, i) => taperTube(new THREE.TubeGeometry(c, 90, i === 0 ? 0.017 : 0.01, 6), 1, 0.4)), [curves])
  const leafGeo = useMemo(() => bladeGeometry(0.17, 0.16, profiles.heart, 0.22, 0.18, 10, 6), [])
  const petalGeo = useMemo(() => {
    const b = new Builder()
    for (let i = 0; i < 5; i++) {
      const p = bladeGeometry(0.05, 0.045, profiles.petal, 0.4, 0.1, 6, 3)
      p.rotateX(1.1)
      p.rotateY((i / 5) * Math.PI * 2)
      b.add(p, [0, 0, 0])
    }
    return b.merge()
  }, [])
  const centerGeo = useMemo(() => new THREE.SphereGeometry(0.012, 8, 6), [])

  // leaf and flower placements along the curves (t = position along its curve, 0..1)
  const leaves = useMemo(() => {
    const r = rng(11)
    const out: { c: number; t: number; rot: THREE.Euler; s: number }[] = []
    curves.forEach((_, ci) => {
      const n = ci === 0 ? 56 : 16
      for (let i = 0; i < n; i++) {
        const t = 0.06 + (i / n) * 0.92 + r() * 0.02
        out.push({ c: ci, t, rot: new THREE.Euler(-0.3 + r() * 0.6, -Math.PI / 2 + (r() - 0.5) * 1.6, (r() - 0.5) * 2.4), s: 0.5 + r() * 0.5 })
      }
    })
    return out
  }, [curves])
  const flowers = useMemo(() => {
    const r = rng(29)
    return Array.from({ length: 30 }, (_, i) => ({ c: i % 4, t: 0.25 + r() * 0.72, rot: new THREE.Euler((r() - 0.5) * 0.5, (r() - 0.5) * 0.6, Math.PI / 2 + (r() - 0.5) * 0.9) }))
  }, [])

  const leafMesh = useRef<THREE.InstancedMesh>(null)
  const petalMesh = useRef<THREE.InstancedMesh>(null)
  const centerMesh = useRef<THREE.InstancedMesh>(null)
  const grown = useRef(-1)
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3(), c: new THREE.Color() }), [])

  useLayoutEffect(() => {
    const mesh = leafMesh.current
    if (!mesh) return
    const r = rng(5)
    leaves.forEach((_, i) => mesh.setColorAt(i, tmp.c.setHSL(0.2 + r() * 0.05, 0.4 + r() * 0.2, 0.42 + r() * 0.16)))
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [leaves, tmp])

  useFrame(() => {
    const ripen = state.current.ripen
    const wide = state.current.open
    const growth = THREE.MathUtils.clamp(0.62 + ripen * 0.19 + wide, 0, 1)
    const bloom = THREE.MathUtils.smoothstep(ripen, 0.4, 1.9) * (1 + wide * 0.35)
    const key = Math.round(growth * 200) + Math.round(bloom * 100) * 1000
    if (key === grown.current) return
    grown.current = key
    tubes.forEach((t) => t.setDrawRange(0, Math.floor((t.index!.count / 3) * growth) * 3))
    const { m, q, p, s } = tmp
    const lm = leafMesh.current
    if (lm) {
      leaves.forEach((l, i) => {
        const k = THREE.MathUtils.clamp((growth - l.t) * 8, 0, 1)
        curves[l.c].getPointAt(Math.min(l.t, 1), p)
        q.setFromEuler(l.rot)
        s.setScalar(Math.max(1e-4, k * l.s))
        lm.setMatrixAt(i, m.compose(p, q, s))
      })
      lm.instanceMatrix.needsUpdate = true
    }
    const pm = petalMesh.current
    const cm = centerMesh.current
    if (pm && cm) {
      flowers.forEach((f, i) => {
        const k = THREE.MathUtils.clamp((growth - f.t) * 8, 0, 1) * (0.35 + bloom * 0.65)
        curves[f.c].getPointAt(f.t, p)
        p.x -= 0.03
        q.setFromEuler(f.rot)
        s.set(1, 0.4 + bloom * 0.6, 1).multiplyScalar(Math.max(1e-4, k * 1.9))
        pm.setMatrixAt(i, m.compose(p, q, s))
        s.setScalar(Math.max(1e-4, k * 1.6))
        cm.setMatrixAt(i, m.compose(p, q, s))
      })
      pm.instanceMatrix.needsUpdate = true
      cm.instanceMatrix.needsUpdate = true
    }
  })

  const base = TRAY_TOP - position[1]
  const wood = woodTex('crate')
  const veins = leafTex()

  return (
    <group position={position} rotation-y={-Math.PI / 2}>
      <group ref={group}>
        <group position={[0, base, 0]}>
          <mesh geometry={lattice} castShadow receiveShadow>
            <meshStandardMaterial map={wood} vertexColors color="#cdb38c" roughness={0.85} />
          </mesh>
          {tubes.map((t, i) => (
            <mesh key={i} geometry={t} castShadow>
              <meshStandardMaterial color="#5d6b2c" roughness={0.6} />
            </mesh>
          ))}
          <instancedMesh ref={leafMesh} args={[leafGeo, undefined, leaves.length]} castShadow>
            <meshStandardMaterial map={veins} color="#d6e6a0" roughness={0.55} side={THREE.DoubleSide} emissive="#4a6614" emissiveIntensity={0.22} />
          </instancedMesh>
          <instancedMesh ref={petalMesh} args={[petalGeo, undefined, flowers.length]} castShadow>
            <meshStandardMaterial color="#e0566b" roughness={0.45} side={THREE.DoubleSide} emissive="#e0566b" emissiveIntensity={0.18} />
          </instancedMesh>
          <instancedMesh ref={centerMesh} args={[centerGeo, undefined, flowers.length]}>
            <meshStandardMaterial color="#f7e3a0" emissive="#f4d27a" emissiveIntensity={0.4} />
          </instancedMesh>
          <Rim id="coopef-gym" at={[-0.7, 0.9, 0.2]} />
        </group>
      </group>
    </group>
  )
}
