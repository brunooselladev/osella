import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CaseScreen } from '@/components/professional/case-screen'
import { getCase, publishedCases } from '@/content/cases'

type Params = { slug: string }

export function generateStaticParams() {
  return publishedCases.map((study) => ({ slug: study.slug }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const study = getCase(slug)
  if (!study) return {}
  return { title: study.en.cardTitle, description: study.en.summary }
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const study = getCase(slug)
  if (!study) notFound()
  return <CaseScreen slug={study.slug} />
}
