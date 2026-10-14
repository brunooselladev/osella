'use client'

import { useEffect, useRef } from 'react'
import type { Lang, Lens } from '@/content/types'
import { fruitCopy } from '@/content/fruit'
import type { BenchCase } from './types'

export const STEPS = 5

// A stem that grows down the sheet's edge and puts out a pair of leaves per stage (bottom to top).
const NODES = [86, 68, 50, 32, 14]

function Stem({ step }: { step: number }) {
  const grown = step === 0 ? 0 : Math.min(1, (step - 0.15) / STEPS)
  return (
    <div className="fruit-stem" aria-hidden="true">
      <span className="fruit-stem-line" style={{ transform: `scaleY(${grown})` }} />
      {NODES.map((y, i) => (
        <svg key={y} className={`fruit-stem-leaf${step > i ? ' is-on' : ''}${step === i + 1 ? ' is-now' : ''}`} style={{ top: `${y}%` }} viewBox="0 0 40 14">
          <path d="M20 9 q 8 -8 17 -6 q -6 7 -17 6" />
          <path d="M20 9 q -8 -8 -17 -6 q 6 7 17 6" />
        </svg>
      ))}
    </div>
  )
}

export function FruitSheet({
  open,
  study,
  lang,
  lens,
  step,
  onStep,
  onClose,
}: {
  open: boolean
  study: BenchCase | null
  lang: Lang
  lens: Lens
  step: number
  onStep: (step: number) => void
  onClose: () => void
}) {
  const ui = fruitCopy(lang)
  const copy = study?.[lang]
  const story = copy?.story
  const ref = useRef<HTMLElement>(null)
  const reading = open && step > 0
  const readingRef = useRef(reading)
  readingRef.current = reading

  // While reading, the wheel reads the sheet instead of walking the bench (which would close it).
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (event: WheelEvent) => {
      if (!readingRef.current) return
      const pane = (event.target as Element).closest?.('.fruit-sheet-pane.is-now') as HTMLElement | null
      if (!pane) return event.preventDefault()
      const down = event.deltaY > 0
      const canScroll = down ? pane.scrollTop + pane.clientHeight < pane.scrollHeight - 1 : pane.scrollTop > 0
      if (!canScroll) event.preventDefault()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  useEffect(() => {
    if (!open) return
    const target = step === 0 ? document.getElementById('sheet-title') : ref.current?.querySelector<HTMLElement>(`[data-step="${step}"] .fruit-step-kicker`)
    target?.focus({ preventScroll: true })
  }, [open, step])

  return (
    <aside
      ref={ref}
      className={`fruit-sheet${open ? ' is-on' : ''}${reading ? ' is-reading' : ''}`}
      role="dialog"
      aria-modal="false"
      aria-labelledby="sheet-title"
      aria-hidden={!open}
      inert={!open ? true : undefined}
      data-lenis-prevent={reading ? '' : undefined}
    >
      <button type="button" className="fruit-sheet-close" onClick={onClose} aria-label={ui.close}>
        Esc / ×
      </button>
      <Stem step={reading ? step : 0} />
      {copy && study && story ? (
        <>
          <div className="fruit-sheet-viewport">
            <div className="fruit-sheet-track" style={{ transform: `translate3d(${-step * 100}%, 0, 0)` }}>
              <section className={`fruit-sheet-pane fruit-sheet-card${step === 0 ? ' is-now' : ''}`} inert={step !== 0 ? true : undefined}>
                <div>
                  <h2 id="sheet-title" tabIndex={-1}>
                    {copy.cardTitle}
                  </h2>
                  <div className="fruit-sheet-meta">
                    <span className="fruit-sheet-note">{copy.note}</span>
                    <span className="fruit-sheet-line">{copy.cardLine}</span>
                  </div>
                </div>
                <div className="fruit-sheet-rule" />
                <dl className="fruit-sheet-rows">
                  <dt>{ui.need}</dt>
                  <dd>{copy.need}</dd>
                  <dt>{ui.engineering}</dt>
                  <dd>{copy.engineering}</dd>
                </dl>
                <button type="button" className="fruit-sheet-read" onClick={() => onStep(1)}>
                  {ui.read}
                </button>
              </section>

              {ui.steps.map((label, i) => {
                const n = i + 1
                return (
                  <section key={label} data-step={n} className={`fruit-sheet-pane fruit-step${step === n ? ' is-now' : ''}`} inert={step !== n ? true : undefined} aria-label={`${String(n).padStart(2, '0')} ${label}`}>
                    <p className="fruit-step-kicker" tabIndex={-1}>
                      <span>{String(n).padStart(2, '0')}</span> {label}
                    </p>
                    <p className="fruit-step-case">{copy.cardTitle}</p>
                    {n === 1 ? <p className="fruit-step-lead">{story.context}</p> : null}
                    {n === 2 ? (
                      <>
                        <p className="fruit-step-lead">{story.role}</p>
                        <p className="fruit-step-meta">{story.meta}</p>
                      </>
                    ) : null}
                    {n === 3 ? (
                      <>
                        <p className="fruit-step-meta">
                          {ui.lensAria} · <strong>{ui.lens[lens]}</strong>
                        </p>
                        {story.rows.map((row) => (
                          <div key={row.need} className="fruit-step-row">
                            <p className="fruit-step-need">{row.need}</p>
                            <p className="fruit-step-lead is-small">{row[lens].lead}</p>
                            <p className="fruit-step-detail">{row[lens].detail}</p>
                          </div>
                        ))}
                      </>
                    ) : null}
                    {n === 4 ? (
                      <ol className="fruit-step-list">
                        {story.contribution.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ol>
                    ) : null}
                    {n === 5 ? (
                      <>
                        <p className="fruit-step-lead">{story.outcome}</p>
                        <p className="fruit-step-detail">{story.collective}</p>
                      </>
                    ) : null}
                  </section>
                )
              })}
            </div>
          </div>

          <nav className="fruit-step-nav" aria-label={ui.stepsAria} inert={!reading ? true : undefined}>
            <button type="button" onClick={() => onStep(step - 1)}>
              {step === 1 ? ui.card : ui.prev}
            </button>
            <ol className="fruit-step-dots">
              {ui.steps.map((label, i) => (
                <li key={label}>
                  <button type="button" aria-label={label} aria-current={step === i + 1 ? 'step' : undefined} className={step >= i + 1 ? 'is-on' : undefined} onClick={() => onStep(i + 1)} />
                </li>
              ))}
            </ol>
            {step < STEPS ? (
              <button type="button" onClick={() => onStep(step + 1)}>
                {ui.next}
              </button>
            ) : (
              <button type="button" onClick={onClose}>
                {ui.backToBench}
              </button>
            )}
          </nav>
        </>
      ) : null}
    </aside>
  )
}
