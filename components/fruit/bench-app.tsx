'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { fruitCopy } from '@/content/fruit'
import { useLanguage } from '@/components/language-provider'
import type { Lens } from '@/content/types'
import { live } from './bench-live'
import { casesVisitedAt, lensAt, stationForCase } from './camera-path'
import { FruitChrome } from './chrome'
import { FruitCursor } from './cursor'
import { FruitDoor } from './door'
import { FruitFallback } from './fallback'
import { FruitLoader } from './loader'
import { FruitSheet, STEPS } from './sheet'
import { useBenchScroll } from './use-bench-scroll'
import type { BenchCase, BenchCopy } from './types'

const FruitScene = dynamic(() => import('./scene').then((mod) => mod.FruitScene), { ssr: false })

const VISIT_KEY = 'bo-fruit-visited'

function readVisited(): Set<string> {
  try {
    const raw = sessionStorage.getItem(VISIT_KEY)
    const parsed = raw ? (JSON.parse(raw) as string[]) : []
    return new Set(parsed)
  } catch {
    return new Set()
  }
}

function writeVisited(visited: Set<string>) {
  sessionStorage.setItem(VISIT_KEY, JSON.stringify([...visited]))
}

function frameState(frame: string | null): { progress: number; caseId?: string; sheet: boolean } | null {
  if (frame === '01') return { progress: 0, sheet: false }
  if (frame === '02') return { progress: 0.4, caseId: 'devias', sheet: false }
  if (frame === '03') return { progress: 0.08, caseId: 'bucked-up', sheet: true }
  if (frame === '04') return { progress: 1, sheet: false }
  return null
}

function paintRoot(root: HTMLElement | null, progress: number, sheetOpen: boolean, lens: Lens, hud: HTMLSpanElement | null, langHud: string) {
  if (!root) return
  root.style.setProperty('--bench', progress.toFixed(4))
  root.dataset.lens = lens
  root.dataset.hero = progress < 0.18 && !sheetOpen ? 'on' : 'off'
  root.dataset.door = progress >= 0.9 && !sheetOpen ? 'on' : 'off'
  if (hud) hud.textContent = `${progress.toFixed(2)} / ${langHud}`
}

