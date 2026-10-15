'use client'

// The cast-iron structure, one mesh. An occluder for the DOM tag (posts can hide a specimen).

// ===== External modules =====
import { useMemo } from 'react'
import * as THREE from 'three'

// ===== Internal modules =====
import { frameGeometry } from './frame-geometry'

// ===== Component: Frame =====

export const Frame = () => {
  // --- Refs & state ---
  const geometry = useMemo(frameGeometry, [])

  // --- Render ---
  return (
    <mesh geometry={geometry} castShadow receiveShadow userData={{ occluder: true }}>
      <meshStandardMaterial color="#2f322a" roughness={0.5} metalness={0.3} side={THREE.DoubleSide} />
    </mesh>
  )
}
