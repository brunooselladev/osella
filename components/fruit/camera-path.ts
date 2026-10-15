// The walk's contract: progress 0..1 → station → lens, plus the camera spline through the room.
// The STATIONS progress keys are closed (see the handoff): the HUD ticks, the ?frame= captures and
// the ?case= URLs all depend on them. Read by BenchApp (DOM) and by CameraRig / FocusRig (canvas).

// ===== Internal modules =====
import type { Lens } from '@/content/types'
import type { Vec3 } from './vec'

// ===== Types =====

export type StationId = 'enter' | 'bucked-up' | 'devias' | 'imperio-tickets' | 'coopef-gym' | 'door'

export type Station = {
  id: StationId
  /** Where on the walk (0..1) the visitor stands in front of it. */
  progress: number
  /** The lens the light follows when the walk reaches it. */
  lens: Lens
  caseId?: string
}

// ===== Constants =====

export const STATIONS: Station[] = [
  { id: 'enter', progress: 0, lens: 'business' },
  { id: 'bucked-up', progress: 0.08, lens: 'business', caseId: 'bucked-up' },
  { id: 'devias', progress: 0.42, lens: 'engineering', caseId: 'devias' },
  { id: 'imperio-tickets', progress: 0.64, lens: 'engineering', caseId: 'imperio-tickets' },
  { id: 'coopef-gym', progress: 0.84, lens: 'delivery', caseId: 'coopef-gym' },
  { id: 'door', progress: 1, lens: 'delivery' },
]

export const CASE_STATIONS = STATIONS.filter((station) => station.caseId)

/** Marks on the HUD track: one per case, plus the door. */
export const HUD_TICKS = CASE_STATIONS.map((station) => station.progress).concat(1)

/** The lens changes halfway between two stations of different lenses. */
const LENS_EDGES = [
  (STATIONS[1].progress + STATIONS[2].progress) / 2,
  (STATIONS[3].progress + STATIONS[4].progress) / 2,
]

/** Visual centre of each specimen; they sit on the side benches, alternating left / right. */
export const SPECIMENS: { id: string; position: Vec3 }[] = [
  { id: 'bucked-up', position: [1.84, 1.27, 4.2] },
  { id: 'devias', position: [-1.86, 1.15, 8.4] },
  { id: 'imperio-tickets', position: [1.86, 1.42, 12.2] },
  { id: 'coopef-gym', position: [-2.08, 1.75, 15.8] },
]

/**
 * Camera position per station, one node per STATIONS entry. Each station stands just behind the
 * previous specimen, so it slides out of frame on its side while the next one comes into focus
 * (frame 02: Bucked exits left).
 */
export const CAMERA_POS: Vec3[] = [
  [-0.02, 1.62, -3.15],
  [-0.32, 1.6, 0.55],
  [0.62, 1.58, 2.0],
  [-0.66, 1.58, 6.25],
  [0.62, 1.6, 10.05],
  [0.1, 1.6, 13.7],
]

/** Where the camera looks from each station. */
export const CAMERA_LOOK: Vec3[] = [
  [0.18, 1.42, 7.5],
  [0.55, 1.22, 4.4],
  [0.28, 1.22, 8.4],
  [-0.3, 1.3, 12.2],
  [-0.55, 1.4, 15.8],
  [-0.3, 1.32, 20],
]

// ===== Helpers =====

/** The station of `list` whose progress is closest to `progress`. */
const nearest = (list: Station[], progress: number) => {
  let best = list[0]
  let bestDistance = Infinity
  for (const station of list) {
    const distance = Math.abs(station.progress - progress)
    if (distance < bestDistance) {
      bestDistance = distance
      best = station
    }
  }
  return best
}

export const lensAt = (progress: number): Lens => {
  if (progress < LENS_EDGES[0]) return 'business'
  if (progress < LENS_EDGES[1]) return 'engineering'
  return 'delivery'
}

export const stationForCase = (caseId: string) => CASE_STATIONS.find((station) => station.caseId === caseId)

/** Ids of the cases the walk has already passed at `progress`. */
export const casesVisitedAt = (progress: number) =>
  CASE_STATIONS.filter((station) => progress >= station.progress).map((station) => station.caseId as string)

export const nearestStation = (progress: number) => nearest(STATIONS, progress)

export const nearestCaseStation = (progress: number) => nearest(CASE_STATIONS, progress)

/**
 * Maps progress (uneven between stations) to the uniform parameter of the camera curves, so every
 * station lands exactly on one node of CAMERA_POS / CAMERA_LOOK.
 */
export const splineT = (progress: number) => {
  const keys = STATIONS.map((station) => station.progress)
  const last = keys.length - 1
  const clamped = Math.max(0, Math.min(1, progress))
  let index = 0
  while (index < last - 1 && clamped > keys[index + 1]) index += 1
  const span = keys[index + 1] - keys[index] || 1
  const local = (clamped - keys[index]) / span
  return (index + local) / last
}
