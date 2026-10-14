'use client'

import type { RefObject } from 'react'
import Link from 'next/link'
import { fruitCopy } from '@/content/fruit'
import type { Lang, Lens } from '@/content/types'
import { HUD_TICKS } from './camera-path'
import type { BenchCase } from './types'

const lenses: Lens[] = ['business', 'engineering', 'delivery']

export function FruitChrome({
  lang,
  setLang,
  cases,
  selectedId,
  visited,
  lens,
  sheetOpen,
  headline,
  support,
  hudRef,
  onSelect,
  onHighlight,
  onLens,
}: {
  lang: Lang
  setLang: (lang: Lang) => void
  cases: BenchCase[]
  selectedId: string | null
  visited: Set<string>
  lens: Lens
  sheetOpen: boolean
  headline: string
  support: string
  hudRef: RefObject<HTMLSpanElement | null>
  onSelect: (id: string) => void
  onHighlight: (id: string) => void
  onLens: (lens: Lens) => void
}) {
  const ui = fruitCopy(lang)
  const selected = cases.find((item) => item.id === selectedId)

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
            <span style={{ color: 'var(--fg-2)' }}>/</span>
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
                  <span className="num">{String(index + 1).padStart(2, '0')}</span>
                  <span className="name">{item[lang].cardTitle}</span>
                  {seen ? <span className="dot" aria-label={ui.visited} /> : null}
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      <div className="fruit-lenses" role="group" aria-label={ui.lensAria} data-bench-lenses>
        {lenses.map((item, index) => (
          <span key={item} style={{ display: 'contents' }}>
            {index > 0 ? <span style={{ color: 'var(--fg-2)' }}>·</span> : null}
            <button type="button" aria-pressed={lens === item} onClick={() => onLens(item)}>
              {ui.lens[item]}
            </button>
          </span>
        ))}
      </div>

      <div className="fruit-hero">
        <h1>{headline}</h1>
        <p>{support}</p>
      </div>

      {selected && !sheetOpen ? (
        <div className="fruit-tag">
          <small>{String(cases.findIndex((item) => item.id === selected.id) + 1).padStart(2, '0')}</small>
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
