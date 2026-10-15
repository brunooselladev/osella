'use client'

// Bucked Up: a glass fruit, lime. A lit core and seeds float inside; ripening draws a glowing seam,
// a warm blush at the base, and opens a glass flower beside the stem. Reading the case splits it
// along the seam into two glass halves.

// ===== External modules =====
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'

// ===== Internal modules =====
import { TRAY_TOP } from '../props'
import { TIERS, useTier } from '../quality'
import type { Vec3 } from '../vec'
import { bladeGeometry, hinge, openable, profiles, Rim, taperTube, useSpecimen, wobble } from './shared'

// ===== Constants =====

/** Fruit radius (m). */
const RADIUS = 0.37
/** Seeds spiralling up the pith. */
const SEED_COUNT = 7
/** Petals on the glass flower. */
const PETAL_COUNT = 5

// ===== Helpers =====

/** The lathe profile: a sphere with a shoulder, a dimple on top and a bulge at the base. */
const profilePoints = () => {
  const points: THREE.Vector2[] = []
  const steps = 48
  for (let i = 0; i <= steps; i++) {
    const phi = (i / steps) * Math.PI
    const shoulder = 1 + 0.1 * -Math.cos(phi)
    let radius = RADIUS * Math.sin(phi) * shoulder
    let y = -RADIUS * Math.cos(phi) * 0.9
    y -= RADIUS * 0.2 * Math.exp(-Math.pow((Math.PI - phi) / 0.32, 2))
    y += RADIUS * 0.1 * Math.exp(-Math.pow(phi / 0.3, 2))
    if (i === 0 || i === steps) radius = 0
    points.push(new THREE.Vector2(Math.max(radius, 0), y))
  }
  return points
}

/** Two half-lathes, each closed by a flat cut face, split on the x = 0 plane; opened pose hinged at the base. */
const splitBody = (points: THREE.Vector2[]) => {
  const outline = new THREE.Shape([...points.map((p) => new THREE.Vector2(p.x, p.y)), ...points.slice(1, -1).reverse().map((p) => new THREE.Vector2(-p.x, p.y))])
  const half = (start: number) => wobble(new THREE.LatheGeometry(points, 36, start, Math.PI), 0.035, 4, 2)
  const cap = (side: 1 | -1) => wobble(new THREE.ShapeGeometry(outline, 24).rotateY((-side * Math.PI) / 2), 0.035, 4, 2)
  const pivot = new THREE.Vector3(0, points[0].y, 0)
  const axis = new THREE.Vector3(0, 0, 1)
  return openable([half(0), cap(1), half(Math.PI), cap(-1)], (part, index) => {
    const side = index < 2 ? 1 : -1
    hinge(part, pivot, axis, -side * 0.62, new THREE.Vector3(side * 0.05, 0, 0))
  })
}

// ===== Component: Bucked =====

