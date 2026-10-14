'use client'

import { useEffect, useRef } from 'react'

export function FruitCursor() {
  const node = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!fine.matches || reduce.matches) return

    const root = document.querySelector('.fruit-root')
    root?.classList.add('is-fine')

    let x = 0
    let y = 0
    let seen = false
    const onMove = (event: PointerEvent) => {
      x = event.clientX
      y = event.clientY
      const el = node.current
      if (!el) return
      el.style.transform = `translate3d(${x - 18}px, ${y - 18}px, 0)`
      if (!seen) {
        seen = true
        el.classList.add('is-on')
      }
    }
    const hide = () => {
      seen = false
      node.current?.classList.remove('is-on')
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerleave', hide)
    return () => {
      root?.classList.remove('is-fine')
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', hide)
    }
  }, [])

  return (
    <div ref={node} className="fruit-cursor" aria-hidden="true">
      <span className="v1" />
      <span className="v2" />
      <span className="h1" />
      <span className="h2" />
      <i />
    </div>
  )
}
