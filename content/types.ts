export type Lang = 'en' | 'es'
export type Lens = 'business' | 'engineering' | 'delivery'
export type CaseStatus = 'published' | 'draft'

export type LensText = { lead: string; detail: string }

export type CaseRow = {
  need: string
  business: LensText
  engineering: LensText
  delivery: LensText
}

export type CaseCopy = {
  title: string
  summary: string
  context: string
  role: string
  meta: string
  rows: CaseRow[]
  contribution: string[]
  collective: string
  outcome: string
  stack: string[]
  confidentiality: string
  cardTitle: string
  cardLine: string
  note: string
}

export type CaseProduct = { name: string; role: string }

export type CaseStage = { name: string; state: 'done' | 'next' }

export type CaseStudy = {
  id: string
  slug: string
  status: CaseStatus
  url?: string
  products?: { en: CaseProduct[]; es: CaseProduct[] }
  stages?: { en: CaseStage[]; es: CaseStage[] }
  sheet?: { needRow: number; engineeringRow: number }
  en: CaseCopy
  es: CaseCopy
}

export type Decision = {
  id: string
  year: string
  caseId: string
  en: { title: string; kicker: string; fields: { label: string; value: string }[] }
  es: { title: string; kicker: string; fields: { label: string; value: string }[] }
}
