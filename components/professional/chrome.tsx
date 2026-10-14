'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { LangToggle, TrafficLightBack } from '@/components/shared'
import { useLanguage } from '@/components/language-provider'
import { identity, identityCopy } from '@/content/identity'
import type { Lang } from '@/content'

export function ProHeader({ center, lang: langOverride }: { center?: ReactNode; lang?: Lang }) {
  const { lang: current } = useLanguage()
  const lang = langOverride ?? current
  const copy = identityCopy(lang)
  return (
    <header className="dev-top">
      <Link className="dev-name" href="/dev">{identity.name}</Link>
      {center}
      <div className="dev-tools">
        <LangToggle dark />
        <TrafficLightBack active="green" />
        <a className="discuss" href={`mailto:${identity.email}`}>{copy.ctaContact}</a>
      </div>
    </header>
  )
}

export function ProContact({ lang: langOverride }: { lang?: Lang }) {
  const { lang: current } = useLanguage()
  const lang = langOverride ?? current
  const copy = identityCopy(lang)
  return (
    <footer className="dev-contact">
      <div className="dev-rule" />
      <h2>{copy.contactHeading}</h2>
      <div className="dev-links">
        <a className="mail" href={`mailto:${identity.email}`}>{identity.email}</a>
        <a href={identity.github}>GitHub</a>
        <a href={identity.linkedin}>LinkedIn</a>
        <span>{identity.location}</span>
      </div>
    </footer>
  )
}
