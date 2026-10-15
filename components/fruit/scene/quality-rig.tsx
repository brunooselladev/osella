'use client'

// Steps the quality tier down when frames drop and back up when they recover, and applies the
// tier's pixel ratio. The look's shaders never change; only resolution and buffers do. The
// monitor only runs while the room is active: idle frames are deliberately slow (FrameRateRig).

// ===== External modules =====
import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'

// ===== Internal modules =====
import { hasFlag } from '../lookdev'
import { getTier, setTier, TIERS, useTier } from '../quality'
import { useActive } from './activity'

// ===== Component: QualityRig =====

export const QualityRig = () => {
  // --- Refs & state ---
  const tier = useTier()
  const active = useActive()
  const setDpr = useThree((state) => state.setDpr)

  // --- Effects ---
  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio || 1, TIERS[tier].dpr))
    if (hasFlag('perf')) Object.assign(window, { __benchTier: tier })
  }, [setDpr, tier])

  // --- Render ---
  if (!active) return null
  return (
    <PerformanceMonitor
      flipflops={3}
      onDecline={() => setTier(getTier() + 1)}
      onIncline={() => setTier(getTier() - 1)}
      onFallback={() => setTier(TIERS.length - 1)}
    />
  )
}
