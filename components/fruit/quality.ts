import { useSyncExternalStore } from 'react'

// Adaptive quality (spec §12): when the frame rate drops we step down, never touching the look's
// shaders, only resolution and the costliest buffers. 0 = full, 2 = lightest.

export type Tier = { dpr: number; glass: number; aoHalf: boolean; bokeh: number; shadow: number }

export const TIERS: Tier[] = [
  { dpr: 2, glass: 768, aoHalf: false, bokeh: 1.1, shadow: 2048 },
  { dpr: 1.5, glass: 512, aoHalf: true, bokeh: 1.1, shadow: 2048 },
  { dpr: 1, glass: 320, aoHalf: true, bokeh: 0, shadow: 1024 },
]

let tier = 0
const subs = new Set<() => void>()

export function getTier() {
  return tier
}

export function setTier(next: number) {
  const clamped = Math.max(0, Math.min(TIERS.length - 1, next))
  if (clamped === tier) return
  tier = clamped
  subs.forEach((fn) => fn())
}

export function useTier() {
  return useSyncExternalStore(
    (fn) => {
      subs.add(fn)
      return () => subs.delete(fn)
    },
    () => tier,
    () => 0,
  )
}
