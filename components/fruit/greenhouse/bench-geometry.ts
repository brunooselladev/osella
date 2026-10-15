// The two long potting benches: planks of random lengths, aprons, legs with rails, and a slatted
// lower shelf. Vertex colours vary the wood tone per piece. Sizes in metres.

// ===== Internal modules =====
import { Builder } from '../build'
import { rng } from '../textures'
import { BENCH_END, BENCH_IN, BENCH_OUT, BENCH_START, BENCH_TOP } from '../world'

// ===== Constants =====

/** Planks across the bench top. */
const PLANKS = 9
/** Slats on the lower shelf. */
const SHELF_SLATS = 6
/** Wood texture tile (m). */
const WOOD_TILE = 0.6
/** Distance between leg pairs (m). */
const LEG_SPACING = 1.6

// ===== Builder =====

export const benchGeometry = () => {
  const builder = new Builder(true)
  const random = rng(19)
  const depth = BENCH_OUT - BENCH_IN
  const plankWidth = depth / PLANKS
  for (const side of [-1, 1]) {
    // top: each plank is a run of boards 2.6–6 m long
    for (let i = 0; i < PLANKS; i++) {
      const x = side * (BENCH_IN + plankWidth * (i + 0.5))
      let z = BENCH_START
      while (z < BENCH_END - 0.01) {
        const length = Math.min(BENCH_END - z, 2.6 + random() * 3.4)
        builder.box(plankWidth - 0.014, 0.034, length - 0.006, [x, BENCH_TOP - 0.017, z + length / 2], { tile: WOOD_TILE, grain: true, tint: 0.84 + random() * 0.3 })
        z += length
      }
    }
    // aprons along both edges and across both ends
    builder.box(0.03, 0.15, BENCH_END - BENCH_START, [side * (BENCH_IN - 0.015), BENCH_TOP - 0.06, (BENCH_START + BENCH_END) / 2], { tile: WOOD_TILE, grain: true, tint: 0.78 })
    builder.box(0.03, 0.15, BENCH_END - BENCH_START, [side * (BENCH_OUT + 0.015), BENCH_TOP - 0.06, (BENCH_START + BENCH_END) / 2], { tile: WOOD_TILE, grain: true, tint: 0.7 })
    for (const z of [BENCH_START, BENCH_END]) builder.box(depth + 0.06, 0.15, 0.03, [side * (BENCH_IN + depth / 2), BENCH_TOP - 0.06, z], { tile: WOOD_TILE, grain: true, tint: 0.75 })
    // legs and rails
    for (let z = BENCH_START + 0.06; z < BENCH_END; z += LEG_SPACING) {
      for (const x of [BENCH_IN + 0.05, BENCH_OUT - 0.05]) builder.box(0.07, BENCH_TOP - 0.05, 0.07, [side * x, (BENCH_TOP - 0.05) / 2, z], { tile: WOOD_TILE, grain: true, tint: 0.72 + random() * 0.12 })
      builder.box(depth - 0.1, 0.06, 0.035, [side * (BENCH_IN + depth / 2), 0.3, z], { tile: WOOD_TILE, grain: true, tint: 0.7 })
    }
    // lower shelf
    for (let i = 0; i < SHELF_SLATS; i++) {
      const x = side * (BENCH_IN + 0.1 + (i + 0.5) * ((depth - 0.2) / SHELF_SLATS))
      builder.box((depth - 0.2) / SHELF_SLATS - 0.02, 0.025, BENCH_END - BENCH_START - 0.2, [x, 0.345, (BENCH_START + BENCH_END) / 2], { tile: WOOD_TILE, grain: true, tint: 0.62 + random() * 0.2 })
    }
  }
  return builder.merge()
}
