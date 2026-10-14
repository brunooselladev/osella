import type { CaseRow } from '@/content/types'

/** The case told as growth stages inside the sheet. Every field comes from content/cases. */
export type BenchStory = {
  context: string
  role: string
  meta: string
  rows: CaseRow[]
  contribution: string[]
  collective: string
  outcome: string
}

export type BenchCaseCopy = {
  cardTitle: string
  cardLine: string
  note: string
  need: string
  engineering: string
  story: BenchStory
}

export type BenchCase = {
  id: string
  slug: string
  en: BenchCaseCopy
  es: BenchCaseCopy
}

export type BenchCopy = {
  headline: { en: string; es: string }
  support: { en: string; es: string }
  email: string
}
