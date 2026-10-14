import type { Lens } from '@/content/types'

export type StationId = 'enter' | 'bucked-up' | 'devias' | 'imperio-tickets' | 'coopef-gym' | 'door'

export type Station = {
  id: StationId
  progress: number
  lens: Lens
  caseId?: string
}

export const STATIONS: Station[] = [
  { id: 'enter', progress: 0, lens: 'business' },
  { id: 'bucked-up', progress: 0.08, lens: 'business', caseId: 'bucked-up' },
  { id: 'devias', progress: 0.42, lens: 'engineering', caseId: 'devias' },
  { id: 'imperio-tickets', progress: 0.64, lens: 'engineering', caseId: 'imperio-tickets' },
  { id: 'coopef-gym', progress: 0.84, lens: 'delivery', caseId: 'coopef-gym' },
  { id: 'door', progress: 1, lens: 'delivery' },
]

export const CASE_STATIONS = STATIONS.filter((station) => station.caseId)

export const HUD_TICKS = CASE_STATIONS.map((station) => station.progress).concat(1)

const LENS_EDGES = [
  (STATIONS[1].progress + STATIONS[2].progress) / 2,
  (STATIONS[3].progress + STATIONS[4].progress) / 2,
]

export function lensAt(progress: number): Lens {
  if (progress < LENS_EDGES[0]) return 'business'
  if (progress < LENS_EDGES[1]) return 'engineering'
  return 'delivery'
}

export function stationForCase(caseId: string) {
  return CASE_STATIONS.find((station) => station.caseId === caseId)
}

export function casesVisitedAt(progress: number) {
  return CASE_STATIONS.filter((station) => progress >= station.progress).map((station) => station.caseId as string)
}

export function nearestStation(progress: number) {
  let best = STATIONS[0]
  let dist = Infinity
  for (const station of STATIONS) {
    const d = Math.abs(station.progress - progress)
    if (d < dist) {
      dist = d
      best = station
    }
  }
  return best
}

export function nearestCaseStation(progress: number) {
  let best = CASE_STATIONS[0]
  let dist = Infinity
  for (const station of CASE_STATIONS) {
    const d = Math.abs(station.progress - progress)
    if (d < dist) {
      dist = d
      best = station
    }
  }
  return best
}

export type Vec3 = [number, number, number]

// Visual centre of each specimen; they sit on the side benches, alternating left / right.
export const SPECIMENS: { id: string; position: Vec3 }[] = [
  { id: 'bucked-up', position: [1.84, 1.27, 4.2] },
  { id: 'devias', position: [-1.86, 1.15, 8.4] },
  { id: 'imperio-tickets', position: [1.86, 1.42, 12.2] },
  { id: 'coopef-gym', position: [-2.08, 1.75, 15.8] },
]

// Each station stands just behind the previous specimen, so it slides out of frame
// on its side while the next one comes into focus (frame 02: Bucked exits left).
export const CAMERA_POS: Vec3[] = [
  [-0.02, 1.62, -3.15],
  [-0.32, 1.6, 0.55],
  [0.62, 1.58, 2.0],
  [-0.66, 1.58, 6.25],
  [0.62, 1.6, 10.05],
  [0.1, 1.6, 13.7],
]

export const CAMERA_LOOK: Vec3[] = [
  [0.18, 1.42, 7.5],
  [0.55, 1.22, 4.4],
  [0.28, 1.22, 8.4],
  [-0.3, 1.3, 12.2],
  [-0.55, 1.4, 15.8],
  [-0.3, 1.32, 20],
]

export function splineT(progress: number) {
  const keys = STATIONS.map((station) => station.progress)
  const last = keys.length - 1
  const p = Math.max(0, Math.min(1, progress))
  let i = 0
  while (i < last - 1 && p > keys[i + 1]) i += 1
  const span = keys[i + 1] - keys[i] || 1
  const local = (p - keys[i]) / span
  return (i + local) / last
}

export function progressToScroll(progress: number, range: number) {
  return Math.max(0, Math.min(1, progress)) * range
}

export function scrollToProgress(scroll: number, range: number) {
  if (range <= 0) return 0
  return Math.max(0, Math.min(1, scroll / range))
}
