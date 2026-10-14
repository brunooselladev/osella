'use client'

import { SPECIMENS } from '../camera-path'
import { Bucked } from './bucked'
import { Coopef } from './coopef'
import { Devias } from './devias'
import { Imperio } from './imperio'

export function Specimens({
  mobile,
  onHover,
  onPick,
}: {
  mobile: boolean
  onHover: (id: string | null) => void
  onPick: (id: string) => void
}) {
  const hide = typeof window === 'undefined' ? [] : (new URLSearchParams(window.location.search).get('hide') ?? '').split(',')
  return (
    <group>
      {SPECIMENS.filter((item) => !hide.includes(item.id)).map((item) => (
        <group
          key={item.id}
          onPointerOver={(e) => {
            e.stopPropagation()
            onHover(item.id)
          }}
          onPointerOut={(e) => {
            e.stopPropagation()
            onHover(null)
          }}
          onClick={(e) => {
            e.stopPropagation()
            onPick(item.id)
          }}
        >
          {item.id === 'bucked-up' ? <Bucked position={item.position} mobile={mobile} /> : null}
          {item.id === 'devias' ? <Devias position={item.position} /> : null}
          {item.id === 'imperio-tickets' ? <Imperio position={item.position} /> : null}
          {item.id === 'coopef-gym' ? <Coopef position={item.position} /> : null}
        </group>
      ))}
    </group>
  )
}
