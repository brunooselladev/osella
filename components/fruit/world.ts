// Greenhouse dimensions, 1 unit = 1 m. Entrance gable at z = 0, end wall at z = LENGTH.

export const HALF = 2.95
export const KNEE = 0.72
export const EAVE = 2.8
export const RIDGE = 4.35
export const LENGTH = 20
export const BAY = 2
export const BAYS = LENGTH / BAY

export const BENCH_TOP = 0.86
export const BENCH_IN = 1.42
export const BENCH_OUT = 2.7
export const BENCH_START = 0.9
export const BENCH_END = 19.25

export const DOOR_W = 1.0
export const DOOR_H = 2.15
export const ENTRY_W = 1.56
export const ENTRY_H = 2.3

export const POST = 0.075
export const BAR = 0.028

export function roofY(x: number) {
  return EAVE + (RIDGE - EAVE) * (1 - Math.abs(x) / HALF)
}
