// The bridge between the DOM and the canvas: one mutable object the DOM writes (BenchApp, the
// scroll hook) and every useFrame reads. No React state here on purpose: the canvas runs at
// 60 fps and must never re-render React to learn where the visitor is.

// ===== Internal modules =====
import type { Lens } from '@/content/types'

// ===== Types =====

export type BenchLive = {
  /** Where on the walk, 0 at the entrance, 1 at the door. */
  progress: number
  /** Scroll velocity from Lenis; spins the specimens. */
  velocity: number
  selectedId: string | null
  sheetOpen: boolean
  /** Reading the case inside the sheet; step 0..4 = seed, roots, stem, bloom, fruit. */
  reading: boolean
  step: number
  lens: Lens
  /** True once the visitor picks a lens: the light stops following the walk. */
  lensLocked: boolean
  /** prefers-reduced-motion: snap to stations, no continuous motion. */
  reduce: boolean
  hoverId: string | null
}

// ===== Constants =====

export const live: BenchLive = {
  progress: 0,
  velocity: 0,
  selectedId: null,
  sheetOpen: false,
  reading: false,
  step: 0,
  lens: 'business',
  lensLocked: false,
  reduce: false,
  hoverId: null,
}