export const Bucked = ({ position, mobile }: { position: Vec3; mobile: boolean }) => {
  // --- Refs & state ---
  const { group, state } = useSpecimen('bucked-up', position)
  const bodyRef = useRef<THREE.Mesh>(null)
  const seamRef = useRef<THREE.MeshStandardMaterial>(null)
  const blushRef = useRef<THREE.MeshStandardMaterial>(null)
  const coreRef = useRef<THREE.MeshStandardMaterial>(null)
  const petalsRef = useRef<THREE.Group>(null)
  const tier = useTier()

  const points = useMemo(profilePoints, [])
  const body = useMemo(() => splitBody(points), [points])
  const top = points[points.length - 1].y + RADIUS * 0.18
  const seamGeometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.slice(3, -4).map((p) => new THREE.Vector3(p.x * 1.012, p.y, 0)))
    return new THREE.TubeGeometry(curve, 60, 0.0045, 6)
  }, [points])
  const stem = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, top - 0.06, 0), new THREE.Vector3(0.01, top + 0.06, 0), new THREE.Vector3(0.05, top + 0.15, 0.01), new THREE.Vector3(0.1, top + 0.19, 0.02)])
    return taperTube(new THREE.TubeGeometry(curve, 24, 0.017, 8), 1, 0.55)
  }, [top])
  const leaf = useMemo(() => bladeGeometry(0.3, 0.13, profiles.leaf, 0.35, 0.28), [])
  const petal = useMemo(() => bladeGeometry(0.11, 0.075, profiles.petal, 0.5, 0.15, 10, 5), [])
  const seed = useMemo(() => new THREE.SphereGeometry(0.03, 14, 10).scale(0.6, 1, 0.45), [])

  // visibility test for the transmission buffer: a sphere around the fruit against the camera frustum
  const bounds = useMemo(() => new THREE.Sphere(new THREE.Vector3(...position), RADIUS * 2.2), [position])
  const frustum = useMemo(() => new THREE.Frustum(), [])
  const scratchViewProjection = useMemo(() => new THREE.Matrix4(), [])

  // --- Effects ---
  useLayoutEffect(() => {
    bodyRef.current?.updateMorphTargets()
  }, [body])

  // --- Frame ---
  useFrame(({ camera }, dt) => {
    // The glass re-renders the whole room into its own buffer every frame; skip that when it can't be seen.
    const glass = bodyRef.current?.material as THREE.Material | undefined
    if (glass) {
      scratchViewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
      frustum.setFromProjectionMatrix(scratchViewProjection)
      glass.visible = frustum.intersectsSphere(bounds)
    }
    const ripen = state.current.ripen
    const split = state.current.open
    const ease = 1 - Math.exp(-6 * dt)
    if (bodyRef.current?.morphTargetInfluences) bodyRef.current.morphTargetInfluences[0] = split
    if (seamRef.current) seamRef.current.emissiveIntensity += (Math.max(0, ripen - 0.9) * 1.4 - seamRef.current.emissiveIntensity) * ease
    if (seamRef.current) seamRef.current.opacity = Math.min(1, Math.max(0, ripen - 0.7) * 1.4) * (1 - Math.min(1, split * 6))
    if (blushRef.current) blushRef.current.emissiveIntensity += (0.08 + ripen * 0.38 - blushRef.current.emissiveIntensity) * ease
    if (coreRef.current) coreRef.current.emissiveIntensity += (0.42 + ripen * 0.24 + split * 0.3 - coreRef.current.emissiveIntensity) * ease
    if (petalsRef.current) {
      const bloom = THREE.MathUtils.smoothstep(ripen, 0.6, 2)
      petalsRef.current.children.forEach((holder) => {
        const blade = holder.children[0]
        if (blade) blade.rotation.x = THREE.MathUtils.lerp(-0.08, 1.15, bloom)
      })
      petalsRef.current.scale.setScalar(0.55 + bloom * 0.45)
    }
  })

  // --- Derived ---
  const base = TRAY_TOP - position[1]
  const centerY = base + RADIUS * 0.92

  // --- Render ---
  return (
    <group position={position}>
      <group ref={group}>
        <group position={[0, centerY, 0]}>
          <mesh ref={bodyRef} geometry={body} rotation-y={0.84} castShadow>
            {mobile ? (
              <meshPhysicalMaterial color="#d3e47e" transmission={1} thickness={0.5} roughness={0.08} ior={1.46} attenuationColor="#a3bb3c" attenuationDistance={0.55} clearcoat={1} clearcoatRoughness={0.05} side={THREE.DoubleSide} />
            ) : (
              <MeshTransmissionMaterial
                color="#e8f2b2"
                transmission={1}
                thickness={0.36}
                roughness={0.05}
                ior={1.46}
                chromaticAberration={0.05}
                anisotropicBlur={0.15}
                distortion={0.12}
                distortionScale={0.35}
                temporalDistortion={0.04}
                attenuationColor="#b2cb4c"
                attenuationDistance={1.15}
                emissive="#c3d865"
                emissiveIntensity={0.05}
                envMapIntensity={1.35}
                clearcoat={1}
                clearcoatRoughness={0.04}
                samples={6}
                resolution={TIERS[tier].transmissionRes}
                backside={false}
              />
            )}
          </mesh>
          {/* a pale pith with seeds spiralling up it */}
          <mesh scale={[0.1, 0.26, 0.1]} position={[0, 0.0, 0]}>
            <sphereGeometry args={[RADIUS, 24, 16]} />
            <meshStandardMaterial ref={coreRef} color="#eef3c6" emissive="#f1f6c0" emissiveIntensity={0.2} roughness={0.6} transparent opacity={0.75} />
          </mesh>
          {Array.from({ length: SEED_COUNT }, (_, i) => {
            const angle = i * 2.4
            const y = -0.1 + i * 0.033
            return (
              <mesh key={i} geometry={seed} position={[Math.cos(angle) * 0.045, y, Math.sin(angle) * 0.045]} rotation={[0.3, -angle, 0.5]} scale={0.8}>
                <meshStandardMaterial color="#3b2a16" roughness={0.3} />
              </mesh>
            )
          })}
          {/* warm blush low inside the glass */}
          <mesh position={[0, -RADIUS * 0.55, 0]} scale={[1, 0.35, 1]}>
            <sphereGeometry args={[RADIUS * 0.62, 24, 12]} />
            <meshStandardMaterial ref={blushRef} color="#f6b27a" emissive="#ff9a5c" emissiveIntensity={0.15} transparent opacity={0.55} roughness={0.5} depthWrite={false} />
          </mesh>
          {/* the seam, front and back; one material drives both (the first carries the ref) */}
          <mesh geometry={seamGeometry} rotation-y={0.4}>
            <meshStandardMaterial ref={seamRef} color="#fff4d8" emissive="#ffe2a6" emissiveIntensity={0} transparent opacity={0} toneMapped={false} />
          </mesh>
          <mesh geometry={seamGeometry} rotation-y={Math.PI + 0.4}>
            <meshStandardMaterial color="#fff4d8" emissive="#ffe2a6" emissiveIntensity={0} transparent opacity={0} toneMapped={false} />
          </mesh>
          {/* stem, leaf, flower */}
          <mesh geometry={stem} castShadow>
            <meshPhysicalMaterial color="#7b6a2e" roughness={0.25} clearcoat={1} />
          </mesh>
          <mesh geometry={leaf} position={[0.07, top + 0.13, 0.015]} rotation={[0.5, 0.3, -1.05]} castShadow>
            <meshPhysicalMaterial color="#b9d466" roughness={0.1} transparent opacity={0.7} clearcoat={1} side={THREE.DoubleSide} emissive="#9fb84a" emissiveIntensity={0.18} />
          </mesh>
          <group ref={petalsRef} position={[-0.07, top - 0.02, 0.05]} rotation={[0.25, 0, 0.35]}>
            {Array.from({ length: PETAL_COUNT }, (_, i) => (
              <group key={i} rotation-y={(i / PETAL_COUNT) * Math.PI * 2}>
                <mesh geometry={petal} rotation-x={0.2}>
                  <meshPhysicalMaterial color="#eef6c8" roughness={0.08} transparent opacity={0.62} clearcoat={1} side={THREE.DoubleSide} emissive="#e6f2a8" emissiveIntensity={0.25} />
                </mesh>
              </group>
            ))}
            <mesh>
              <sphereGeometry args={[0.018, 10, 8]} />
              <meshStandardMaterial color="#f7e7a8" emissive="#f4d878" emissiveIntensity={0.6} />
            </mesh>
          </group>
          <Rim id="bucked-up" at={[0.32, 0.25, 0.5]} />
        </group>
      </group>
    </group>
  )
}
