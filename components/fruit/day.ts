import * as THREE from 'three'
import type { Lens } from '@/content/types'

// Sun vectors point at the sun; +x is screen-left (morning comes in from the left).
// Time of day: 0 morning (Business) · 1 noon (Engineering) · 1.5 dusk · 2 night (Delivery).
// Walking moves the sun continuously; picking a lens jumps the whole room to that lens.

type Key = {
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

const KEYS: [number, Key][] = [
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
  milk: THREE.Color
  glow: number
  skyTop: THREE.Color
  skyLow: THREE.Color
  env: number
  shafts: number
  dust: number
  lamp: number
  night: number
}

// Shared, mutable. Written once per frame by DayRig (priority -2), read by everything else.
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

const C = KEYS.map(([t, k]) => ({
  t,
  k,
  sun: new THREE.Vector3(...k.sun).normalize(),
  sunColor: new THREE.Color(k.sunColor),
  sky: new THREE.Color(k.sky),
  ground: new THREE.Color(k.ground),
  fog: new THREE.Color(k.fog),
  milk: new THREE.Color(k.milk),
  skyTop: new THREE.Color(k.skyTop),
  skyLow: new THREE.Color(k.skyLow),
}))

const lerp = THREE.MathUtils.lerp

export function evalDay(tod: number) {
  const t = THREE.MathUtils.clamp(tod, 0, 2)
  let i = 0
  while (i < C.length - 2 && t > C[i + 1].t) i += 1
  const a = C[i]
  const b = C[i + 1]
  const raw = (t - a.t) / (b.t - a.t)
  const f = raw * raw * (3 - 2 * raw)
  day.tod = t
  day.sunDir.copy(a.sun).lerp(b.sun, f).normalize()
  day.sunColor.copy(a.sunColor).lerp(b.sunColor, f)
  day.sunI = lerp(a.k.sunI, b.k.sunI, f)
  day.sky.copy(a.sky).lerp(b.sky, f)
  day.ground.copy(a.ground).lerp(b.ground, f)
  day.hemiI = lerp(a.k.hemiI, b.k.hemiI, f)
  day.fog.copy(a.fog).lerp(b.fog, f)
  day.fogNear = lerp(a.k.fogNear, b.k.fogNear, f)
  day.fogFar = lerp(a.k.fogFar, b.k.fogFar, f)
  day.milk.copy(a.milk).lerp(b.milk, f)
  day.glow = lerp(a.k.glow, b.k.glow, f)
  day.skyTop.copy(a.skyTop).lerp(b.skyTop, f)
  day.skyLow.copy(a.skyLow).lerp(b.skyLow, f)
  day.env = lerp(a.k.env, b.k.env, f)
  day.shafts = lerp(a.k.shafts, b.k.shafts, f)
  day.dust = lerp(a.k.dust, b.k.dust, f)
  day.lamp = lerp(a.k.lamp, b.k.lamp, f)
  day.night = lerp(a.k.night, b.k.night, f)
}

export const LENS_TOD: Record<Lens, number> = { business: 0, engineering: 1, delivery: 2 }

function band(p: number, a: number, b: number) {
  return THREE.MathUtils.smoothstep(p, a, b)
}

// The walk is one day: morning at the door, noon by Devias and Imperio, dusk at COOPEF, night at the end.
export function todAt(progress: number) {
  return band(progress, 0.12, 0.38) + 0.5 * band(progress, 0.66, 0.82) + 0.5 * band(progress, 0.84, 0.95)
}

evalDay(0)
