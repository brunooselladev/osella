'use client'

// The brick knee walls, the limewashed end wall and the stone coping. The walls are occluders:
// FocusRig hides the DOM tag when one of them is between the camera and the specimen.

// ===== External modules =====
import { useMemo } from 'react'

// ===== Internal modules =====
import { brickTex, bumpTex } from '../textures'
import { copingGeometry, endWallGeometry, wallGeometry } from './masonry-geometry'

// ===== Component: Masonry =====

export const Masonry = () => {
  // --- Refs & state ---
  const walls = useMemo(wallGeometry, [])
  const endWall = useMemo(endWallGeometry, [])
  const coping = useMemo(copingGeometry, [])
  const brick = brickTex(0)
  const lime = brickTex(1)
  const stone = bumpTex(5, 12)

  // --- Render ---
  return (
    <group>
      <mesh geometry={walls} castShadow receiveShadow userData={{ occluder: true }}>
        <meshStandardMaterial map={brick} roughness={0.92} bumpMap={brick} bumpScale={1.2} />
      </mesh>
      <mesh geometry={endWall} castShadow receiveShadow userData={{ occluder: true }}>
        <meshStandardMaterial map={lime} roughness={0.95} bumpMap={lime} bumpScale={1.2} />
      </mesh>
      <mesh geometry={coping} castShadow receiveShadow>
        <meshStandardMaterial color="#d9cfbd" roughness={0.9} bumpMap={stone} bumpScale={1} />
      </mesh>
    </group>
  )
}
