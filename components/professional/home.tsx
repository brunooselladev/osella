'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { caseCopy, decisions, identityCopy, publishedCases } from '@/content'
import type { Lang, Lens } from '@/content'
import { useLanguage } from '@/components/language-provider'
import { ProContact, ProHeader } from './chrome'

const lenses: Lens[] = ['business', 'engineering', 'delivery']

const logos: Record<string, string> = {
  'bucked-up': '/logos/bucked.png',
  devias: '/logos/devias-iso.svg',
  'imperio-tickets': '/logos/imperio.png',
  'coopef-gym': '/logos/coopef.png',
}

const knocked = new Set(['bucked-up', 'coopef-gym'])

const ui = {
  en: {
    lens: { business: 'Business', engineering: 'Engineering', delivery: 'Delivery' },
    need: 'The need',
    read: 'Read the full case',
    how: 'How I work',
    cases: 'Cases',
    lenses: 'Lens',
  },
  es: {
    lens: { business: 'Negocio', engineering: 'Ingeniería', delivery: 'Entrega' },
    need: 'La necesidad',
    read: 'Leer el caso completo',
    how: 'Cómo trabajo',
    cases: 'Casos',
    lenses: 'Lente',
  },
}

function placeName(caseId: string, lang: Lang) {
  const study = publishedCases.find((item) => item.id === caseId)
  return study ? caseCopy(study, lang).cardTitle : ''
}

export function ProfessionalHome() {
  const { lang } = useLanguage()
  const [shown, setShown] = useState(lang)
  const [fading, setFading] = useState(false)
  const [caseId, setCaseId] = useState(publishedCases[0].id)
  const [lens, setLens] = useState<Lens>('engineering')

  useEffect(() => {
    if (lang === shown) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setShown(lang)
      return
    }
    setFading(true)
    const id = window.setTimeout(() => {
      setShown(lang)
      setFading(false)
    }, 360)
    return () => window.clearTimeout(id)
  }, [lang, shown])

  const copy = identityCopy(shown)
  const labels = ui[shown]
  const active = publishedCases.find((study) => study.id === caseId) ?? publishedCases[0]

  return (
    <div className={fading ? 'dev-fade is-out' : 'dev-fade'}>
      <div className="dev-page">
        <ProHeader
          lang={shown}
          center={(
            <div className="dev-lenses" role="group" aria-label={labels.lenses}>
              {lenses.map((item) => (
                <button key={item} type="button" aria-pressed={lens === item} onClick={() => setLens(item)}>
                  {labels.lens[item]}
                </button>
              ))}
            </div>
          )}
        />

        <section className="dev-hero">
          <div className="dev-marks" aria-hidden="true">
            {publishedCases.map((study) => (
              <img
                key={study.id}
                className={`${study.id === active.id ? 'is-on' : ''}${knocked.has(study.id) ? ' is-knock' : ''}${study.id === 'coopef-gym' ? ' is-word' : ''}`}
                src={logos[study.id]}
                alt=""
              />
            ))}
          </div>
          <div className="dev-statement">
            <h1>{copy.headline}</h1>
            <p>{copy.support}</p>
            <a href="#how">{copy.ctaWork}</a>
          </div>
          <div className="dev-cases" role="group" aria-label={labels.cases}>
            {publishedCases.map((study) => (
              <button
                key={study.id}
                type="button"
                aria-pressed={study.id === active.id}
                onMouseEnter={() => setCaseId(study.id)}
                onFocus={() => setCaseId(study.id)}
                onClick={() => setCaseId(study.id)}
              >
                {caseCopy(study, shown).cardTitle}
              </button>
            ))}
          </div>
        </section>

        <section className="dev-stage" id="work" aria-label={labels.lenses}>
          {publishedCases.map((study) => {
            const text = caseCopy(study, shown)
            return lenses.map((item) => {
              const on = study.id === active.id && item === lens
              return (
                <div key={`${study.id}-${item}`} className={on ? 'dev-pane is-on' : 'dev-pane'} aria-hidden={!on}>
                  <div className="dev-rule" />
                  <div className="dev-labels">
                    <span>{labels.need}</span>
                    <span>{labels.lens[item]}</span>
                  </div>
                  {text.rows.map((row) => (
                    <div className="dev-row" key={row.need}>
                      <p>{row.need}</p>
                      <div>
                        <p className="dev-lead">{row[item].lead}</p>
                        <p className="dev-detail">{row[item].detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })
          })}
        </section>

        <p className="dev-read">
          <Link href={`/work/${active.slug}`}>{labels.read}</Link>
        </p>

        <section className="dev-log" id="how" aria-labelledby="how-title">
          <h2 id="how-title">{labels.how}</h2>
          <ol>
            {decisions.map((decision) => {
              const text = decision[shown]
              return (
                <li className="dev-entry" key={decision.id}>
                  <span className="dev-year">{decision.year}</span>
                  <span className="dev-title">{text.title}</span>
                  <span className="dev-where">{placeName(decision.caseId, shown)}</span>
                </li>
              )
            })}
          </ol>
        </section>
      </div>
      <ProContact lang={shown} />
    </div>
  )
}
