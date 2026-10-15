'use client'

// Grows the case sheet out of the specimen tag and shrinks it back into it. A FLIP: the panel's
// final layout stays in CSS; here we measure the tag's box and the sheet's box, start the panel
// as a transform that lays it exactly over the tag's card, then let a transition carry it to
// identity. The close runs on requestAnimationFrame instead, because the camera steps back out
// while the panel shrinks and the tag moves with it on screen: the target is re-measured every
// frame. The CSS under `.fruit-sheet[data-flip]` owns the look of each phase; this hook only sets
// `data-flip` and the inline transform. FruitSheet calls it.

// ===== External modules =====
import { useLayoutEffect, useRef, type RefObject } from 'react'

// ===== Internal modules =====
import { live } from './bench-live'

// ===== Types =====

/** A layout box relative to the offset parent, transforms excluded. */
type Box = { left: number; top: number; width: number; height: number }

// ===== Constants =====

/** How long the panel takes to grow out of the tag (ms). The content fades in over the last third (see the CSS). */
const OPEN_MS = 650
/** How long the panel takes to shrink back into the tag (ms). The content fades out over the first third. */
const CLOSE_MS = 420
/** How long the panel's shadow takes to fade in at the end of the growth, or out at the start of the shrink (ms). */
const SHADOW_MS = 200
/** The stylesheet's custom property with the flip's easing (an in-out curve, softer than --ease). */
const EASE_PROPERTY = '--ease-flip'
/** The tag's own skew (degrees, see `.fruit-tag`), matched so the panel is born as that card. */
const TAG_SKEW_DEG = -3
/** The DOM tag; it lives in FruitChrome, a sibling of the sheet under .fruit-stage. */
const TAG_SELECTOR = '.fruit-tag'
/** The stylesheet's --ease-flip, used when the custom property cannot be read. */
const EASE_FALLBACK = [0.65, 0, 0.35, 1]

// ===== Helpers =====

/** offsetLeft/Top/Width/Height ignore transforms, which is what a FLIP wants (the tag is skewed, the sheet slides). */
const layoutBox = (element: HTMLElement): Box => ({
  left: element.offsetLeft,
  top: element.offsetTop,
  width: element.offsetWidth,
  height: element.offsetHeight,
})

/**
 * The transform that lays the sheet over the tag's card, by `amount` (1 = fully on the tag,
 * 0 = the sheet's own place). The function list is the same at both ends so a CSS transition
 * interpolates each component instead of a matrix. The skew turns about the tag's centre, like
 * the tag's own `skewY`.
 */
const cardTransform = (sheet: Box, tag: Box, amount: number) => {
  const centreX = tag.left + tag.width / 2 - sheet.left
  const centreY = tag.top + tag.height / 2 - sheet.top
  const skew = amount * TAG_SKEW_DEG
  const shiftX = amount * (tag.left - sheet.left)
  const shiftY = amount * (tag.top - sheet.top)
  const scaleX = 1 + amount * (tag.width / sheet.width - 1)
  const scaleY = 1 + amount * (tag.height / sheet.height - 1)
  return `translate(${centreX}px, ${centreY}px) skewY(${skew}deg) translate(${-centreX}px, ${-centreY}px) translate(${shiftX}px, ${shiftY}px) scale(${scaleX}, ${scaleY})`
}

/** A CSS cubic-bezier(x1, y1, x2, y2) as a function of time 0..1 (Newton on the x axis, then y). */
const cubicBezier = (x1: number, y1: number, x2: number, y2: number) => {
  const sample = (control1: number, control2: number, t: number) => ((1 - 3 * control2 + 3 * control1) * t + (3 * control2 - 6 * control1)) * t * t + 3 * control1 * t
  const slope = (control1: number, control2: number, t: number) => 3 * (1 - 3 * control2 + 3 * control1) * t * t + 2 * (3 * control2 - 6 * control1) * t + 3 * control1
  return (time: number) => {
    if (time <= 0) return 0
    if (time >= 1) return 1
    let t = time
    for (let iteration = 0; iteration < 8; iteration += 1) {
      const error = sample(x1, x2, t) - time
      const derivative = slope(x1, x2, t)
      if (Math.abs(error) < 1e-5 || derivative === 0) break
      t -= error / derivative
    }
    return sample(y1, y2, t)
  }
}

