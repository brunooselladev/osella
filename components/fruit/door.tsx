'use client'

// The DOM at the end of the walk: "Walk out" back to the traffic light, and the email.

// ===== External modules =====
import Link from 'next/link'

// ===== Internal modules =====
import { fruitCopy } from '@/content/fruit'
import type { Lang } from '@/content/types'

// ===== Component: FruitDoor =====

export const FruitDoor = ({ lang, email }: { lang: Lang; email: string }) => {
  // --- Derived ---
  const ui = fruitCopy(lang)

  // --- Render ---
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
