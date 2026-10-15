// Compares two folders made by scripts/fruit-shots.mjs: mean pixel difference per frame, the
// share of pixels that differ by more than 24/255, and a diff-NN.png per frame with those pixels
// in red. Two captures of the same code differ by ~1-3% on frames 02 and 03 (the glass fruit's
// temporal distortion, the film grain, text rasterization); anything above that is a real change.
//
//   npx -y -p pngjs node scripts/fruit-diff.mjs <dirA> <dirB>
//
// FRAMES=02,03 limits the frames.

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { PNG } from 'pngjs'

const [dirA, dirB] = process.argv.slice(2)
const frames = (process.env.FRAMES || '01,02,03,04').split(',')
if (!dirA || !dirB) {
  console.error('usage: node scripts/fruit-diff.mjs <dirA> <dirB>')
  process.exit(1)
}

/** A pixel counts as different above this mean channel delta (0..255). */
const THRESHOLD = 24

for (const frame of frames) {
  const a = PNG.sync.read(readFileSync(join(dirA, `frame-${frame}.png`)))
  const b = PNG.sync.read(readFileSync(join(dirB, `frame-${frame}.png`)))
  const out = new PNG({ width: a.width, height: a.height })
  const pixels = a.width * a.height
  let sum = 0
  let over = 0
  for (let i = 0; i < pixels; i++) {
    const o = i * 4
    const delta = (Math.abs(a.data[o] - b.data[o]) + Math.abs(a.data[o + 1] - b.data[o + 1]) + Math.abs(a.data[o + 2] - b.data[o + 2])) / 3
    sum += delta
    const changed = delta > THRESHOLD
    if (changed) over++
    // faded copy of A with the changed pixels in red
    out.data[o] = changed ? 255 : a.data[o] * 0.35 + 160
    out.data[o + 1] = changed ? 0 : a.data[o + 1] * 0.35 + 160
    out.data[o + 2] = changed ? 0 : a.data[o + 2] * 0.35 + 160
    out.data[o + 3] = 255
  }
  writeFileSync(join(dirB, `diff-${frame}.png`), PNG.sync.write(out))
  console.log(`frame ${frame}: mean diff ${(sum / pixels).toFixed(2)} / 255, pixels differing by >${THRESHOLD}: ${((over / pixels) * 100).toFixed(2)}%`)
}
