'use client'

// Keyboard shortcuts for the bench. Esc closes the sheet; ← → change the growth stage while
// reading; 1..4 inside THE BENCH index select a case; b / e / d inside the lenses lock a lens.

// ===== External modules =====
import { useEffect } from 'react'

// ===== Internal modules =====
import type { Lens } from '@/content/types'
import { live } from './bench-live'
import type { BenchCase } from './types'

// ===== Types =====

type Options = {
  cases: BenchCase[]
  selectCase: (id: string) => void
  closeSheet: () => void
  goStep: (step: number) => void
  lockLens: (lens: Lens) => void
}

// ===== Constants =====

const LENS_KEYS: Record<string, Lens> = { b: 'business', e: 'engineering', d: 'delivery' }

// ===== Hook: useBenchKeys =====

export const useBenchKeys = ({ cases, selectCase, closeSheet, goStep, lockLens }: Options) => {
  // --- Effects ---
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && live.sheetOpen) {
        event.preventDefault()
        closeSheet()
        return
      }
      if (live.sheetOpen && live.reading && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
        event.preventDefault()
        goStep(live.step + 1 + (event.key === 'ArrowRight' ? 1 : -1))
        return
      }
      const target = event.target
      if (!(target instanceof Element)) return
      const inIndex = target.closest('[data-bench-index]')
      const inLenses = target.closest('[data-bench-lenses]')
      if (inIndex && /^[1-4]$/.test(event.key)) {
        event.preventDefault()
        const item = cases[Number(event.key) - 1]
        if (item) selectCase(item.id)
      }
      if (inLenses) {
        const next = LENS_KEYS[event.key.toLowerCase()]
        if (next) {
          event.preventDefault()
          lockLens(next)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cases, closeSheet, goStep, lockLens, selectCase])
}
