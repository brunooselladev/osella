import { Suspense } from 'react'
import { publishedCases, sheetFields } from '@/content/cases'
import { identity } from '@/content/identity'
import { BenchApp } from '@/components/fruit/bench-app'
import type { BenchCase, BenchStory } from '@/components/fruit/types'
import type { CaseStudy, Lang } from '@/content/types'

function story(study: CaseStudy, lang: Lang): BenchStory {
  const { context, role, meta, rows, contribution, collective, outcome } = study[lang]
  return { context, role, meta, rows, contribution, collective, outcome }
}

export default function FruitPage() {
  const cases: BenchCase[] = publishedCases.map((study) => ({
    id: study.id,
    slug: study.slug,
    en: { ...sheetFields(study, 'en'), story: story(study, 'en') },
    es: { ...sheetFields(study, 'es'), story: story(study, 'es') },
  }))

  return (
    <Suspense>
      <BenchApp
        cases={cases}
        copy={{
          email: identity.email,
          headline: { en: identity.en.headline, es: identity.es.headline },
          support: { en: identity.en.support, es: identity.es.support },
        }}
      />
    </Suspense>
  )
}
