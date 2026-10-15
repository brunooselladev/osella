'use client'

// Everything the DOM side of the bench remembers: which case is selected, whether the sheet is
// open and on which growth step, the lens (and whether the visitor locked it), which cases were
// visited this session, and the ?case= URL. It writes `live` so the canvas follows, and paints
// the root element's CSS hooks (--bench, data-lens, data-hero, data-door, data-sheet, the HUD).
// It also decides when the sheet opens and closes on its own: standing still on a case station
// for DWELL_MS opens it (whether the visitor scrolled there or the index walked them), leaving the
// station closes it (see the window constants below). Scrolling itself is never touched.

// ===== External modules =====
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// ===== Internal modules =====
import { fruitCopy } from '@/content/fruit'
import type { Lang, Lens } from '@/content/types'
import { live } from './bench-live'
import { casesVisitedAt, lensAt, nearestCaseStation, stationForCase } from './camera-path'
import { STEPS } from './sheet'
import type { BenchCase } from './types'

// ===== Constants =====

/** sessionStorage key for the visited cases. */
const VISIT_KEY = 'bo-fruit-visited'
/** The hero title shows below this progress. */
const HERO_UNTIL = 0.18
/** The door chrome shows from this progress. */
const DOOR_FROM = 0.9
/** The sheet opens when the walk is closer than this to a case station (progress units, 0..1). */
export const OPEN_WINDOW = 0.03
/** The sheet closes once the walk is farther than this from its station. Wider than OPEN_WINDOW so the edge never flickers. */
export const CLOSE_WINDOW = 0.05
/** The sheet opens after the walk has been still this long (ms) inside OPEN_WINDOW: passing through never opens, stopping does. */
const DWELL_MS = 600
/** Below this scroll velocity (px per frame, from Lenis) the walk counts as still. */
const VELOCITY_STILL = 0.5
/** While the walk is inside the window but not still yet, the dwell check runs again this often (ms). */
const DWELL_RETRY_MS = 60
/** How many frames (about a second) focus keeps returning to a close trigger that hides and shows again (the tag fades out while the sheet shrinks, then back in). */
const FOCUS_RETRY_FRAMES = 60

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

/**
 * Returns focus to `element` and keeps it there for a while: `focus()` on a hidden element is a
 * no-op, and an element that hides after taking focus loses it to the body. Stops as soon as the
 * visitor focuses something else (focus still sitting inside the sheet, inert by now, is not that).
 */
const returnFocus = (element: HTMLElement, framesLeft: number) => {
  const active = document.activeElement
  if (active && active !== element && active !== document.body && !active.closest('[inert]')) return
  if (active !== element && getComputedStyle(element).visibility !== 'hidden') element.focus({ preventScroll: true })
  if (framesLeft > 0) requestAnimationFrame(() => returnFocus(element, framesLeft - 1))
}

/** How far (progress units) the walk stands from a case's station; Infinity when the id is not a case. */
const distanceToStation = (progress: number, caseId: string | null) => {
  const station = caseId ? stationForCase(caseId) : undefined
  return station ? Math.abs(progress - station.progress) : Infinity
}

// ===== Hook: useBenchState =====

