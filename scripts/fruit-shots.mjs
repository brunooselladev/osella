// Captures /fruit?frame=01..04 (the board's four frames) as PNGs and the ?perf stats of each,
// for before/after comparisons with scripts/fruit-diff.mjs.
//
//   pnpm dev                       (in another terminal)
//   npx -y -p playwright-core node scripts/fruit-shots.mjs <outDir> [http://localhost:3000]
//
// Needs a Chromium-based browser; set BROWSER to its executable if it is not the default Edge.
// FRAMES=02,03 limits the frames.

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const outDir = process.argv[2]
const base = process.argv[3] || 'http://localhost:3000'
const executablePath = process.env.BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const frames = (process.env.FRAMES || '01,02,03,04').split(',')
if (!outDir) {
  console.error('usage: node scripts/fruit-shots.mjs <outDir> [baseUrl]')
  process.exit(1)
}

const { chromium } = await import('playwright-core')
const browser = await chromium.launch({ executablePath, headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=default'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
page.on('pageerror', (error) => console.log('pageerror', error.message))
await mkdir(outDir, { recursive: true })

const stats = {}
for (const frame of frames) {
  await page.goto(`${base}/fruit?frame=${frame}&perf=1`, { waitUntil: 'domcontentloaded', timeout: 180000 })
  await page.waitForSelector('.fruit-canvas.is-ready', { timeout: 120000 })
  // let the damped camera, day and specimens settle
  await page.waitForTimeout(5000)
  await page.addStyleTag({ content: '.fruit-perf{display:none}' })
  await page.screenshot({ path: join(outDir, `frame-${frame}.png`) })
  stats[frame] = await page.evaluate(() => ({ ...(window.__benchStats ?? {}), error: window.__benchErr }))
  console.log(frame, JSON.stringify(stats[frame]))
}
await writeFile(join(outDir, 'stats.json'), JSON.stringify(stats, null, 2))
await browser.close()
