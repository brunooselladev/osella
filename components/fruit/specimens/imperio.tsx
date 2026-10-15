'use client'

// Imperio Tickets: a tall fibrous seed pod with ribs. Ripening splits it along the seam: two valves
// part, seeds and floss show, and a dry fibre flower opens at the tip.

// ===== External modules =====
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js'

// ===== Internal modules =====
import { TRAY_TOP } from '../props'
import { fiberTex, rng } from '../textures'
import type { Vec3 } from '../vec'
import { bladeGeometry, fixNormals, profiles, Rim, useSpecimen } from './shared'

// ===== Types =====

type Seed = { y: number; x: number; z: number; rz: number; s: number }

// ===== Constants =====

/** Pod length and radius (m). */
const POD_LENGTH = 1.05
const POD_RADIUS = 0.2
const RIB_COUNT = 7
const SEED_COUNT = 22
const STRAND_COUNT = 18
const FLOWER_PETALS = 9

// ===== Helpers =====

/** Pod radius at height u (0 base, 1 tip) and angle theta: a spindle with ribs. */
const podRadius = (u: number, theta: number) => {
  const spindle = Math.pow(Math.sin(Math.PI * u), 0.82) * (1 + 0.12 * u) * (1 - 0.18 * Math.pow(u, 3))
  const rib = 0.88 + 0.16 * Math.pow(Math.abs(Math.cos((RIB_COUNT / 2) * theta)), 0.6)
  return POD_RADIUS * spindle * rib
}

/** One half of the pod: theta spans PI around the +x (side 1) or -x (side -1) half. */
const valveSurface = (side: 1 | -1) =>
  new ParametricGeometry(
    (u: number, v: number, out: THREE.Vector3) => {
      const y = u * POD_LENGTH
      const theta = (side > 0 ? -Math.PI / 2 : Math.PI / 2) + v * Math.PI
      const radius = podRadius(u, theta)
      const bend = 0.06 * Math.sin(Math.PI * u)
      out.set(Math.cos(theta) * radius + bend, y, Math.sin(theta) * radius)
    },
    40,
    64,
  )

// ===== Component: Imperio =====

export const Imperio = ({ position }: { position: Vec3 }) => {
  // --- Refs & state ---
  const { group, state } = useSpecimen('imperio-tickets', position)
  const rightValveRef = useRef<THREE.Group>(null)
  const leftValveRef = useRef<THREE.Group>(null)
  const flowerRef = useRef<THREE.Group>(null)
  const flossRef = useRef<THREE.Group>(null)
  const rightValve = useMemo(() => fixNormals(valveSurface(1)), [])
  const leftValve = useMemo(() => fixNormals(valveSurface(-1)), [])
  const fibre = useMemo(() => {
    const texture = fiberTex().clone()
    texture.repeat.set(1, 3)
    texture.needsUpdate = true
    return texture
  }, [])
  const seedGeometry = useMemo(() => new THREE.SphereGeometry(0.035, 12, 8).scale(0.75, 1.2, 0.35), [])
  const seeds = useMemo(() => {
    const random = rng(6)
    return Array.from({ length: SEED_COUNT }, (_, i): Seed => {
      const u = 0.14 + (i / SEED_COUNT) * 0.7
      return { y: u * POD_LENGTH, x: (random() - 0.5) * 0.06, z: (random() - 0.5) * 0.05, rz: (random() - 0.5) * 0.6, s: 0.8 + Math.sin(Math.PI * u) * 0.5 }
    })
  }, [])
  // silk strands curling out of the seam
  const strands = useMemo(() => {
    const random = rng(14)
    return Array.from({ length: STRAND_COUNT }, (_, i) => {
      const y = 0.25 + (i / STRAND_COUNT) * 0.6
      const angle = random() * Math.PI * 2
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, y, 0),
        new THREE.Vector3(Math.cos(angle) * 0.06, y + 0.06, Math.sin(angle) * 0.04),
        new THREE.Vector3(Math.cos(angle) * 0.15, y + 0.16 + random() * 0.05, Math.sin(angle) * 0.1),
      ])
      return new THREE.TubeGeometry(curve, 10, 0.0025, 4)
    })
  }, [])
  const petal = useMemo(() => bladeGeometry(0.14, 0.035, profiles.leaf, 0.5, 0.55, 10, 3), [])

  // --- Frame ---
  useFrame(() => {
    const ripen = state.current.ripen
    const part = THREE.MathUtils.smoothstep(ripen, 0.5, 2)
    const wide = state.current.open
    if (rightValveRef.current) rightValveRef.current.rotation.z = -0.025 - part * 0.26 - wide * 0.42
    if (leftValveRef.current) leftValveRef.current.rotation.z = 0.025 + part * 0.26 + wide * 0.42
    if (flossRef.current) {
      flossRef.current.scale.setScalar(0.2 + part * 0.8 + wide * 0.6)
      flossRef.current.visible = part > 0.05
    }
    if (flowerRef.current) {
      const bloom = THREE.MathUtils.smoothstep(ripen, 0.2, 1.6)
      flowerRef.current.children.forEach((holder) => {
        const blade = holder.children[0]
        if (blade) blade.rotation.x = THREE.MathUtils.lerp(0.1, 1.45, bloom)
      })
    }
  })

  // --- Derived ---
  const base = TRAY_TOP - position[1] - 0.03

  // --- Render ---
  return (
    <group position={position}>
      <group ref={group}>
        <group position={[0, base, 0]} rotation={[0.05, 0.6, 0.06]}>
          {/* each valve: fibrous outside, pale inside */}
          <group ref={rightValveRef}>
            <mesh geometry={rightValve} castShadow receiveShadow>
              <meshStandardMaterial map={fibre} color="#e6dcc0" roughness={0.9} bumpMap={fibre} bumpScale={3} side={THREE.FrontSide} />
            </mesh>
            <mesh geometry={rightValve}>
              <meshStandardMaterial color="#efe4cc" roughness={0.95} side={THREE.BackSide} />
            </mesh>
          </group>
          <group ref={leftValveRef}>
            <mesh geometry={leftValve} castShadow receiveShadow>
              <meshStandardMaterial map={fibre} color="#e6dcc0" roughness={0.9} bumpMap={fibre} bumpScale={3} side={THREE.FrontSide} />
            </mesh>
            <mesh geometry={leftValve}>
              <meshStandardMaterial color="#efe4cc" roughness={0.95} side={THREE.BackSide} />
            </mesh>
          </group>
          {seeds.map((seed, i) => (
            <mesh key={i} geometry={seedGeometry} position={[seed.x, seed.y, seed.z]} rotation-z={seed.rz} scale={seed.s}>
              <meshStandardMaterial color="#4a3020" roughness={0.35} />
            </mesh>
          ))}
          <group ref={flossRef}>
            {strands.map((strand, i) => (
              <mesh key={i} geometry={strand}>
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
          <group ref={flowerRef} position={[0.01, POD_LENGTH - 0.02, 0]}>
            {Array.from({ length: FLOWER_PETALS }, (_, i) => (
              <group key={i} rotation-y={(i / FLOWER_PETALS) * Math.PI * 2}>
                <mesh geometry={petal}>
                  <meshStandardMaterial map={fibre} color="#ead7ae" roughness={0.9} side={THREE.DoubleSide} transparent opacity={0.92} />
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
