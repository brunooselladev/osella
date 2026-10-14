'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { live } from './bench-live'

type Options = {
  onProgress: (progress: number, velocity: number) => void
  onUserScroll?: () => void
}

export function useBenchScroll({ onProgress, onUserScroll }: Options) {
  const pinRef = useRef<HTMLDivElement>(null)
  const lenisRef = useRef<Lenis | null>(null)
  const programmatic = useRef(false)
  const onProgressRef = useRef(onProgress)
  const onUserScrollRef = useRef(onUserScroll)
  onProgressRef.current = onProgress
  onUserScrollRef.current = onUserScroll

  useEffect(() => {
    const pin = pinRef.current
    if (!pin) return

    gsap.registerPlugin(ScrollTrigger)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    live.reduce = reduce

    const lenis = new Lenis({
      autoRaf: false,
      lerp: reduce ? 1 : 0.075,
      wheelMultiplier: 0.82,
      touchMultiplier: 1.05,
      syncTouch: true,
    })
    ;(window as Window & { __benchLenis?: Lenis }).__benchLenis = lenis
    lenisRef.current = lenis

    const onTick = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(onTick)
    gsap.ticker.lagSmoothing(0)

    const trigger = ScrollTrigger.create({
      trigger: pin,
      start: 'top top',
      end: 'bottom bottom',
      scrub: reduce ? false : 1,
      onUpdate: (self) => {
        live.progress = self.progress
        live.velocity = lenis.velocity
        onProgressRef.current(self.progress, lenis.velocity)
      },
    })

    const onLenis = () => {
      ScrollTrigger.update()
      if (!programmatic.current) onUserScrollRef.current?.()
    }
    lenis.on('scroll', onLenis)

    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('resize', refresh)
    requestAnimationFrame(refresh)

    return () => {
      window.removeEventListener('resize', refresh)
      lenis.off('scroll', onLenis)
      trigger.kill()
      gsap.ticker.remove(onTick)
      lenis.destroy()
      lenisRef.current = null
      delete (window as Window & { __benchLenis?: Lenis }).__benchLenis
    }
  }, [])

  const scrollToProgress = (progress: number, duration = 1.2) => {
    const pin = pinRef.current
    const lenis = lenisRef.current
    if (!pin) return
    const range = Math.max(1, pin.offsetHeight - window.innerHeight)
    const top = Math.max(0, Math.min(1, progress)) * range
    const reduce = live.reduce
    programmatic.current = true
    const done = () => {
      programmatic.current = false
    }
    if (!lenis) {
      window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' })
      done()
      return
    }
    if (reduce || duration === 0) {
      lenis.scrollTo(top, { immediate: true })
      done()
      return
    }
    lenis.scrollTo(top, { duration, onComplete: done })
  }

  return { pinRef, scrollToProgress }
}
