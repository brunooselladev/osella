import type { Lens } from '@/content/types'

export type BenchLive = {
  progress: number
  velocity: number
  selectedId: string | null
  sheetOpen: boolean
  // reading the case inside the sheet; step 0..4 = seed, roots, stem, bloom, fruit
  reading: boolean
  step: number
  lens: Lens
  // true once the visitor picks a lens: the light stops following the walk
  lensLocked: boolean
  reduce: boolean
  hoverId: string | null
}

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
