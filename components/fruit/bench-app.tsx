'use client'

// The DOM root of The Bench. Composes the state, the scroll, the keyboard, the chrome, the sheet
// and the (lazy, client-only) canvas, and handles the ?frame= and ?case= deep links at boot.

// ===== External modules =====
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

// ===== Internal modules =====
import { fruitCopy } from '@/content/fruit'
import { useLanguage } from '@/components/language-provider'
import { live } from './bench-live'
import { stationForCase } from './camera-path'
import { FruitChrome } from './chrome'
import { FruitCursor } from './cursor'
import { FruitDoor } from './door'
import { FruitFallback } from './fallback'
import { FruitLoader } from './loader'
import { FruitSheet } from './sheet'
import type { BenchCase, BenchCopy } from './types'
import { useBenchKeys } from './use-bench-keys'
import { useBenchScroll } from './use-bench-scroll'
import { useBenchState } from './use-bench-state'

// ===== Types =====

type Frame = { progress: number; caseId?: string; sheet: boolean }

// ===== Constants =====

/** The canvas loads only on the client, after the DOM is up. */
const FruitScene = dynamic(() => import('./scene').then((mod) => mod.FruitScene), { ssr: false })

/** The board's four frames (`?frame=01..04`): where the walk stands and what is open. */
const FRAMES: Record<string, Frame> = {
  '01': { progress: 0, sheet: false },
  '02': { progress: 0.4, caseId: 'devias', sheet: false },
  '03': { progress: 0.08, caseId: 'bucked-up', sheet: true },
  '04': { progress: 1, sheet: false },
}

// ===== Component: BenchApp =====

export const BenchApp = ({ cases, copy }: { cases: BenchCase[]; copy: BenchCopy }) => {
  // --- Refs & state ---
  const { lang, setLang } = useLanguage()
  const searchParams = useSearchParams()
  const frameParam = searchParams.get('frame')
  const caseParam = searchParams.get('case')
  const { rootRef, hudRef, sheetOpenRef, selectedId, sheetOpen, step, lens, visited, active, applyProgress, onUserScroll, openSheet, closeSheet, goStep, hush, highlight, lockLens, markVisited } = useBenchState({ cases, lang })
  const { pinRef, scrollToProgress } = useBenchScroll({ onProgress: applyProgress, onUserScroll })
  /** The case armed by a first click on the index; a second click opens its sheet. */
  const armedId = useRef<string | null>(null)
  const booted = useRef(false)
  const [useGl, setUseGl] = useState(true)
  const [sceneShown, setSceneShown] = useState(false)

  // --- Derived ---
  const ui = fruitCopy(lang)

  // --- Methods ---
  const onSceneShown = useCallback(() => setSceneShown(true), [])
  const onSceneFail = useCallback(() => setUseGl(false), [])

  /** The skip-list: first click walks to the station, second click (or Enter again) opens the sheet. */
  const selectCase = useCallback(
    (id: string) => {
      const station = stationForCase(id)
      if (!station) return
      highlight(id)
      if (armedId.current === id) {
        openSheet(id)
        armedId.current = null
        return
      }
      armedId.current = id
      if (sheetOpenRef.current) closeSheet()
      hush()
      scrollToProgress(station.progress)
    },
    [closeSheet, highlight, hush, openSheet, scrollToProgress, sheetOpenRef],
  )

  /** Canvas hover: lights the specimen up, unless the sheet is open. */
  const onHover = useCallback(
    (id: string | null) => {
      live.hoverId = id
      if (id && !sheetOpenRef.current) highlight(id)
    },
    [highlight, sheetOpenRef],
  )

  /** Canvas click: straight to the sheet. */
  const onPick = useCallback(
    (id: string) => {
      highlight(id)
      openSheet(id)
    },
    [highlight, openSheet],
  )

  /** Index hover or focus: lights the specimen up, unless the sheet is open. */
  const onHighlight = useCallback(
    (id: string) => {
      if (!sheetOpenRef.current) highlight(id)
    },
    [highlight, sheetOpenRef],
  )

  useBenchKeys({ cases, selectCase, closeSheet, goStep, lockLens })

  // --- Effects ---
  // Is there WebGL at all? Otherwise the static frames stand in for the room.
  useEffect(() => {
    const canvas = document.createElement('canvas')
    setUseGl(Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl')))
  }, [])

  // Deep links, once: ?frame=01..04 reproduces a board frame, ?case= opens a sheet at its station.
  useEffect(() => {
    if (booted.current) return
    booted.current = true
    const framed = frameParam ? FRAMES[frameParam] : undefined
    hush(400)
    if (framed) {
      scrollToProgress(framed.progress, 0)
      applyProgress(framed.progress)
      if (framed.caseId) highlight(framed.caseId)
      if (framed.sheet && framed.caseId) openSheet(framed.caseId)
      if (framed.progress >= 1) markVisited(cases.map((item) => item.id))
      return
    }
    const station = caseParam ? stationForCase(caseParam) : undefined
    if (caseParam && station) {
      scrollToProgress(station.progress, 0)
      applyProgress(station.progress)
      openSheet(caseParam)
    }
  }, [applyProgress, caseParam, cases, frameParam, highlight, hush, markVisited, openSheet, scrollToProgress])

  // --- Render ---
  return (
    <div ref={rootRef} className={`fruit-root${useGl ? ' has-gl' : ''}`} data-lens={lens} data-hero="on" data-door="off">
      {/* the tall element the scroll runs over; the stage stays pinned on top of it */}
      <div ref={pinRef} className="fruit-pin" aria-hidden="true" />
      <div className="fruit-stage">
        <p className="sr-only">{ui.room}</p>
        {useGl ? <FruitLoader done={sceneShown} label={ui.loading} /> : null}
        {useGl ? <FruitScene onShown={onSceneShown} onHover={onHover} onPick={onPick} onFail={onSceneFail} /> : <FruitFallback progress={live.progress} sheetOpen={sheetOpen} />}
        <FruitChrome
          lang={lang}
          setLang={setLang}
          cases={cases}
          selectedId={selectedId}
          visited={visited}
          lens={lens}
          sheetOpen={sheetOpen}
          headline={copy.headline[lang]}
          support={copy.support[lang]}
          hudRef={hudRef}
          onSelect={selectCase}
          onHighlight={onHighlight}
          onLens={lockLens}
        />
        <FruitDoor lang={lang} email={copy.email} />
        {sheetOpen ? <button type="button" className="fruit-dismiss" aria-label={ui.close} onClick={closeSheet} /> : null}
        <FruitSheet open={sheetOpen} study={active} lang={lang} lens={lens} step={step} onStep={goStep} onClose={closeSheet} />
        <FruitCursor />
      </div>
    </div>
  )
}
