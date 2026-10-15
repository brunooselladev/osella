'use client'

// The ground: herringbone brick down the aisle and out through the entrance, gravel under the
// benches, a drain channel, and the bare earth outside.

// ===== External modules =====
import { useMemo } from 'react'

// ===== Internal modules =====
import { bumpTex, herringboneTex, soilTex } from '../textures'
import { BENCH_IN, ENTRY_W, HALF, LENGTH } from '../world'

// ===== Constants =====

/** Herringbone texture tile (m). */
const BRICK_TILE = 0.8

// ===== Component: Floor =====

export const Floor = () => {
  // --- Refs & state ---
  const aisle = useMemo(() => {
    const texture = herringboneTex().clone()
    texture.repeat.set((BENCH_IN * 2) / BRICK_TILE, LENGTH / BRICK_TILE)
    texture.needsUpdate = true
    return texture
  }, [])
  const path = useMemo(() => {
    const texture = herringboneTex().clone()
    texture.repeat.set(ENTRY_W / BRICK_TILE, 7 / BRICK_TILE)
    texture.needsUpdate = true
    return texture
  }, [])
  const gravel = useMemo(() => {
    const texture = soilTex().clone()
    texture.repeat.set(2, 30)
    texture.needsUpdate = true
    return texture
  }, [])
  const earth = useMemo(() => {
    const texture = bumpTex(71, 8).clone()
    texture.repeat.set(30, 30)
    texture.needsUpdate = true
    return texture
  }, [])

  // --- Render ---
  return (
    <group>
      {/* aisle */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, LENGTH / 2]} receiveShadow>
        <planeGeometry args={[BENCH_IN * 2, LENGTH]} />
        <meshStandardMaterial map={aisle} roughness={0.86} color="#e8d4bf" />
      </mesh>
      {/* gravel under the benches */}
      {[-1, 1].map((side) => (
        <mesh key={side} rotation-x={-Math.PI / 2} position={[side * (BENCH_IN + (HALF - BENCH_IN) / 2), 0.001, LENGTH / 2]} receiveShadow>
          <planeGeometry args={[HALF - BENCH_IN, LENGTH]} />
          <meshStandardMaterial map={gravel} roughness={1} color="#d8c3a6" />
        </mesh>
      ))}
      {/* path out through the entrance */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.003, -3.5]} receiveShadow>
        <planeGeometry args={[ENTRY_W, 7]} />
        <meshStandardMaterial map={path} roughness={0.9} color="#e8d4bf" />
      </mesh>
      {/* earth outside */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 8]} receiveShadow>
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial color="#c9b48c" roughness={1} bumpMap={earth} bumpScale={0.6} />
      </mesh>
      {/* drain channel down the aisle */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, LENGTH / 2]} receiveShadow>
        <planeGeometry args={[0.1, LENGTH - 0.4]} />
        <meshStandardMaterial color="#3a3029" roughness={0.6} metalness={0.4} />
      </mesh>
    </group>
  )
}