/** The sheet's --ease-flip as a JS easing, so the frame-driven close matches the stylesheet's transitions. */
const easeOf = (sheet: HTMLElement) => {
  const declared = getComputedStyle(sheet).getPropertyValue(EASE_PROPERTY)
  const numbers = declared.match(/-?\d*\.?\d+/g)?.map(Number)
  const [x1, y1, x2, y2] = numbers && numbers.length === 4 ? numbers : EASE_FALLBACK
  return cubicBezier(x1, y1, x2, y2)
}

/** The tag can anchor a flip when it is laid out (not display: none: occluded, at the door, on phones) and motion is allowed. */
const usableTag = () => {
  if (live.reduce) return null
  const tag = document.querySelector<HTMLElement>(TAG_SELECTOR)
  return tag && tag.offsetWidth > 0 ? tag : null
}

/** Back to the plain CSS states (closed or open), without letting the stylesheet's transition replay. */
const clearFlip = (sheet: HTMLElement) => {
  sheet.style.transition = 'none'
  delete sheet.dataset.flip
  sheet.style.transform = ''
  void sheet.offsetWidth // commit the resting state before the transition property comes back
  sheet.style.transition = ''
}

// ===== Hook: useSheetFlip =====

export const useSheetFlip = (sheetRef: RefObject<HTMLElement | null>, open: boolean) => {
  // --- Refs & state ---
  const timer = useRef(0)
  const frame = useRef(0)
  const wasOpen = useRef(false)

  // --- Effects ---
  // Layout effect: the sheet must be measured and given its start transform before the browser paints the new state.
  useLayoutEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return
    const closing = wasOpen.current && !open
    wasOpen.current = open
    if (!open && !closing) return
    window.clearTimeout(timer.current)
    cancelAnimationFrame(frame.current)

    const tag = usableTag()
    if (!tag) {
      // no tag to grow from: the stylesheet's slide and fade take over
      clearFlip(sheet)
      return
    }
    const sheetBox = layoutBox(sheet)

    if (open) {
      const tagBox = layoutBox(tag)
      sheet.dataset.flip = 'start'
      sheet.style.transition = 'none'
      sheet.style.transform = cardTransform(sheetBox, tagBox, 1)
      void sheet.offsetWidth // the browser must see the collapsed state before the transition starts
      // the panel's shadow, scaled down, reads as a dark smear: it comes back with the content
      sheet.style.transition = `transform ${OPEN_MS}ms var(${EASE_PROPERTY}), box-shadow ${SHADOW_MS}ms var(${EASE_PROPERTY}) ${OPEN_MS - SHADOW_MS}ms`
      sheet.style.transform = cardTransform(sheetBox, tagBox, 0)
      sheet.dataset.flip = 'in'
      timer.current = window.setTimeout(() => {
        sheet.style.transition = ''
        sheet.style.transform = ''
        sheet.dataset.flip = 'on'
      }, OPEN_MS)
      return
    }

    // closing: shrink onto the tag, re-measured every frame because the camera is stepping back out
    const ease = easeOf(sheet)
    const startedAt = performance.now()
    sheet.dataset.flip = 'out'
    sheet.style.transition = `box-shadow ${SHADOW_MS}ms var(${EASE_PROPERTY})`
    const tick = (now: number) => {
      const amount = ease((now - startedAt) / CLOSE_MS)
      sheet.style.transform = cardTransform(sheetBox, layoutBox(tag), amount)
      if (amount < 1) frame.current = requestAnimationFrame(tick)
      else clearFlip(sheet)
    }
    frame.current = requestAnimationFrame(tick)
  }, [open, sheetRef])

  useLayoutEffect(
    () => () => {
      window.clearTimeout(timer.current)
      cancelAnimationFrame(frame.current)
    },
    [],
  )
}
