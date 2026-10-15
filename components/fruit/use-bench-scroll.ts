'use client'

// Turns the page scroll into the walk's progress. Lenis smooths the wheel, GSAP's ticker drives
// Lenis, and a ScrollTrigger pinned to the tall .fruit-pin element reports progress 0..1.
// Also offers `scrollToProgress` for the skip-list and the deep links.

// ===== External modules =====
import { useCallback, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

// ===== Internal modules =====
import { live } from './bench-live'

// ===== Types =====

type Options = {
  onProgress: (progress: number) => void
}

// ===== Constants =====

/** Default duration of a programmatic walk to a station (s). */
const WALK_DURATION = 1.8
/** Quintic in-out for the walk: starts and brakes gently instead of Lenis's default ease-out. */
const walkEasing = (time: number) => (time < 0.5 ? 16 * time ** 5 : 1 - (-2 * time + 2) ** 5 / 2)

// ===== Hook: useBenchScroll =====

export const useBenchScroll = ({ onProgress }: Options) => {
  // --- Refs & state ---
  const pinRef = useRef<HTMLDivElement>(null)
  const lenisRef = useRef<Lenis | null>(null)
  // latest callback, so the effect below never has to re-subscribe
  const onProgressRef = useRef(onProgress)
  onProgressRef.current = onProgress

  // --- Effects ---
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
        onProgressRef.current(self.progress)
      },
    })

    const onLenis = () => ScrollTrigger.update()
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

  // --- Methods ---
  /** Walks to `progress` over `duration` seconds (0 = jump). */
  const scrollToProgress = useCallback((progress: number, duration = WALK_DURATION) => {
    const pin = pinRef.current
    const lenis = lenisRef.current
    if (!pin) return
    const range = Math.max(1, pin.offsetHeight - window.innerHeight)
    const top = Math.max(0, Math.min(1, progress)) * range
    const reduce = live.reduce
    if (!lenis) {
      window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' })
      return
    }
    if (reduce || duration === 0) {
      lenis.scrollTo(top, { immediate: true })
      return
    }
    // Lenis honours `duration` only together with an `easing`; with the duration alone (as before)
    // it silently fell back to its lerp, which is the hard braking the walk used to have
    lenis.scrollTo(top, { duration, easing: walkEasing })
  }, [])

  return { pinRef, scrollToProgress }
}
