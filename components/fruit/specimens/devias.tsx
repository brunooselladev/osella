'use client'

// Devias: a squat clay fruit, ribbed like a gourd, with a twisted stem. Ripening unfolds six clay
// petals from the base; reading the case peels the body open into five wedges around a warm core.

// ===== External modules =====
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js'

// ===== Internal modules =====
import { TRAY_TOP } from '../props'
import { bumpTex, clayTex } from '../textures'
import type { Vec3 } from '../vec'
import { bladeGeometry, fixNormals, hinge, openable, profiles, Rim, taperTube, useSpecimen } from './shared'

// ===== Constants =====

/** Body radius and height (m). */
const RADIUS = 0.46
const HEIGHT = 0.44
/** Clay petals around the base. */
const PETAL_COUNT = 6
/** Wedges the body peels into. */
const WEDGE_COUNT = 5

// ===== Helpers =====

/** One slice of the ribbed body between two angles (radians), as a parametric surface. */
const wedgeSurface = (thetaStart = 0, thetaEnd = Math.PI * 2) =>
  new ParametricGeometry(
    (u: number, v: number, out: THREE.Vector3) => {
      const phi = v * Math.PI
      const theta = thetaStart + u * (thetaEnd - thetaStart)
      const sinPhi = Math.sin(phi)
      const rib = 0.88 + 0.12 * Math.pow(Math.abs(Math.cos(5 * theta + 0.15 * Math.sin(3 * theta))), 0.45)
      const lobes = 1 - (1 - rib) * Math.pow(sinPhi, 1.2)
      const radius = RADIUS * Math.pow(sinPhi, 0.8) * lobes * (1 + 0.05 * -Math.cos(phi))
      let y = (-Math.cos(phi) * HEIGHT) / 2
      y -= 0.1 * Math.exp(-Math.pow((Math.PI - phi) / 0.5, 2)) // dimple on top
      y += 0.045 * Math.exp(-Math.pow(phi / 0.45, 2)) // flat base
      y *= 1 - 0.1 * Math.pow(sinPhi, 4)
      out.set(Math.cos(theta) * radius, y, Math.sin(theta) * radius)
    },
    Math.round(96 / WEDGE_COUNT),
    48,
  )

/** The whole body as wedges, with each wedge hinged outward from the base as the opened pose. */
const splitBody = () => {
  const step = (Math.PI * 2) / WEDGE_COUNT
  const wedges = Array.from({ length: WEDGE_COUNT }, (_, k) => fixNormals(wedgeSurface(k * step, (k + 1) * step)))
  return openable(wedges, (wedge, k) => {
    const middle = (k + 0.5) * step
    const outward = new THREE.Vector3(Math.cos(middle), 0, Math.sin(middle))
    const axis = new THREE.Vector3(0, 1, 0).cross(outward)
    hinge(wedge, new THREE.Vector3(outward.x * 0.24, -HEIGHT / 2 + 0.03, outward.z * 0.24), axis, 1.32, outward.clone().multiplyScalar(0.07))
  })
}

// ===== Component: Devias =====

export const Devias = ({ position }: { position: Vec3 }) => {
  // --- Refs & state ---
  const { group, state } = useSpecimen('devias', position)
  const bodyRef = useRef<THREE.Mesh>(null)
  const stemRef = useRef<THREE.Mesh>(null)
  const petalsRef = useRef<THREE.Group>(null)
  const body = useMemo(splitBody, [])
  const stem = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.04, 0), new THREE.Vector3(0.01, 0.05, 0.005), new THREE.Vector3(0.04, 0.11, 0.0), new THREE.Vector3(0.09, 0.14, -0.02)])
    return taperTube(new THREE.TubeGeometry(curve, 20, 0.032, 7), 1, 0.5)
  }, [])
  const petal = useMemo(() => bladeGeometry(0.36, 0.3, profiles.petal, 0.75, 0.28, 16, 8), [])
  const clay = useMemo(() => {
    const texture = clayTex().clone()
    texture.repeat.set(2, 1)
    texture.needsUpdate = true
    return texture
  }, [])
  const pores = bumpTex(3, 24)

  // --- Effects ---
  useLayoutEffect(() => {
    bodyRef.current?.updateMorphTargets()
  }, [body])

  // --- Frame ---
  useFrame(() => {
    const peel = state.current.open
    if (bodyRef.current?.morphTargetInfluences) bodyRef.current.morphTargetInfluences[0] = peel
    if (stemRef.current) stemRef.current.visible = peel < 0.05
    const unfold = THREE.MathUtils.smoothstep(state.current.ripen, 0.3, 2)
    petalsRef.current?.children.forEach((holder, i) => {
      const blade = holder.children[0]
      if (!blade) return
      blade.rotation.x = THREE.MathUtils.lerp(0.45, 1.36 + (i % 2) * 0.08, unfold)
      blade.scale.setScalar(0.75 + unfold * 0.25)
    })
  })

  // --- Derived ---
  const base = TRAY_TOP - position[1]
  const centerY = base + HEIGHT / 2 - 0.02

  // --- Render ---
  return (
    <group position={position}>
      <group ref={group}>
        <group position={[0, centerY, 0]}>
          {/* turned so a gap between two wedges faces the aisle: peeled, the core shows */}
          <mesh ref={bodyRef} geometry={body} rotation-y={0.73} castShadow receiveShadow>
            <meshPhysicalMaterial
              map={clay}
              color="#f6ebe2"
              roughness={0.88}
              sheen={0.9}
              sheenColor="#ffe2cc"
              sheenRoughness={0.7}
              bumpMap={pores}
              bumpScale={2.2}
              emissive="#5a2414"
              emissiveIntensity={0.06}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* clay core, hidden until the wedges peel back */}
          <mesh position={[0, -0.04, 0]} scale={[1, 0.82, 1]} castShadow>
            <sphereGeometry args={[RADIUS * 0.42, 32, 20]} />
            <meshPhysicalMaterial map={clay} color="#ffe6d6" roughness={0.7} sheen={1} sheenColor="#ffd9c0" emissive="#b8674a" emissiveIntensity={0.18} bumpMap={pores} bumpScale={1.6} />
          </mesh>
          {/* twisted stem in the dimple */}
          <mesh ref={stemRef} geometry={stem} position={[0, HEIGHT / 2 - 0.1, 0]} castShadow>
            <meshStandardMaterial map={clay} color="#a08070" roughness={0.9} bumpMap={pores} bumpScale={2} />
          </mesh>
          {/* petals from the base */}
          <group ref={petalsRef} position={[0, -HEIGHT / 2 + 0.05, 0]}>
            {Array.from({ length: PETAL_COUNT }, (_, i) => (
              <group key={i} rotation-y={(i / PETAL_COUNT) * Math.PI * 2}>
                <mesh geometry={petal} position={[0, 0, 0.3]} rotation-x={0.45} castShadow receiveShadow>
                  <meshPhysicalMaterial color="#f8e4d8" map={clay} roughness={0.85} sheen={0.9} sheenColor="#ffe2cc" side={THREE.DoubleSide} emissive="#6b2310" emissiveIntensity={0.1} />
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
