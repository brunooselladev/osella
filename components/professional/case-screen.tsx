'use client'

import { getCase } from '@/content'
import { ProContact, ProHeader } from './chrome'
import { CaseBody } from './case-body'

export function CaseScreen({ slug }: { slug: string }) {
  const study = getCase(slug)
  if (!study) return null
  return (
    <>
      <div className="pro-wrap">
        <ProHeader />
        <CaseBody study={study} />
      </div>
      <ProContact />
    </>
  )
}
