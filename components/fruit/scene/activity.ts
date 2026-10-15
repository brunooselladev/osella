// Is anything happening? The frame rate rig renders at full speed while the visitor scrolls,
// moves the pointer or presses a key, and while anything in the room is still settling (camera,
// sun, a specimen). Otherwise the room idles at a lower rate. Inputs are reported by
// FrameRateRig's listeners; motion is reported by whoever asks for a shadow update.

// ===== External modules =====
import { useSyncExternalStore } from 'react'

// ===== Internal modules =====
import { live } from '../bench-live'

// ===== Constants =====

/** An input keeps the room at full rate this long (ms). */
const INPUT_WINDOW = 1000
/** A motion report keeps the room at full rate this long (ms). */
const MOTION_WINDOW = 250

let lastInput = 0
let lastMotion = 0
let active = true
const subscribers = new Set<() => void>()

// ===== Helpers =====

export const markInput = () => {
  lastInput = performance.now()
}

export const markMotion = () => {
  lastMotion = performance.now()
}

/** True while there is a reason to render at full rate. */
export const isActive = () => {
  const now = performance.now()
  return live.velocity !== 0 || now - lastInput < INPUT_WINDOW || now - lastMotion < MOTION_WINDOW
}

/** Publishes the active/idle flip to React (QualityRig pauses its monitor while idle). */
export const setActive = (next: boolean) => {
  if (next === active) return
  active = next
  subscribers.forEach((notify) => notify())
}

// ===== Hook: useActive =====

export const useActive = () =>
  useSyncExternalStore(
    (notify) => {
      subscribers.add(notify)
      return () => subscribers.delete(notify)
    },
    () => active,
    () => true,
  )