export const useBenchState = ({ cases, lang }: { cases: BenchCase[]; lang: Lang }) => {
  // --- Refs & state ---
  const rootRef = useRef<HTMLDivElement>(null)
  const hudRef = useRef<HTMLSpanElement>(null)
  /** The element that opened the sheet; focus goes back to it on close. */
  const triggerRef = useRef<HTMLElement | null>(null)
  /** Set by a user close: focus returns to the trigger once React has committed the closed sheet (the tag is inert while open). */
  const restoreFocusRef = useRef(false)
  /** Set when a focused control opened the sheet: focus moves to the title once the open sheet is committed. */
  const focusTitleRef = useRef(false)
  /** Mirrors `sheetOpen` for callbacks that run outside React's render. */
  const sheetOpenRef = useRef(false)
  /** The lens the visitor clicked, if any; the walk stops changing it. */
  const lensLockedRef = useRef<Lens | null>(null)
  /** The case whose sheet the visitor dismissed while standing at its station: it stays shut until they leave. */
  const heldClosedRef = useRef<string | null>(null)
  /** The station the walk is dwelling on, the timer that re-checks it, and the progress last seen by that check. */
  const dwellRef = useRef<{ caseId: string | null; timer: number; lastProgress: number }>({ caseId: null, timer: 0, lastProgress: -1 })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [lens, setLens] = useState<Lens>('business')
  const [visited, setVisited] = useState<Set<string>>(new Set())

  // --- Derived ---
  const active = useMemo(() => cases.find((item) => item.id === selectedId) ?? null, [cases, selectedId])

  /** Writes the walk's state onto the root element for the CSS and the HUD. Declared before the effects that call it. */
  const paint = useCallback(
    (progress: number, open: boolean, nextLens: Lens) => {
      const root = rootRef.current
      if (!root) return
      root.style.setProperty('--bench', progress.toFixed(4))
      root.dataset.lens = nextLens
      root.dataset.hero = progress < HERO_UNTIL && !open ? 'on' : 'off'
      root.dataset.door = progress >= DOOR_FROM && !open ? 'on' : 'off'
      root.dataset.sheet = open ? 'on' : 'off'
      if (hudRef.current) hudRef.current.textContent = `${progress.toFixed(2)} / ${fruitCopy(lang).hud}`
    },
    [lang],
  )

  // --- Effects ---
  // The committed state is the truth for the ref, `live` and the root's CSS hooks. Repainting here
  // matters: a scroll frame can paint from the ref while a render is still pending (StrictMode's
  // second effect run in dev wrote a stale `false` after a deep-link openSheet, and the DOM stayed
  // at data-sheet="off" with the sheet open), so the last run with the real value must win.
  useEffect(() => {
    sheetOpenRef.current = sheetOpen
    live.sheetOpen = sheetOpen
    paint(live.progress, sheetOpen, live.lens)
    if (!sheetOpen && restoreFocusRef.current) {
      restoreFocusRef.current = false
      if (triggerRef.current) returnFocus(triggerRef.current, FOCUS_RETRY_FRAMES)
    }
    if (sheetOpen && focusTitleRef.current) {
      focusTitleRef.current = false
      document.getElementById('sheet-title')?.focus({ preventScroll: true })
    }
  }, [paint, sheetOpen])

  useEffect(() => {
    live.selectedId = selectedId
  }, [selectedId])

  useEffect(() => {
    setVisited(readVisited())
  }, [])

  useEffect(() => () => window.clearTimeout(dwellRef.current.timer), [])

  // --- Methods ---
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

  const shut = useCallback(
    (restoreFocus: boolean) => {
      sheetOpenRef.current = false
      setSheetOpen(false)
      live.sheetOpen = false
      goStep(0)
      setCaseParam(null)
      restoreFocusRef.current = restoreFocus
      paint(live.progress, false, live.lens)
    },
    [goStep, paint],
  )

  /** Opens the sheet for a case right away (a click on the fruit, the tag, the index at its station, a deep link). */
  const openSheet = useCallback(
    (id: string) => {
      if (!stationForCase(id)) return
      heldClosedRef.current = null
      window.clearTimeout(dwellRef.current.timer)
      dwellRef.current.caseId = null
      // a focused control (index, tag, keyboard) is the trigger: focus follows into the sheet and comes back on close.
      // The walk, a canvas click or a deep link leave focus where it was, so no focus ring lands on the title.
      const trigger = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null
      triggerRef.current = trigger
      focusTitleRef.current = trigger !== null
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

  /** The visitor closed the sheet (Esc, the close button, the dismiss area): it stays shut until they leave the station. */
  const closeSheet = useCallback(() => {
    heldClosedRef.current = live.selectedId
    shut(true)
  }, [shut])

  /** Keeps a case's sheet shut while the walk stands at its station (the ?frame= captures without a sheet). */
  const holdClosed = useCallback((id: string) => {
    heldClosedRef.current = id
  }, [])

  /** The index is walking the visitor to `id`: a sheet they dismissed there may open again on arrival. */
  const walkTo = useCallback((id: string) => {
    if (heldClosedRef.current === id) heldClosedRef.current = null
  }, [])

  /** Forgets the station the walk was dwelling on and its pending check. */
  const stopDwelling = useCallback(() => {
    const dwell = dwellRef.current
    window.clearTimeout(dwell.timer)
    dwell.caseId = null
    dwell.timer = 0
  }, [])

  /**
   * Runs DWELL_MS after the last progress change inside a station's window, then every
   * DWELL_RETRY_MS until the walk is still: the scroll stops reporting progress once it stops
   * moving, so the last check has to come from a timer. Opens the sheet when the walk is still
   * and still inside the window.
   */
  const checkDwell = useCallback(() => {
    const dwell = dwellRef.current
    const caseId = dwell.caseId
    if (!caseId || sheetOpenRef.current) return
    if (distanceToStation(live.progress, caseId) >= OPEN_WINDOW || heldClosedRef.current === caseId) return
    // still: Lenis reports no velocity, or progress has not moved since the last check (the velocity can lag a frame)
    const still = Math.abs(live.velocity) < VELOCITY_STILL || live.progress === dwell.lastProgress
    dwell.lastProgress = live.progress
    if (!still) {
      dwell.timer = window.setTimeout(checkDwell, DWELL_RETRY_MS)
      return
    }
    stopDwelling()
    openSheet(caseId)
  }, [openSheet, stopDwelling])

  /**
   * The one rule that opens and closes the sheet from progress, with hysteresis: standing still
   * inside OPEN_WINDOW of a case station for DWELL_MS opens its sheet (a scroll that stops there,
   * or the index walk ending there); any open sheet closes beyond CLOSE_WINDOW of its station.
   * Passing through is silent: every change inside the window restarts the clock, leaving it
   * cancels it. Clicks (fruit, tag, index at its station) skip the dwell: see openSheet.
   */
  const syncSheetToProgress = useCallback(
    (progress: number) => {
      if (sheetOpenRef.current) {
        if (distanceToStation(progress, live.selectedId) > CLOSE_WINDOW) shut(false)
        return
      }
      // a dismissed sheet is forgiven once the walk leaves its station
      if (heldClosedRef.current && distanceToStation(progress, heldClosedRef.current) > CLOSE_WINDOW) heldClosedRef.current = null
      const station = nearestCaseStation(progress)
      const caseId = station.caseId as string
      const inside = Math.abs(progress - station.progress) < OPEN_WINDOW && heldClosedRef.current !== caseId
      const dwell = dwellRef.current
      if (!inside) {
        if (dwell.caseId) stopDwelling()
        return
      }
      window.clearTimeout(dwell.timer)
      dwell.caseId = caseId
      dwell.lastProgress = progress
      dwell.timer = window.setTimeout(checkDwell, DWELL_MS)
    },
    [checkDwell, shut, stopDwelling],
  )

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
      syncSheetToProgress(next)
    },
    [markVisited, paint, syncSheetToProgress],
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
    openSheet,
    closeSheet,
    holdClosed,
    walkTo,
    goStep,
    highlight,
    lockLens,
    markVisited,
  }
}
