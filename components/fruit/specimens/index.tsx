'use client'

// The four specimens on their stations, each wrapped in the pointer events that drive hover and
// pick. Which component draws which case is decided here, by id.

// ===== External modules =====
import type { ThreeEvent } from '@react-three/fiber'

// ===== Internal modules =====
import { SPECIMENS } from '../camera-path'
import { hiddenCases } from '../lookdev'
import { Bucked } from './bucked'
import { Coopef } from './coopef'
import { Devias } from './devias'
import { Imperio } from './imperio'

// ===== Types =====

type SpecimensProps = {
  mobile: boolean
  onHover: (id: string | null) => void
  onPick: (id: string) => void
}

// ===== Component: Specimens =====

export const Specimens = ({ mobile, onHover, onPick }: SpecimensProps) => {
  // --- Derived ---
  const hidden = hiddenCases()
  const shown = SPECIMENS.filter((item) => !hidden.includes(item.id))

  // --- Methods ---
  const stop = (event: ThreeEvent<PointerEvent | MouseEvent>) => event.stopPropagation()

  // --- Render ---
  return (
    <group>
      {shown.map((item) => (
        <group
          key={item.id}
          onPointerOver={(event) => {
            stop(event)
            onHover(item.id)
          }}
          onPointerOut={(event) => {
            stop(event)
            onHover(null)
          }}
          onClick={(event) => {
            stop(event)
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
