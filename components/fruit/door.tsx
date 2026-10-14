'use client'

import Link from 'next/link'
import { fruitCopy } from '@/content/fruit'
import type { Lang } from '@/content/types'

export function FruitDoor({ lang, email }: { lang: Lang; email: string }) {
  const ui = fruitCopy(lang)
  return (
    <div className="fruit-door">
      {/* walking out goes back to the traffic light; the mail stays the contact */}
      <Link className="fruit-door-walk" href="/">
        {ui.walk}
      </Link>
      <a className="fruit-door-mail" href={`mailto:${email}`}>
        {email}
      </a>
    </div>
  )
}
