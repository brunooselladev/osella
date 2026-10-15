// Adaptive quality (spec §12). When the frame rate drops we step down a tier, never touching the
// look's shaders, only resolution and the costliest buffers. 0 = full, 2 = lightest.
// QualityRig moves the tier; DayRig, Post and the glass fruit read it.

// ===== External modules =====
import { useSyncExternalStore } from 'react'

// ===== Types =====

export type Tier = {
  /** Device pixel ratio cap. */
  dpr: number
  /** Resolution of the buffer the glass fruit refracts (px). */
  transmissionRes: number
  /** Ambient occlusion at half resolution. */
  aoHalfRes: boolean
  /** Depth-of-field bokeh size; 0 disables the effect's blur. */
  bokeh: number
  /** Sun shadow map size (px). */
  shadowMap: number
}

// ===== Constants =====

// Tier 0 used to be dpr 2, transmission 768 and full-res AO; a GTX-class card could not hold it.
export const TIERS: Tier[] = [
  { dpr: 1.5, transmissionRes: 512, aoHalfRes: true, bokeh: 1.1, shadowMap: 2048 },
  { dpr: 1.25, transmissionRes: 384, aoHalfRes: true, bokeh: 1.1, shadowMap: 2048 },
  { dpr: 1, transmissionRes: 320, aoHalfRes: true, bokeh: 0, shadowMap: 1024 },
]

// A minimal external store: one number and its subscribers.
let tier = 0
const subscribers = new Set<() => void>()

// ===== Helpers =====

export const getTier = () => tier

export const setTier = (next: number) => {
  const clamped = Math.max(0, Math.min(TIERS.length - 1, next))
  if (clamped === tier) return
  tier = clamped
  subscribers.forEach((notify) => notify())
}

// ===== Hook: useTier =====

/** The current tier as React state; re-renders the caller when it changes. */
export const useTier = () =>
  useSyncExternalStore(
    (notify) => {
      subscribers.add(notify)
      return () => subscribers.delete(notify)
    },
    () => tier,
    () => 0,
  )
