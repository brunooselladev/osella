'use client'

// Waits for the textures, compiles every shader off the main thread, then renders a few frames
// while the canvas is still hidden (post-processing and shadow shaders compile on first use),
// and only then lets the room fade in. Mounted last, so its effect runs after fog, environment
// and lights are in place.

// ===== External modules =====
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ===== Internal modules =====
import { hasFlag } from '../lookdev'
import { texturesReady } from '../textures'

// ===== Constants =====

/** Hidden frames rendered before the fade-in. */
const HIDDEN_FRAMES = 3

// ===== Component: Warmup =====

export const Warmup = ({ onReady, onShown }: { onReady: () => void; onShown: () => void }) => {
  // --- Refs & state ---
  const { gl, scene, camera } = useThree()
  /** Frames rendered since the shaders compiled; -1 while still compiling. */
  const frames = useRef(-1)

  // --- Frame ---
  useFrame(() => {
    if (frames.current < 0) return
    frames.current += 1
    if (frames.current === HIDDEN_FRAMES) onShown()
  })

  // --- Effects ---
  useEffect(() => {
    let alive = true
    const done = () => {
      if (hasFlag('perf')) Object.assign(window, { __benchWarm: gl.info.programs?.map((program) => program.name) ?? [], __warmKeys: gl.info.programs?.map((program) => program.cacheKey) ?? [] })
      if (!alive) return
      frames.current = 0
      requestAnimationFrame(onReady)
    }
    // The composer renders the scene into a linear HDR target, not the screen; shader variants
    // depend on that (tone mapping, output colour space), so compile against such a target.
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType })
    texturesReady()
      .then(() => {
        const previous = gl.getRenderTarget()
        gl.setRenderTarget(target)
        const compiling = gl.compileAsync(scene, camera)
        gl.setRenderTarget(previous)
        return compiling
      })
      .then(done, done)
      .finally(() => target.dispose())
    return () => {
      alive = false
    }
  }, [camera, gl, onReady, scene])

  // --- Render ---
  return null
}
