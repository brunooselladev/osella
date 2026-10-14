'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { TRAY_TOP } from '../props'
import { TIERS, useTier } from '../quality'
import { bladeGeometry, hinge, openable, profiles, Rim, taperTube, useSpecimen, wobble, type Vec3 } from './shared'

// Glass fruit, lime. A lit core and five seeds float inside; ripening draws a glowing seam,
// a warm blush at the base, and opens a glass flower beside the stem. Reading the case
// splits it along the seam into two glass halves.

const R = 0.37

function profile() {
  const pts: THREE.Vector2[] = []
  const n = 48
  for (let i = 0; i <= n; i++) {
    const phi = (i / n) * Math.PI
    const shoulder = 1 + 0.1 * -Math.cos(phi)
    let r = R * Math.sin(phi) * shoulder
    let y = -R * Math.cos(phi) * 0.9
    y -= R * 0.2 * Math.exp(-Math.pow((Math.PI - phi) / 0.32, 2))
    y += R * 0.1 * Math.exp(-Math.pow(phi / 0.3, 2))
    if (i === 0 || i === n) r = 0
    pts.push(new THREE.Vector2(Math.max(r, 0), y))
  }
  return pts
}

export function Bucked({ position, mobile }: { position: Vec3; mobile: boolean }) {
  const { group, state } = useSpecimen('bucked-up', position)
  const seam = useRef<THREE.MeshStandardMaterial>(null)
  const blush = useRef<THREE.MeshStandardMaterial>(null)
  const core = useRef<THREE.MeshStandardMaterial>(null)
  const petals = useRef<THREE.Group>(null)

  const pts = useMemo(profile, [])
  const body = useMemo(() => {
    // two half-lathes, each closed by a flat cut face, split on the x = 0 plane
    const outline = new THREE.Shape([...pts.map((p) => new THREE.Vector2(p.x, p.y)), ...pts.slice(1, -1).reverse().map((p) => new THREE.Vector2(-p.x, p.y))])
    const half = (start: number) => wobble(new THREE.LatheGeometry(pts, 36, start, Math.PI), 0.035, 4, 2)
    const cap = (side: 1 | -1) => wobble(new THREE.ShapeGeometry(outline, 24).rotateY(-side * Math.PI / 2), 0.035, 4, 2)
    const pivot = new THREE.Vector3(0, pts[0].y, 0)
    const z = new THREE.Vector3(0, 0, 1)
    return openable([half(0), cap(1), half(Math.PI), cap(-1)], (part, i) => {
      const side = i < 2 ? 1 : -1
      hinge(part, pivot, z, -side * 0.62, new THREE.Vector3(side * 0.05, 0, 0))
    })
  }, [pts])
  const bodyMesh = useRef<THREE.Mesh>(null)
  const glass = useRef<THREE.Material>(null)
  const tier = useTier()
  const sphere = useMemo(() => new THREE.Sphere(new THREE.Vector3(...position), R * 2.2), [position])
  const frustum = useMemo(() => new THREE.Frustum(), [])
  const viewProj = useMemo(() => new THREE.Matrix4(), [])
  useLayoutEffect(() => {
    bodyMesh.current?.updateMorphTargets()
  }, [body])
  const seamGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(pts.slice(3, -4).map((p) => new THREE.Vector3(p.x * 1.012, p.y, 0)))
    return new THREE.TubeGeometry(curve, 60, 0.0045, 6)
  }, [pts])
  const top = pts[pts.length - 1].y + R * 0.18
  const stem = useMemo(() => {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0, top - 0.06, 0), new THREE.Vector3(0.01, top + 0.06, 0), new THREE.Vector3(0.05, top + 0.15, 0.01), new THREE.Vector3(0.1, top + 0.19, 0.02)])
    return taperTube(new THREE.TubeGeometry(c, 24, 0.017, 8), 1, 0.55)
  }, [top])
  const leaf = useMemo(() => bladeGeometry(0.3, 0.13, profiles.leaf, 0.35, 0.28), [])
  const petal = useMemo(() => bladeGeometry(0.11, 0.075, profiles.petal, 0.5, 0.15, 10, 5), [])
  const seed = useMemo(() => new THREE.SphereGeometry(0.03, 14, 10).scale(0.6, 1, 0.45), [])

  useFrame(({ camera }, dt) => {
    // The glass re-renders the whole room into its own buffer every frame; skip that when it can't be seen.
    if (glass.current) {
      viewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
      frustum.setFromProjectionMatrix(viewProj)
      glass.current.visible = frustum.intersectsSphere(sphere)
    }
    const ripen = state.current.ripen
    const k = 1 - Math.exp(-6 * dt)
    const open = state.current.open
    const m = bodyMesh.current
    if (m?.morphTargetInfluences) m.morphTargetInfluences[0] = open
    if (seam.current) seam.current.emissiveIntensity += (Math.max(0, ripen - 0.9) * 1.4 - seam.current.emissiveIntensity) * k
    if (seam.current) seam.current.opacity = Math.min(1, Math.max(0, ripen - 0.7) * 1.4) * (1 - Math.min(1, open * 6))
    if (blush.current) blush.current.emissiveIntensity += (0.08 + ripen * 0.38 - blush.current.emissiveIntensity) * k
    if (core.current) core.current.emissiveIntensity += (0.42 + ripen * 0.24 + open * 0.3 - core.current.emissiveIntensity) * k
    if (petals.current) {
      const open = THREE.MathUtils.smoothstep(ripen, 0.6, 2)
      petals.current.children.forEach((p) => {
        const blade = p.children[0]
        if (blade) blade.rotation.x = THREE.MathUtils.lerp(-0.08, 1.15, open)
      })
      const s = 0.55 + open * 0.45
      petals.current.scale.setScalar(s)
    }
  })

  const base = TRAY_TOP - position[1]
  const centerY = base + R * 0.92

  return (
    <group position={position}>
      <group ref={group}>
        <group position={[0, centerY, 0]}>
          <mesh ref={bodyMesh} geometry={body} rotation-y={0.84} castShadow>
            {mobile ? (
              <meshPhysicalMaterial color="#d3e47e" transmission={1} thickness={0.5} roughness={0.08} ior={1.46} attenuationColor="#a3bb3c" attenuationDistance={0.55} clearcoat={1} clearcoatRoughness={0.05} side={THREE.DoubleSide} />
            ) : (
              <MeshTransmissionMaterial
                ref={glass as never}
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
                resolution={TIERS[tier].glass}
                backside={false}
              />
            )}
          </mesh>
          {/* lit core and seeds */}
          {/* a pale pith with seeds spiralling up it */}
          <mesh scale={[0.1, 0.26, 0.1]} position={[0, 0.0, 0]}>
            <sphereGeometry args={[R, 24, 16]} />
            <meshStandardMaterial ref={core} color="#eef3c6" emissive="#f1f6c0" emissiveIntensity={0.2} roughness={0.6} transparent opacity={0.75} />
          </mesh>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const a = i * 2.4
            const y = -0.1 + i * 0.033
            return <mesh key={i} geometry={seed} position={[Math.cos(a) * 0.045, y, Math.sin(a) * 0.045]} rotation={[0.3, -a, 0.5]} scale={0.8}>
              <meshStandardMaterial color="#3b2a16" roughness={0.3} />
            </mesh>
          })}
          {/* warm blush low inside the glass */}
          <mesh position={[0, -R * 0.55, 0]} scale={[1, 0.35, 1]}>
            <sphereGeometry args={[R * 0.62, 24, 12]} />
            <meshStandardMaterial ref={blush} color="#f6b27a" emissive="#ff9a5c" emissiveIntensity={0.15} transparent opacity={0.55} roughness={0.5} depthWrite={false} />
          </mesh>
          {/* seam */}
          {[0, Math.PI].map((r) => (
            <mesh key={r} geometry={seamGeo} rotation-y={r + 0.4}>
              <meshStandardMaterial ref={r === 0 ? seam : undefined} color="#fff4d8" emissive="#ffe2a6" emissiveIntensity={0} transparent opacity={0} toneMapped={false} />
            </mesh>
          ))}
          {/* stem, leaf, flower */}
          <mesh geometry={stem} castShadow>
            <meshPhysicalMaterial color="#7b6a2e" roughness={0.25} clearcoat={1} />
          </mesh>
          <mesh geometry={leaf} position={[0.07, top + 0.13, 0.015]} rotation={[0.5, 0.3, -1.05]} castShadow>
            <meshPhysicalMaterial color="#b9d466" roughness={0.1} transparent opacity={0.7} clearcoat={1} side={THREE.DoubleSide} emissive="#9fb84a" emissiveIntensity={0.18} />
          </mesh>
          <group ref={petals} position={[-0.07, top - 0.02, 0.05]} rotation={[0.25, 0, 0.35]}>
            {[0, 1, 2, 3, 4].map((i) => (
              <group key={i} rotation-y={(i / 5) * Math.PI * 2}>
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
