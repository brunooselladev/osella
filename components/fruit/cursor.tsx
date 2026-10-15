'use client'

// A crosshair cursor for fine pointers. Pure DOM: follows the pointer with a transform, hides when
// the pointer leaves. Skipped on touch and under reduced motion.

// ===== External modules =====
import { useEffect, useRef } from 'react'

// ===== Constants =====

/** Half the cursor's size (px), so it centres on the pointer. */
const HALF_SIZE = 18

// ===== Component: FruitCursor =====

export const FruitCursor = () => {
  // --- Refs & state ---
  const nodeRef = useRef<HTMLDivElement>(null)

  // --- Effects ---
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!fine.matches || reduce.matches) return

    const root = document.querySelector('.fruit-root')
    root?.classList.add('is-fine')

    let seen = false
    const onMove = (event: PointerEvent) => {
      const node = nodeRef.current
      if (!node) return
      node.style.transform = `translate3d(${event.clientX - HALF_SIZE}px, ${event.clientY - HALF_SIZE}px, 0)`
      if (!seen) {
        seen = true
        node.classList.add('is-on')
      }
    }
    const hide = () => {
      seen = false
      nodeRef.current?.classList.remove('is-on')
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerleave', hide)
    return () => {
      root?.classList.remove('is-fine')
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', hide)
    }
  }, [])

  // --- Render ---
  return (
    <div ref={nodeRef} className="fruit-cursor" aria-hidden="true">
      <span className="v1" />
      <span className="v2" />
      <span className="h1" />
      <span className="h2" />
      <i />
    </div>
  )
}
