'use client'

// The two potting benches, one mesh with per-piece wood tones.

// ===== External modules =====
import { useMemo } from 'react'

// ===== Internal modules =====
import { woodTex } from '../textures'
import { benchGeometry } from './bench-geometry'

// ===== Component: Benches =====

export const Benches = () => {
  // --- Refs & state ---
  const geometry = useMemo(benchGeometry, [])
  const wood = woodTex('bench')

  // --- Render ---
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial map={wood} vertexColors roughness={0.82} />
    </mesh>
  )
}