export function BenchApp({ cases, copy }: { cases: BenchCase[]; copy: BenchCopy }) {
  const { lang, setLang } = useLanguage()
  const searchParams = useSearchParams()
  const frameParam = searchParams.get('frame')
  const caseParam = searchParams.get('case')
  const ui = fruitCopy(lang)
  const rootRef = useRef<HTMLDivElement>(null)
  const hudRef = useRef<HTMLSpanElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const armedId = useRef<string | null>(null)
  const sheetOpenRef = useRef(false)
  const lensLockedRef = useRef<Lens | null>(null)
  const quietUntil = useRef(0)
  const booted = useRef(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [lens, setLens] = useState<Lens>('business')
  const [visited, setVisited] = useState<Set<string>>(new Set())
  const [useGl, setUseGl] = useState(true)
  const [sceneShown, setSceneShown] = useState(false)
  const onSceneShown = useCallback(() => setSceneShown(true), [])

  const active = useMemo(() => cases.find((item) => item.id === selectedId) ?? null, [cases, selectedId])

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

  const goStep = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(STEPS, next))
    setStep(clamped)
    live.reading = clamped > 0
    live.step = Math.max(0, clamped - 1)
  }, [])

  const hush = useCallback((ms = 1300) => {
    quietUntil.current = Date.now() + ms
  }, [])

  const applyProgress = useCallback(
    (value: number) => {
      const next = Math.max(0, Math.min(1, value))
      live.progress = next
      const nextLens = lensLockedRef.current ?? lensAt(next)
      live.lens = nextLens
      live.sheetOpen = sheetOpenRef.current
      paintRoot(rootRef.current, next, sheetOpenRef.current, nextLens, hudRef.current, fruitCopy(lang).hud)
      setLens((prev) => (prev === nextLens ? prev : nextLens))
      markVisited(casesVisitedAt(next))
    },
    [lang, markVisited],
  )

  const { pinRef, scrollToProgress } = useBenchScroll({
    onProgress: applyProgress,
    onUserScroll: () => {
      if (Date.now() < quietUntil.current) return
      if (sheetOpenRef.current) {
        sheetOpenRef.current = false
        setSheetOpen(false)
        live.sheetOpen = false
        goStep(0)
        const url = new URL(window.location.href)
        url.searchParams.delete('case')
        window.history.replaceState(null, '', url)
        paintRoot(rootRef.current, live.progress, false, live.lens, hudRef.current, fruitCopy(lang).hud)
      }
    },
  })

  const closeSheet = useCallback(() => {
    sheetOpenRef.current = false
    setSheetOpen(false)
    live.sheetOpen = false
    goStep(0)
    const url = new URL(window.location.href)
    url.searchParams.delete('case')
    window.history.replaceState(null, '', url)
    triggerRef.current?.focus()
    paintRoot(rootRef.current, live.progress, false, live.lens, hudRef.current, fruitCopy(lang).hud)
  }, [goStep, lang])

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
      const url = new URL(window.location.href)
      url.searchParams.set('case', id)
      window.history.replaceState(null, '', url)
      paintRoot(rootRef.current, live.progress, true, live.lens, hudRef.current, fruitCopy(lang).hud)
    },
    [goStep, lang, markVisited],
  )

  const selectCase = useCallback(
    (id: string) => {
      const station = stationForCase(id)
      if (!station) return
      setSelectedId(id)
      live.selectedId = id
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
    [closeSheet, hush, openSheet, scrollToProgress],
  )

  useEffect(() => {
    sheetOpenRef.current = sheetOpen
    live.sheetOpen = sheetOpen
  }, [sheetOpen])

  useEffect(() => {
    live.selectedId = selectedId
  }, [selectedId])

  useEffect(() => {
    setVisited(readVisited())
    const canvas = document.createElement('canvas')
    setUseGl(Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl')))
  }, [])

  useEffect(() => {
    if (booted.current) return
    booted.current = true
    const framed = frameState(frameParam)
    hush(400)
    if (framed) {
      scrollToProgress(framed.progress, 0)
      applyProgress(framed.progress)
      if (framed.caseId) {
        setSelectedId(framed.caseId)
        live.selectedId = framed.caseId
      }
      if (framed.sheet && framed.caseId) openSheet(framed.caseId)
      if (framed.progress >= 1) markVisited(cases.map((item) => item.id))
      return
    }
    if (caseParam && stationForCase(caseParam)) {
      const station = stationForCase(caseParam)!
      scrollToProgress(station.progress, 0)
      applyProgress(station.progress)
      openSheet(caseParam)
    }
  }, [applyProgress, caseParam, cases, frameParam, hush, markVisited, openSheet, scrollToProgress])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && sheetOpenRef.current) {
        event.preventDefault()
        closeSheet()
        return
      }
      if (sheetOpenRef.current && live.reading && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
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
        const map: Record<string, Lens> = { b: 'business', e: 'engineering', d: 'delivery' }
        const next = map[event.key.toLowerCase()]
        if (next) {
          event.preventDefault()
          lensLockedRef.current = next
          live.lensLocked = true
          live.lens = next
          setLens(next)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cases, closeSheet, goStep, selectCase])

  return (
    <div ref={rootRef} className={`fruit-root${useGl ? ' has-gl' : ''}`} data-lens={lens} data-hero="on" data-door="off">
      <div ref={pinRef} className="fruit-pin" aria-hidden="true" />
      <div className="fruit-stage">
        <p className="sr-only">{ui.room}</p>
        {useGl ? <FruitLoader done={sceneShown} label={ui.loading} /> : null}
        {useGl ? (
          <FruitScene
            onShown={onSceneShown}
            onHover={(id) => {
              live.hoverId = id
              if (id && !sheetOpenRef.current) {
                setSelectedId((prev) => (prev === id ? prev : id))
                live.selectedId = id
              }
            }}
            onPick={(id) => {
              setSelectedId(id)
              live.selectedId = id
              openSheet(id)
            }}
            onFail={() => setUseGl(false)}
          />
        ) : (
          <FruitFallback progress={live.progress} sheetOpen={sheetOpen} />
        )}
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
          onHighlight={(id) => {
            if (!sheetOpenRef.current) {
              setSelectedId(id)
              live.selectedId = id
            }
          }}
          onLens={(next) => {
            lensLockedRef.current = next
            live.lensLocked = true
            live.lens = next
            setLens(next)
          }}
        />
        <FruitDoor lang={lang} email={copy.email} />
        {sheetOpen ? <button type="button" className="fruit-dismiss" aria-label={ui.close} onClick={closeSheet} /> : null}
        <FruitSheet open={sheetOpen} study={active} lang={lang} lens={lens} step={step} onStep={goStep} onClose={closeSheet} />
        <FruitCursor />
      </div>
    </div>
  )
}
