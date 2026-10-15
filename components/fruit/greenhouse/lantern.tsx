'use client'

// A small lantern on the left bench near the end wall. Its bulb and point light come up with
// day.lamp; the glass shader mirrors it at night (LAMP_POS).

// ===== External modules =====
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ===== Internal modules =====
import { day } from '../day'
import { vec3 } from '../vec'
import { BENCH_TOP, LAMP_POS } from '../world'

// ===== Helpers =====

/** The shade as a lathe profile (x = radius, y = height, m). */
const shadeGeometry = () => {
  const points = [vec3(0.004, 0.17, 0), vec3(0.04, 0.165, 0), vec3(0.11, 0.1, 0), vec3(0.15, 0.03, 0), vec3(0.155, 0.02, 0)].map((p) => new THREE.Vector2(p.x, p.y))
  return new THREE.LatheGeometry(points, 28)
}

// ===== Component: Lantern =====

export const Lantern = () => {
  // --- Refs & state ---
  const bulbRef = useRef<THREE.MeshStandardMaterial>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const shade = useMemo(shadeGeometry, [])

  // --- Frame ---
  useFrame((_, dt) => {
    const ease = 1 - Math.exp(-6 * dt)
    if (bulbRef.current) bulbRef.current.emissiveIntensity += (0.3 + day.lamp * 9 - bulbRef.current.emissiveIntensity) * ease
    if (lightRef.current) lightRef.current.intensity += (day.lamp * 2.4 - lightRef.current.intensity) * ease
  })

  // --- Render ---
  return (
    <group position={[LAMP_POS[0], BENCH_TOP, LAMP_POS[2]]} scale={0.72}>
      {/* base, stem, shade */}
      <mesh position={[0, 0.01, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.1, 0.02, 24]} />
        <meshStandardMaterial color="#3a352c" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.38, 8]} />
        <meshStandardMaterial color="#3a352c" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.24, 0]} geometry={shade} castShadow>
        <meshStandardMaterial color="#c9b48a" metalness={0.7} roughness={0.35} side={THREE.DoubleSide} />
      </mesh>
      {/* bulb */}
      <mesh position={[0, 0.29, 0]}>
        <sphereGeometry args={[0.03, 14, 10]} />
        <meshStandardMaterial ref={bulbRef} color="#fff3dc" emissive="#ffcf8f" emissiveIntensity={0.3} toneMapped={false} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 0.27, 0]} color="#ffc27e" intensity={0} distance={5.5} decay={1.7} />
    </group>
  )
}
