'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js'
import { TRAY_TOP } from '../props'
import { fiberTex, rng } from '../textures'
import { bladeGeometry, fixNormals, profiles, Rim, useSpecimen, type Vec3 } from './shared'

// Tall fibrous seed pod with ribs. Ripening splits it along the seam: two valves part,
// seeds and floss show, and a dry fibre flower opens at the tip.

const L = 1.05
const R = 0.2
const RIBS = 7

function radius(u: number, theta: number) {
  const spindle = Math.pow(Math.sin(Math.PI * u), 0.82) * (1 + 0.12 * u) * (1 - 0.18 * Math.pow(u, 3))
  const rib = 0.88 + 0.16 * Math.pow(Math.abs(Math.cos((RIBS / 2) * theta)), 0.6)
  return R * spindle * rib
}

function valve(side: 1 | -1) {
  // one half of the pod: theta spans PI around the +x (side 1) or -x (side -1) half
  return new ParametricGeometry(
    (u: number, v: number, out: THREE.Vector3) => {
      const y = u * L
      const theta = (side > 0 ? -Math.PI / 2 : Math.PI / 2) + v * Math.PI
      const r = radius(u, theta)
      const bend = 0.06 * Math.sin(Math.PI * u)
      out.set(Math.cos(theta) * r + bend, y, Math.sin(theta) * r)
    },
    40,
    64,
  )
}

export function Imperio({ position }: { position: Vec3 }) {
  const { group, state } = useSpecimen('imperio-tickets', position)
  const a = useRef<THREE.Group>(null)
  const b = useRef<THREE.Group>(null)
  const flower = useRef<THREE.Group>(null)
  const floss = useRef<THREE.Group>(null)
  const valveA = useMemo(() => fixNormals(valve(1)), [])
  const valveB = useMemo(() => fixNormals(valve(-1)), [])
  const map = useMemo(() => {
    const t = fiberTex().clone()
    t.repeat.set(1, 3)
    t.needsUpdate = true
    return t
  }, [])
  const seed = useMemo(() => new THREE.SphereGeometry(0.035, 12, 8).scale(0.75, 1.2, 0.35), [])
  const seeds = useMemo(() => {
    const r = rng(6)
    return Array.from({ length: 22 }, (_, i) => {
      const u = 0.14 + (i / 22) * 0.7
      return { y: u * L, x: (r() - 0.5) * 0.06, z: (r() - 0.5) * 0.05, rz: (r() - 0.5) * 0.6, s: 0.8 + Math.sin(Math.PI * u) * 0.5 }
    })
  }, [])
  const strands = useMemo(() => {
    const r = rng(14)
    return Array.from({ length: 18 }, (_, i) => {
      const y = 0.25 + (i / 18) * 0.6
      const ang = r() * Math.PI * 2
      const c = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, y, 0),
        new THREE.Vector3(Math.cos(ang) * 0.06, y + 0.06, Math.sin(ang) * 0.04),
        new THREE.Vector3(Math.cos(ang) * 0.15, y + 0.16 + r() * 0.05, Math.sin(ang) * 0.1),
      ])
      return new THREE.TubeGeometry(c, 10, 0.0025, 4)
    })
  }, [])
  const petal = useMemo(() => bladeGeometry(0.14, 0.035, profiles.leaf, 0.5, 0.55, 10, 3), [])

  useFrame(() => {
    const ripen = state.current.ripen
    const open = THREE.MathUtils.smoothstep(ripen, 0.5, 2)
    const wide = state.current.open
    if (a.current) a.current.rotation.z = -0.025 - open * 0.26 - wide * 0.42
    if (b.current) b.current.rotation.z = 0.025 + open * 0.26 + wide * 0.42
    if (floss.current) {
      floss.current.scale.setScalar(0.2 + open * 0.8 + wide * 0.6)
      floss.current.visible = open > 0.05
    }
    if (flower.current) {
      flower.current.children.forEach((p) => {
        const blade = p.children[0]
        if (blade) blade.rotation.x = THREE.MathUtils.lerp(0.1, 1.45, THREE.MathUtils.smoothstep(ripen, 0.2, 1.6))
      })
    }
  })

  const base = TRAY_TOP - position[1] - 0.03

  return (
    <group position={position}>
      <group ref={group}>
        <group position={[0, base, 0]} rotation={[0.05, 0.6, 0.06]}>
          <group ref={a}>
            <mesh geometry={valveA} castShadow receiveShadow>
              <meshStandardMaterial map={map} color="#e6dcc0" roughness={0.9} bumpMap={map} bumpScale={3} side={THREE.FrontSide} />
            </mesh>
            <mesh geometry={valveA}>
              <meshStandardMaterial color="#efe4cc" roughness={0.95} side={THREE.BackSide} />
            </mesh>
          </group>
          <group ref={b}>
            <mesh geometry={valveB} castShadow receiveShadow>
              <meshStandardMaterial map={map} color="#e6dcc0" roughness={0.9} bumpMap={map} bumpScale={3} side={THREE.FrontSide} />
            </mesh>
            <mesh geometry={valveB}>
              <meshStandardMaterial color="#efe4cc" roughness={0.95} side={THREE.BackSide} />
            </mesh>
          </group>
          {seeds.map((s, i) => (
            <mesh key={i} geometry={seed} position={[s.x, s.y, s.z]} rotation-z={s.rz} scale={s.s}>
              <meshStandardMaterial color="#4a3020" roughness={0.35} />
            </mesh>
          ))}
          <group ref={floss}>
            {strands.map((g, i) => (
              <mesh key={i} geometry={g}>
                <meshStandardMaterial color="#fbf6ea" roughness={0.6} emissive="#fff6e4" emissiveIntensity={0.25} />
              </mesh>
            ))}
          </group>
          {/* stalk into the soil */}
          <mesh position={[0, -0.02, 0]}>
            <cylinderGeometry args={[0.02, 0.03, 0.1, 8]} />
            <meshStandardMaterial color="#8a6e45" roughness={0.9} />
          </mesh>
          {/* dry fibre flower at the tip */}
          <group ref={flower} position={[0.01, L - 0.02, 0]}>
            {Array.from({ length: 9 }, (_, i) => (
              <group key={i} rotation-y={(i / 9) * Math.PI * 2}>
                <mesh geometry={petal} castShadow>
                  <meshStandardMaterial map={map} color="#ead7ae" roughness={0.9} side={THREE.DoubleSide} transparent opacity={0.92} />
                </mesh>
              </group>
            ))}
          </group>
          <Rim id="imperio-tickets" at={[0.45, 0.6, -0.4]} />
        </group>
      </group>
    </group>
  )
}
