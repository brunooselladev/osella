// The time of day and everything the light derives from it. Four keyframes, interpolated into the
// shared `day` object once per frame by DayRig (useFrame priority -2); every other rig and shader
// reads `day` after that. Sun vectors point at the sun; +x is screen-left (morning comes in from
// the left). tod: 0 morning (Business) · 1 noon (Engineering) · 1.5 dusk · 2 night (Delivery).
// Walking moves the sun continuously; picking a lens jumps the whole room to that lens.

// ===== External modules =====
import * as THREE from 'three'

// ===== Internal modules =====
import type { Lens } from '@/content/types'

// ===== Types =====

/** One keyframe as written by hand: colours as hex, vectors as tuples. */
type KeyframeSource = {
  sun: [number, number, number]
  sunColor: string
  sunI: number
  sky: string
  ground: string
  hemiI: number
  fog: string
  fogNear: number
  fogFar: number
  milk: string
  glow: number
  skyTop: string
  skyLow: string
  env: number
  shafts: number
  dust: number
  lamp: number
  night: number
}

/** The evaluated day, with three.js objects ready to copy into lights and uniforms. */
export type Day = {
  tod: number
  sunDir: THREE.Vector3
  sunColor: THREE.Color
  sunI: number
  sky: THREE.Color
  ground: THREE.Color
  hemiI: number
  fog: THREE.Color
  fogNear: number
  fogFar: number
  /** Colour of the lime wash on the glass. */
  milk: THREE.Color
  /** Brightness of the glass. */
  glow: number
  skyTop: THREE.Color
  skyLow: THREE.Color
  /** Environment map intensity. */
  env: number
  /** Light shafts, dust, lantern and night, each 0..1. */
  shafts: number
  dust: number
  lamp: number
  night: number
}

// ===== Constants =====

/** tod → keyframe, in order. */
const KEYFRAME_SOURCE: [number, KeyframeSource][] = [
  [
    0,
    {
      sun: [0.78, 0.44, 0.44],
      sunColor: '#ffd8a6',
      sunI: 4.4,
      sky: '#f8ecd6',
      ground: '#a87f5a',
      hemiI: 0.62,
      fog: '#f1e3ca',
      fogNear: 9,
      fogFar: 56,
      milk: '#fbf1de',
      glow: 1.0,
      skyTop: '#f8f2e6',
      skyLow: '#f4dcb4',
      env: 0.5,
      shafts: 1,
      dust: 1,
      lamp: 0,
      night: 0,
    },
  ],
  [
    1,
    {
      sun: [-0.2, 1, 0.16],
      sunColor: '#fff6e6',
      sunI: 5.2,
      sky: '#fbf7ee',
      ground: '#b38c66',
      hemiI: 0.55,
      fog: '#f6efe2',
      fogNear: 12,
      fogFar: 70,
      milk: '#fffaf0',
      glow: 1.12,
      skyTop: '#fbf8f0',
      skyLow: '#f6ead2',
      env: 0.5,
      shafts: 0.35,
      dust: 0.45,
      lamp: 0,
      night: 0,
    },
  ],
  [
    1.5,
    {
      sun: [-0.86, 0.22, 0.4],
      sunColor: '#ffa868',
      sunI: 3.6,
      sky: '#ecc9a6',
      ground: '#6b4631',
      hemiI: 0.4,
      fog: '#dcb38a',
      fogNear: 7,
      fogFar: 44,
      milk: '#f4cb9c',
      glow: 0.9,
      skyTop: '#e9d2bd',
      skyLow: '#f0a874',
      env: 0.3,
      shafts: 0.85,
      dust: 0.85,
      lamp: 0.45,
      night: 0.25,
    },
  ],
  [
    2,
    {
      sun: [-0.86, 0.22, 0.4],
      sunColor: '#ff9a5a',
      sunI: 0,
      sky: '#2c3444',
      ground: '#140f0b',
      hemiI: 0.09,
      fog: '#0e0d0b',
      fogNear: 3,
      fogFar: 24,
      milk: '#0f1218',
      glow: 0.2,
      skyTop: '#0c0f17',
      skyLow: '#1e1d22',
      env: 0.04,
      shafts: 0,
      dust: 0.3,
      lamp: 1,
      night: 1,
    },
  ],
]

