'use client'

// The DOM over the canvas: header, THE BENCH index (the skip-list), the lenses, the hero title,
// the floating specimen tag and the progress HUD. All copy comes from content/.

// ===== External modules =====
import { Fragment, type RefObject } from 'react'
import Link from 'next/link'

// ===== Internal modules =====
import { fruitCopy } from '@/content/fruit'
import type { Lang, Lens } from '@/content/types'
import { HUD_TICKS } from './camera-path'
import type { BenchCase } from './types'

// ===== Types =====

type FruitChromeProps = {
  lang: Lang
  setLang: (lang: Lang) => void
  cases: BenchCase[]
  selectedId: string | null
  visited: Set<string>
  lens: Lens
  sheetOpen: boolean
  headline: string
  support: string
  /** The HUD readout; BenchApp writes its text directly on scroll. */
  hudRef: RefObject<HTMLSpanElement | null>
  /** Index click: walk to the station, then open the sheet. */
  onSelect: (id: string) => void
  /** Index hover or focus: light the specimen up without walking. */
  onHighlight: (id: string) => void
  onLens: (lens: Lens) => void
}

// ===== Constants =====

const LENSES: Lens[] = ['business', 'engineering', 'delivery']

// ===== Helpers =====

const twoDigits = (index: number) => String(index + 1).padStart(2, '0')

// ===== Component: FruitChrome =====

export const FruitChrome = ({ lang, setLang, cases, selectedId, visited, lens, sheetOpen, headline, support, hudRef, onSelect, onHighlight, onLens }: FruitChromeProps) => {
  // --- Derived ---
  const ui = fruitCopy(lang)
  const selected = cases.find((item) => item.id === selectedId)

  // --- Render ---
  return (
    <>
      <header className="fruit-header">
        <Link className="fruit-name" href="/">
          bruno.osella
        </Link>
        <div className="fruit-tools">
          <span className="fruit-mark">
            <i />
            <span>{ui.fruit}</span>
          </span>
          <div className="fruit-lang">
            <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
              EN
            </button>
            <span className="fruit-sep">/</span>
            <button type="button" aria-pressed={lang === 'es'} onClick={() => setLang('es')}>
              ES
            </button>
          </div>
          <nav className="fruit-skins" aria-label={ui.skins}>
            <Link href="/dev" aria-label={ui.skinDev}>
              <i />
            </Link>
            <Link href="/fruit" aria-current="page" aria-label={ui.skinFruit}>
              <i />
            </Link>
            <Link href="/gaming" aria-label={ui.skinGaming} data-skin="gaming">
              <i />
            </Link>
          </nav>
        </div>
      </header>

      <nav className="fruit-index" aria-label={ui.benchAria} data-bench-index>
        <div className="fruit-index-title">{ui.bench}</div>
        <ol>
          {cases.map((item, index) => {
            const on = item.id === selectedId
            const seen = visited.has(item.id)
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={on ? 'is-on' : ''}
                  aria-current={on ? 'true' : undefined}
                  onClick={() => onSelect(item.id)}
                  onFocus={() => onHighlight(item.id)}
                  onPointerEnter={() => onHighlight(item.id)}
                >
                  <span className="tick" />
                  <span className="num">{twoDigits(index)}</span>
                  <span className="name">{item[lang].cardTitle}</span>
                  {seen ? <span className="dot" aria-label={ui.visited} /> : null}
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      <div className="fruit-lenses" role="group" aria-label={ui.lensAria} data-bench-lenses>
        {LENSES.map((item, index) => (
          <Fragment key={item}>
            {index > 0 ? <span className="fruit-sep">·</span> : null}
            <button type="button" aria-pressed={lens === item} onClick={() => onLens(item)}>
              {ui.lens[item]}
            </button>
          </Fragment>
        ))}
      </div>

      <div className="fruit-hero-veil" aria-hidden="true" />
      <div className="fruit-hero">
        <h1>{headline}</h1>
        <p>{support}</p>
      </div>

      {selected && !sheetOpen ? (
        <div className="fruit-tag">
          <small>{twoDigits(cases.findIndex((item) => item.id === selected.id))}</small>
          <span>{selected[lang].cardTitle}</span>
        </div>
      ) : null}

      <div className="fruit-hud">
        <div className="fruit-hud-track">
          <span className="fruit-hud-fill" />
          {HUD_TICKS.map((tick) => (
            <span key={tick} className="fruit-hud-tick" style={{ left: `${tick * 100}%` }} />
          ))}
          <span className="fruit-hud-knob" />
        </div>
        <span className="fruit-hud-read" ref={hudRef}>
          0.00 / {ui.hud}
        </span>
      </div>
    </>
  )
}
