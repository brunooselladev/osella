'use client'

// Drives the render loop. The Canvas never renders on its own (frameloop="never"); this rig
// advances it on every animation frame while something is happening, and only IDLE_FPS times a
// second while nothing is. Dust, shafts and the glass fruit keep moving at the idle rate;
// everything else is still anyway. Scroll, pointer and keys count as "something happening"
// (see activity.ts). Mounted once the shaders are compiled.

// ===== External modules =====
import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

// ===== Internal modules =====
import { isActive, markInput, setActive } from './activity'

// ===== Constants =====

/** Frames per second while nothing moves. */
export const IDLE_FPS = 30
/** Minimum gap between idle frames (ms), a touch under the exact value so rAF timing lands on it. */
const IDLE_GAP = 1000 / IDLE_FPS - 1
/** DOM events that mean the visitor is doing something. */
const INPUT_EVENTS = ['pointermove', 'pointerdown', 'wheel', 'touchmove', 'keydown'] as const

// ===== Component: FrameRateRig =====

export const FrameRateRig = () => {
  // --- Refs & state ---
  const advance = useThree((state) => state.advance)
  const clock = useThree((state) => state.clock)

  // --- Effects ---
  useEffect(() => {
    for (const type of INPUT_EVENTS) window.addEventListener(type, markInput, { passive: true })
    markInput()
    let request = 0
    let lastFrame = 0
    let seeded = false
    const loop = (time: number) => {
      request = requestAnimationFrame(loop)
      // R3F takes the timestamp in seconds here, and measures dt against the clock's elapsedTime.
      // Seed it on the first tick, or the first dt would be the seconds since page load and every
      // damped motion would snap to its target instead of easing in.
      const seconds = time / 1000
      if (!seeded) {
        seeded = true
        clock.elapsedTime = seconds
        clock.oldTime = seconds
        return
      }
      const active = isActive()
      setActive(active)
      if (!active && time - lastFrame < IDLE_GAP) return
      lastFrame = time
      advance(seconds)
    }
    request = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(request)
      for (const type of INPUT_EVENTS) window.removeEventListener(type, markInput)
    }
  }, [advance, clock])

  // --- Render ---
  return null
}
