'use client'

// Everything the DOM side of the bench remembers: which case is selected, whether the sheet is
// open and on which growth step, the lens (and whether the visitor locked it), which cases were
// visited this session, and the ?case= URL. It writes `live` so the canvas follows, and paints
// the root element's CSS hooks (--bench, data-lens, data-hero, data-door, the HUD).

// ===== External modules =====
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// ===== Internal modules =====
import { fruitCopy } from '@/content/fruit'
import type { Lang, Lens } from '@/content/types'
import { live } from './bench-live'
import { casesVisitedAt, lensAt, stationForCase } from './camera-path'
import { STEPS } from './sheet'
import type { BenchCase } from './types'

// ===== Constants =====

/** sessionStorage key for the visited cases. */
const VISIT_KEY = 'bo-fruit-visited'
/** The hero title shows below this progress. */
const HERO_UNTIL = 0.18
/** The door chrome shows from this progress. */
const DOOR_FROM = 0.9

// ===== Helpers =====

const readVisited = (): Set<string> => {
  try {
    const raw = sessionStorage.getItem(VISIT_KEY)
    const parsed = raw ? (JSON.parse(raw) as string[]) : []
    return new Set(parsed)
  } catch {
    return new Set()
  }
}

const writeVisited = (visited: Set<string>) => {
  sessionStorage.setItem(VISIT_KEY, JSON.stringify([...visited]))
}

/** Keeps ?case= in the address bar in sync with the open sheet, without a navigation. */
const setCaseParam = (id: string | null) => {
  const url = new URL(window.location.href)
  if (id) url.searchParams.set('case', id)
  else url.searchParams.delete('case')
  window.history.replaceState(null, '', url)
}

// ===== Hook: useBenchState =====

export const useBenchState = ({ cases, lang }: { cases: BenchCase[]; lang: Lang }) => {
  // --- Refs & state ---
  const rootRef = useRef<HTMLDivElement>(null)
  const hudRef = useRef<HTMLSpanElement>(null)
  /** The element that opened the sheet; focus goes back to it on close. */
  const triggerRef = useRef<HTMLElement | null>(null)
  /** Mirrors `sheetOpen` for callbacks that run outside React's render. */
  const sheetOpenRef = useRef(false)
  /** The lens the visitor clicked, if any; the walk stops changing it. */
  const lensLockedRef = useRef<Lens | null>(null)
  /** Until this time (ms) a user scroll is ignored, so a programmatic walk does not close the sheet. */
  const quietUntil = useRef(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [lens, setLens] = useState<Lens>('business')
  const [visited, setVisited] = useState<Set<string>>(new Set())

  // --- Derived ---
  const active = useMemo(() => cases.find((item) => item.id === selectedId) ?? null, [cases, selectedId])

  // --- Effects ---
  useEffect(() => {
    sheetOpenRef.current = sheetOpen
    live.sheetOpen = sheetOpen
  }, [sheetOpen])

  useEffect(() => {
    live.selectedId = selectedId
  }, [selectedId])

  useEffect(() => {
    setVisited(readVisited())
  }, [])

  // --- Methods ---
  /** Writes the walk's state onto the root element for the CSS and the HUD. */
  const paint = useCallback(
    (progress: number, open: boolean, nextLens: Lens) => {
      const root = rootRef.current
      if (!root) return
      root.style.setProperty('--bench', progress.toFixed(4))
      root.dataset.lens = nextLens
      root.dataset.hero = progress < HERO_UNTIL && !open ? 'on' : 'off'
      root.dataset.door = progress >= DOOR_FROM && !open ? 'on' : 'off'
      if (hudRef.current) hudRef.current.textContent = `${progress.toFixed(2)} / ${fruitCopy(lang).hud}`
    },
    [lang],
  )

  const markVisited = useCallback((ids: string[]) => {
    if (!ids.length) return
    setVisited((prev) => {
      const next = new Set(prev)
      let changed = false
      for (const id of ids) {
        if (!next.has(id)) {
          next.add(id)
          changed = true
        }
      }
      if (changed) writeVisited(next)
      return changed ? next : prev
    })
  }, [])

  /** Moves the sheet to a step (0 = the card) and tells the canvas. */
  const goStep = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(STEPS, next))
    setStep(clamped)
    live.reading = clamped > 0
    live.step = Math.max(0, clamped - 1)
  }, [])

  /** Ignores user scrolls for a while (a programmatic walk is about to move the page). */
  const hush = useCallback((ms = 1300) => {
    quietUntil.current = Date.now() + ms
  }, [])

  /** Lights a specimen up (index hover, canvas hover) without walking or opening anything. */
  const highlight = useCallback((id: string) => {
    setSelectedId(id)
    live.selectedId = id
  }, [])

  /** The visitor picked a lens: the whole room goes to that light and stays there. */
  const lockLens = useCallback((next: Lens) => {
    lensLockedRef.current = next
    live.lensLocked = true
    live.lens = next
    setLens(next)
  }, [])

  /** Called on every scroll frame with the new progress. */
  const applyProgress = useCallback(
    (value: number) => {
      const next = Math.max(0, Math.min(1, value))
      live.progress = next
      const nextLens = lensLockedRef.current ?? lensAt(next)
      live.lens = nextLens
      live.sheetOpen = sheetOpenRef.current
      paint(next, sheetOpenRef.current, nextLens)
      setLens((prev) => (prev === nextLens ? prev : nextLens))
      markVisited(casesVisitedAt(next))
    },
    [markVisited, paint],
  )

  const shut = useCallback(
    (restoreFocus: boolean) => {
      sheetOpenRef.current = false
      setSheetOpen(false)
      live.sheetOpen = false
      goStep(0)
      setCaseParam(null)
      if (restoreFocus) triggerRef.current?.focus()
      paint(live.progress, false, live.lens)
    },
    [goStep, paint],
  )

  const closeSheet = useCallback(() => shut(true), [shut])

  /** A real user scroll closes the sheet, unless a programmatic walk is in flight. */
  const onUserScroll = useCallback(() => {
    if (Date.now() < quietUntil.current) return
    if (sheetOpenRef.current) shut(false)
  }, [shut])

  const openSheet = useCallback(
    (id: string) => {
      if (!stationForCase(id)) return
      triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      setSelectedId(id)
      setSheetOpen(true)
      goStep(0)
      live.selectedId = id
      live.sheetOpen = true
      sheetOpenRef.current = true
      markVisited([id])
      setCaseParam(id)
      paint(live.progress, true, live.lens)
    },
    [goStep, markVisited, paint],
  )

  return {
    rootRef,
    hudRef,
    sheetOpenRef,
    selectedId,
    sheetOpen,
    step,
    lens,
    visited,
    active,
    applyProgress,
    onUserScroll,
    openSheet,
    closeSheet,
    goStep,
    hush,
    highlight,
    lockLens,
    markVisited,
  }
}
