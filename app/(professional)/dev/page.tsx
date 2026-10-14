import type { Metadata } from 'next'
import { ProfessionalHome } from '@/components/professional/home'
import { identity } from '@/content/identity'

export const metadata: Metadata = { description: identity.en.support }

export default function Page() {
  return <ProfessionalHome />
}
