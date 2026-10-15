'use client'

// The two leaves of the entrance door, standing open at different angles. Iron frame with a pane
// of lightly washed glass each.

// ===== External modules =====
import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'

// ===== Internal modules =====
import { Builder, QuadBuilder } from '../build'
import { initGlass, makeGlassMaterial, syncGlass } from '../glass'
import { rng } from '../textures'
import { vec3 } from '../vec'
import { ENTRY_H, ENTRY_W } from '../world'

// ===== Constants =====

/** Leaf width and height (m). */
const LEAF_W = ENTRY_W / 2 - 0.02
const LEAF_H = ENTRY_H - 0.04
/** How open each leaf stands (radians about y): left, right. */
const LEAF_ANGLE = { left: 1.92, right: 1.22 }

// ===== Helpers =====

/** Stiles, rails and the cross in the upper pane. */
const leafFrameGeometry = () => {
  const builder = new Builder()
  builder.box(0.05, LEAF_H, 0.04, [0.025, LEAF_H / 2, 0]) // hinge stile
  builder.box(0.05, LEAF_H, 0.04, [LEAF_W - 0.025, LEAF_H / 2, 0]) // lock stile
  builder.box(LEAF_W, 0.06, 0.04, [LEAF_W / 2, LEAF_H - 0.03, 0]) // top rail
  builder.box(LEAF_W, 0.06, 0.04, [LEAF_W / 2, 0.03, 0]) // bottom rail
  builder.box(LEAF_W, 0.06, 0.04, [LEAF_W / 2, 0.85, 0]) // lock rail
  builder.box(0.025, LEAF_H - 0.9, 0.03, [LEAF_W / 2, (LEAF_H + 0.88) / 2, 0]) // muntins
  builder.box(LEAF_W - 0.06, 0.03, 0.03, [LEAF_W / 2, (LEAF_H + 0.88) / 2, 0])
  return builder.merge()
}

/** The upper pane (seed 0.97: nearly clean glass). */
const leafPaneGeometry = () => {
  const quads = new QuadBuilder(rng(3))
  quads.quad(vec3(0.05, 0.88, 0), vec3(LEAF_W - 0.05, 0.88, 0), vec3(LEAF_W - 0.05, LEAF_H - 0.06, 0), vec3(0.05, LEAF_H - 0.06, 0), 0.97)
  return quads.geometry()
}

// ===== Component: EntranceLeaves =====

export const EntranceLeaves = () => {
  // --- Refs & state ---
  const frame = useMemo(leafFrameGeometry, [])
  const pane = useMemo(leafPaneGeometry, [])
  const material = useMemo(() => makeGlassMaterial(0.35), [])

  // --- Effects ---
  useEffect(() => initGlass(material), [material])

  // --- Frame ---
  useFrame(() => syncGlass(material))

  // --- Render ---
  return (
    <>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (ENTRY_W / 2), 0, -0.04]} rotation-y={side > 0 ? LEAF_ANGLE.right : LEAF_ANGLE.left}>
          <mesh geometry={frame} castShadow>
            <meshStandardMaterial color="#2f322a" roughness={0.5} metalness={0.3} />
          </mesh>
          <mesh geometry={pane} material={material} renderOrder={2} />
        </group>
      ))}
    </>
  )
}
