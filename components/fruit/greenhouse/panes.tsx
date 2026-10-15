'use client'

// All the greenhouse glass, one mesh with the whitewash shader, kept in sync with the day.

// ===== External modules =====
import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'

// ===== Internal modules =====
import { initGlass, makeGlassMaterial, syncGlass } from '../glass'
import { paneGeometry } from './pane-geometry'

// ===== Component: Panes =====

export const Panes = () => {
  // --- Refs & state ---
  const geometry = useMemo(paneGeometry, [])
  const material = useMemo(() => makeGlassMaterial(), [])

  // --- Effects ---
  useEffect(() => initGlass(material), [material])

  // --- Frame ---
  useFrame(() => syncGlass(material))

  // --- Render ---
  return <mesh geometry={geometry} material={material} renderOrder={2} />
}
