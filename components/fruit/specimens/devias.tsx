'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js'
import { TRAY_TOP } from '../props'
import { bumpTex, clayTex } from '../textures'
import { bladeGeometry, fixNormals, hinge, openable, profiles, Rim, taperTube, useSpecimen, type Vec3 } from './shared'

// Squat clay fruit, ribbed like a gourd, a twisted stem. Ripening unfolds six clay petals from the base;
// reading the case peels the body open into five wedges around a warm clay core.

const R = 0.46
const H = 0.44
const PETALS = 6

const WEDGES = 5

function body(t0 = 0, t1 = Math.PI * 2) {
  return new ParametricGeometry(
    (u: number, v: number, out: THREE.Vector3) => {
      const phi = v * Math.PI
      const theta = t0 + u * (t1 - t0)
      const s = Math.sin(phi)
      const rib = 0.88 + 0.12 * Math.pow(Math.abs(Math.cos(5 * theta + 0.15 * Math.sin(3 * theta))), 0.45)
      const lobes = 1 - (1 - rib) * Math.pow(s, 1.2)
      const r = R * Math.pow(s, 0.8) * lobes * (1 + 0.05 * -Math.cos(phi))
      let y = (-Math.cos(phi) * H) / 2
      y -= 0.1 * Math.exp(-Math.pow((Math.PI - phi) / 0.5, 2))
      y += 0.045 * Math.exp(-Math.pow(phi / 0.45, 2))
      y *= 1 - 0.1 * Math.pow(s, 4)
      out.set(Math.cos(theta) * r, y, Math.sin(theta) * r)
    },
    Math.round(96 / WEDGES),
    48,
  )
}

function solid() {
  const step = (Math.PI * 2) / WEDGES
  const parts = Array.from({ length: WEDGES }, (_, k) => fixNormals(body(k * step, (k + 1) * step)))
  return openable(parts, (part, k) => {
    const mid = (k + 0.5) * step
    const out = new THREE.Vector3(Math.cos(mid), 0, Math.sin(mid))
    const axis = new THREE.Vector3(0, 1, 0).cross(out)
    hinge(part, new THREE.Vector3(out.x * 0.24, -H / 2 + 0.03, out.z * 0.24), axis, 1.32, out.clone().multiplyScalar(0.07))
  })
}

export function Devias({ position }: { position: Vec3 }) {
  const { group, state } = useSpecimen('devias', position)
  const petals = useRef<THREE.Group>(null)
  const geo = useMemo(solid, [])
  const bodyMesh = useRef<THREE.Mesh>(null)
  const stemRef = useRef<THREE.Mesh>(null)
  useLayoutEffect(() => {
    bodyMesh.current?.updateMorphTargets()
  }, [geo])
  const stem = useMemo(() => {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.04, 0), new THREE.Vector3(0.01, 0.05, 0.005), new THREE.Vector3(0.04, 0.11, 0.0), new THREE.Vector3(0.09, 0.14, -0.02)])
    return taperTube(new THREE.TubeGeometry(c, 20, 0.032, 7), 1, 0.5)
  }, [])
  const petal = useMemo(() => bladeGeometry(0.36, 0.3, profiles.petal, 0.75, 0.28, 16, 8), [])
  const map = useMemo(() => {
    const t = clayTex().clone()
    t.repeat.set(2, 1)
    t.needsUpdate = true
    return t
  }, [])
  const bump = bumpTex(3, 24)

  useFrame(() => {
    const peel = state.current.open
    if (bodyMesh.current?.morphTargetInfluences) bodyMesh.current.morphTargetInfluences[0] = peel
    if (stemRef.current) stemRef.current.visible = peel < 0.05
    const open = THREE.MathUtils.smoothstep(state.current.ripen, 0.3, 2)
    petals.current?.children.forEach((p, i) => {
      const blade = p.children[0]
      if (!blade) return
      blade.rotation.x = THREE.MathUtils.lerp(0.45, 1.36 + (i % 2) * 0.08, open)
      blade.scale.setScalar(0.75 + open * 0.25)
    })
  })

  const base = TRAY_TOP - position[1]
  const centerY = base + H / 2 - 0.02

  return (
    <group position={position}>
      <group ref={group}>
        <group position={[0, centerY, 0]}>
          {/* turned so a gap between two wedges faces the aisle: peeled, the core shows */}
          <mesh ref={bodyMesh} geometry={geo} rotation-y={0.73} castShadow receiveShadow>
            <meshPhysicalMaterial
              map={map}
              color="#f6ebe2"
              roughness={0.88}
              sheen={0.9}
              sheenColor="#ffe2cc"
              sheenRoughness={0.7}
              bumpMap={bump}
              bumpScale={2.2}
              emissive="#5a2414"
              emissiveIntensity={0.06}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* clay core, hidden until the wedges peel back */}
          <mesh position={[0, -0.04, 0]} scale={[1, 0.82, 1]} castShadow>
            <sphereGeometry args={[R * 0.42, 32, 20]} />
            <meshPhysicalMaterial map={map} color="#ffe6d6" roughness={0.7} sheen={1} sheenColor="#ffd9c0" emissive="#b8674a" emissiveIntensity={0.18} bumpMap={bump} bumpScale={1.6} />
          </mesh>
          {/* twisted stem in the dimple */}
          <mesh ref={stemRef} geometry={stem} position={[0, H / 2 - 0.1, 0]} castShadow>
            <meshStandardMaterial map={map} color="#a08070" roughness={0.9} bumpMap={bump} bumpScale={2} />
          </mesh>
          {/* petals from the base */}
          <group ref={petals} position={[0, -H / 2 + 0.05, 0]}>
            {Array.from({ length: PETALS }, (_, i) => (
              <group key={i} rotation-y={(i / PETALS) * Math.PI * 2}>
                <mesh geometry={petal} position={[0, 0, 0.3]} rotation-x={0.45} castShadow receiveShadow>
                  <meshPhysicalMaterial color="#f8e4d8" map={map} roughness={0.85} sheen={0.9} sheenColor="#ffe2cc" side={THREE.DoubleSide} emissive="#6b2310" emissiveIntensity={0.1} />
                </mesh>
              </group>
            ))}
          </group>
          <Rim id="devias" at={[-0.4, 0.3, -0.5]} />
        </group>
      </group>
    </group>
  )
}