/** The keyframes with their colours and vectors parsed once, so evalDay allocates nothing. */
const KEYFRAMES = KEYFRAME_SOURCE.map(([tod, source]) => ({
  tod,
  source,
  sun: new THREE.Vector3(...source.sun).normalize(),
  sunColor: new THREE.Color(source.sunColor),
  sky: new THREE.Color(source.sky),
  ground: new THREE.Color(source.ground),
  fog: new THREE.Color(source.fog),
  milk: new THREE.Color(source.milk),
  skyTop: new THREE.Color(source.skyTop),
  skyLow: new THREE.Color(source.skyLow),
}))

/** Where each lens parks the day when the visitor clicks it. */
export const LENS_TOD: Record<Lens, number> = { business: 0, engineering: 1, delivery: 2 }

/** Shared, mutable. Written once per frame by DayRig, read by everything else. */
export const day: Day = {
  tod: 0,
  sunDir: new THREE.Vector3(),
  sunColor: new THREE.Color(),
  sunI: 0,
  sky: new THREE.Color(),
  ground: new THREE.Color(),
  hemiI: 0,
  fog: new THREE.Color(),
  fogNear: 0,
  fogFar: 0,
  milk: new THREE.Color(),
  glow: 0,
  skyTop: new THREE.Color(),
  skyLow: new THREE.Color(),
  env: 0,
  shafts: 0,
  dust: 0,
  lamp: 0,
  night: 0,
}

const lerp = THREE.MathUtils.lerp

// ===== Helpers =====

/** Interpolates the two keyframes around `tod` (smoothstep eased) into `day`. */
export const evalDay = (tod: number) => {
  const clamped = THREE.MathUtils.clamp(tod, 0, 2)
  let index = 0
  while (index < KEYFRAMES.length - 2 && clamped > KEYFRAMES[index + 1].tod) index += 1
  const from = KEYFRAMES[index]
  const to = KEYFRAMES[index + 1]
  const raw = (clamped - from.tod) / (to.tod - from.tod)
  const mix = raw * raw * (3 - 2 * raw)
  day.tod = clamped
  day.sunDir.copy(from.sun).lerp(to.sun, mix).normalize()
  day.sunColor.copy(from.sunColor).lerp(to.sunColor, mix)
  day.sunI = lerp(from.source.sunI, to.source.sunI, mix)
  day.sky.copy(from.sky).lerp(to.sky, mix)
  day.ground.copy(from.ground).lerp(to.ground, mix)
  day.hemiI = lerp(from.source.hemiI, to.source.hemiI, mix)
  day.fog.copy(from.fog).lerp(to.fog, mix)
  day.fogNear = lerp(from.source.fogNear, to.source.fogNear, mix)
  day.fogFar = lerp(from.source.fogFar, to.source.fogFar, mix)
  day.milk.copy(from.milk).lerp(to.milk, mix)
  day.glow = lerp(from.source.glow, to.source.glow, mix)
  day.skyTop.copy(from.skyTop).lerp(to.skyTop, mix)
  day.skyLow.copy(from.skyLow).lerp(to.skyLow, mix)
  day.env = lerp(from.source.env, to.source.env, mix)
  day.shafts = lerp(from.source.shafts, to.source.shafts, mix)
  day.dust = lerp(from.source.dust, to.source.dust, mix)
  day.lamp = lerp(from.source.lamp, to.source.lamp, mix)
  day.night = lerp(from.source.night, to.source.night, mix)
}

const band = (progress: number, from: number, to: number) => THREE.MathUtils.smoothstep(progress, from, to)

/**
 * The walk is one day: morning at the door, noon by Devias and Imperio, dusk at COOPEF,
 * night at the end. Maps progress 0..1 to tod 0..2.
 */
export const todAt = (progress: number) => band(progress, 0.12, 0.38) + 0.5 * band(progress, 0.66, 0.82) + 0.5 * band(progress, 0.84, 0.95)

// Start the module with a valid morning so anything reading `day` before the first frame gets colours.
evalDay(0)
