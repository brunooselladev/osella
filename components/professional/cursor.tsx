'use client'

import { useEffect, useRef } from 'react'

export function DevCursor() {
  const dot = useRef<HTMLDivElement>(null)
  const line = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!fine.matches || reduce.matches) return

    const root = document.documentElement
    root.classList.add('dev-cursor')

    let x = 0
    let y = 0
    let cx = 0
    let cy = 0
    let lx = 0
    let seen = false
    let frame = 0

    const show = () => {
      dot.current?.classList.add('is-on')
      line.current?.classList.add('is-on')
    }
    const hide = () => {
      seen = false
      dot.current?.classList.remove('is-on')
      line.current?.classList.remove('is-on')
    }
    const onMove = (event: PointerEvent) => {
      x = event.clientX
      y = event.clientY
      if (!seen) {
        seen = true
        cx = x
        cy = y
        lx = x
        show()
      }
    }
    const onOver = (event: Event) => {
      const target = event.target
      const hot = target instanceof Element && target.closest('a, button')
      dot.current?.classList.toggle('is-hot', Boolean(hot))
    }
    const tick = () => {
      cx += (x - cx) * 0.18
      cy += (y - cy) * 0.18
      lx += (x - lx) * 0.06
      dot.current?.style.setProperty('transform', `translate3d(${cx}px, ${cy}px, 0)`)
      line.current?.style.setProperty('transform', `translate3d(${lx}px, 0, 0)`)
      frame = window.requestAnimationFrame(tick)
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerover', onOver)
    document.addEventListener('pointerleave', hide)
    frame = window.requestAnimationFrame(tick)

    return () => {
      root.classList.remove('dev-cursor')
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerleave', hide)
      window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <>
      <div ref={line} className="dev-line" aria-hidden="true" />
      <div ref={dot} className="dev-dot" aria-hidden="true" />
    </>
  )
}
