import type { CaseStudy, Lang } from '../types'
import { buckedUp } from './bucked-up'
import { coopefGym } from './coopef-gym'
import { devias } from './devias'
import { imperioTickets } from './imperio-tickets'

export const cases: CaseStudy[] = [buckedUp, devias, imperioTickets, coopefGym]

for (const study of cases) {
  if (study.en.rows.length !== study.es.rows.length) {
    throw new Error(`${study.id} has a different row count in each language`)
  }
}

export const publishedCases = cases.filter((study) => study.status === 'published')

export function getCase(slug: string) {
  return publishedCases.find((study) => study.slug === slug)
}

export function caseCopy(study: CaseStudy, lang: Lang) {
  return study[lang]
}

export function sheetFields(study: CaseStudy, lang: Lang) {
  const copy = study[lang]
  const last = copy.rows.length - 1
  const needRow = Math.min(study.sheet?.needRow ?? 0, last)
  const engineeringRow = Math.min(study.sheet?.engineeringRow ?? 0, last)
  return {
    cardTitle: copy.cardTitle,
    cardLine: copy.cardLine,
    note: copy.note,
    need: copy.rows[needRow].need,
    engineering: copy.rows[engineeringRow].engineering.lead,
  }
}
