import * as THREE from 'three'

// Procedural canvas textures. Zero download, deterministic, generated once per page.

const cache = new Map<string, THREE.Texture>()

export function rng(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 100000) / 100000
  }
}

function canvas(size: number, h = size) {
  const c = document.createElement('canvas')
  c.width = size
  c.height = h
  const ctx = c.getContext('2d')!
  return { c, ctx }
}

function finish(c: HTMLCanvasElement, color = true, repeat = true) {
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 8
  tex.needsUpdate = true
  return tex
}

function once(key: string, make: () => THREE.Texture) {
  const hit = cache.get(key)
  if (hit) return hit
  const tex = make()
  cache.set(key, tex)
  return tex
}

// Tileable value noise on a grid of `cells`.
function valueNoise(size: number, cells: number, seed: number) {
  const r = rng(seed)
  const grid = Array.from({ length: cells * cells }, () => r())
  const out = new Float32Array(size * size)
  for (let y = 0; y < size; y++) {
    const gy = (y / size) * cells
    const y0 = Math.floor(gy)
    const fy = gy - y0
    const sy = fy * fy * (3 - 2 * fy)
    for (let x = 0; x < size; x++) {
      const gx = (x / size) * cells
      const x0 = Math.floor(gx)
      const fx = gx - x0
      const sx = fx * fx * (3 - 2 * fx)
      const a = grid[(y0 % cells) * cells + (x0 % cells)]
      const b = grid[(y0 % cells) * cells + ((x0 + 1) % cells)]
      const c = grid[((y0 + 1) % cells) * cells + (x0 % cells)]
      const d = grid[((y0 + 1) % cells) * cells + ((x0 + 1) % cells)]
      out[y * size + x] = a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
    }
  }
  return out
}

function fbm(size: number, seed: number, octaves = 4, base = 4) {
  const out = new Float32Array(size * size)
  let amp = 0.5
  let total = 0
  for (let o = 0; o < octaves; o++) {
    const n = valueNoise(size, base << o, seed + o * 31)
    for (let i = 0; i < out.length; i++) out[i] += n[i] * amp
    total += amp
    amp *= 0.5
  }
  for (let i = 0; i < out.length; i++) out[i] /= total
  return out
}

function paintNoise(ctx: CanvasRenderingContext2D, size: number, n: Float32Array, fn: (v: number, i: number) => [number, number, number, number?]) {
  const img = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < n.length; i++) {
    const [r, g, b, a] = fn(n[i], i)
    img.data[i * 4] = r
    img.data[i * 4 + 1] = g
    img.data[i * 4 + 2] = b
    img.data[i * 4 + 3] = a ?? 255
  }
  ctx.putImageData(img, 0, 0)
}

function overlayGrain(ctx: CanvasRenderingContext2D, size: number, seed: number, strength: number) {
  const n = fbm(size, seed, 3, 32)
  const img = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < n.length; i++) {
    const k = 1 + (n[i] - 0.5) * strength
    img.data[i * 4] = Math.min(255, img.data[i * 4] * k)
    img.data[i * 4 + 1] = Math.min(255, img.data[i * 4 + 1] * k)
    img.data[i * 4 + 2] = Math.min(255, img.data[i * 4 + 2] * k)
  }
  ctx.putImageData(img, 0, 0)
}

const hsl = (h: number, s: number, l: number) => `hsl(${h} ${s}% ${l}%)`

/** Running-bond brick, 1 m × 1 m per tile. */
export function brickTex(limewash = 0) {
  return once(`brick${limewash}`, () => {
    const size = 1024
    const { c, ctx } = canvas(size)
    const r = rng(11 + limewash * 7)
    const px = size / 1.0
    const bw = 0.215 * px
    const bh = 0.065 * px
    const m = 0.011 * px
    ctx.fillStyle = limewash ? '#e9e0cf' : '#cdbfa6'
    ctx.fillRect(0, 0, size, size)
    const rows = Math.round(size / (bh + m))
    const rowH = size / rows
    const cols = Math.round(size / (bw + m))
    const colW = size / cols
    for (let row = 0; row < rows; row++) {
      const off = row % 2 ? colW / 2 : 0
      for (let col = -1; col < cols + 1; col++) {
        const x = col * colW + off + m / 2
        const y = row * rowH + m / 2
        const h = 12 + r() * 14
        const s = 32 + r() * 22
        const l = 36 + r() * 14 - (r() < 0.08 ? 10 : 0)
        ctx.fillStyle = limewash ? hsl(h + 18, 22 + r() * 14, 78 + r() * 10) : hsl(h, s, l)
        ctx.fillRect(x, y, colW - m, rowH - m)
        if (!limewash && r() < 0.35) {
          ctx.fillStyle = `rgba(250,240,220,${0.06 + r() * 0.12})`
          ctx.fillRect(x, y + (rowH - m) * r() * 0.5, colW - m, (rowH - m) * 0.5)
        }
      }
    }
    overlayGrain(ctx, size, 5 + limewash, limewash ? 0.25 : 0.45)
    return finish(c)
  })
}

/** Herringbone brick floor, 0.8 m per tile. */
export function herringboneTex() {
  return once('herring', () => {
    const size = 1024
    const { c, ctx } = canvas(size)
    const r = rng(23)
    const u = size / 8
    const g = u * 0.07
    ctx.fillStyle = '#9a8a78'
    ctx.fillRect(0, 0, size, size)
    const brick = (x: number, y: number, w: number, h: number) => {
      const l = 58 + r() * 12
      ctx.fillStyle = hsl(20 + r() * 14, 16 + r() * 14, l)
      ctx.fillRect(x * u + g, y * u + g, w * u - 2 * g, h * u - 2 * g)
      ctx.fillStyle = `rgba(255,236,210,${r() * 0.12})`
      ctx.fillRect(x * u + g, y * u + g, w * u - 2 * g, (h * u - 2 * g) * 0.4)
    }
    for (let i = -12; i < 20; i++) {
      for (let j = -8; j < 8; j++) {
        const ox = i + 2 * j
        const oy = i - 2 * j
        if (ox < -4 || ox > 10 || oy < -4 || oy > 10) continue
        for (const [dx, dy] of [
          [0, 0],
          [8, 0],
          [0, 8],
          [-8, 0],
          [0, -8],
        ]) {
          brick(ox + dx, oy + dy, 2, 1)
          brick(ox + dx, oy + dy + 1, 1, 2)
        }
      }
    }
    overlayGrain(ctx, size, 9, 0.4)
    return finish(c)
  })
}

/** Wood grain running along V (tile = 0.6 m). */
export function woodTex(tone: 'bench' | 'door' | 'crate' = 'bench') {
  return once(`wood-${tone}`, () => {
    const size = 512
    const { c, ctx } = canvas(size)
    const n = fbm(size, tone === 'door' ? 3 : 17, 4, 4)
    const base = tone === 'door' ? [92, 58, 38] : tone === 'crate' ? [192, 164, 126] : [178, 146, 112]
    paintNoise(ctx, size, n, (v, i) => {
      const x = i % size
      const y = Math.floor(i / size)
      const ring = Math.sin((x / size) * 70 + v * 18 + Math.sin(y / 60) * 0.6)
      const k = 0.82 + v * 0.3 + ring * 0.07
      return [base[0] * k, base[1] * k, base[2] * k]
    })
    const r = rng(41)
    ctx.globalAlpha = 0.18
    for (let i = 0; i < 70; i++) {
      ctx.strokeStyle = r() < 0.5 ? '#3d2715' : '#e8cfa6'
      ctx.lineWidth = 0.6 + r() * 1.2
      const x = r() * size
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.bezierCurveTo(x + (r() - 0.5) * 14, size * 0.33, x + (r() - 0.5) * 14, size * 0.66, x, size)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    if (tone === 'bench') {
      // watering stains
      for (let i = 0; i < 9; i++) {
        const gx = r() * size
        const gy = r() * size
        const rad = 20 + r() * 60
        const grd = ctx.createRadialGradient(gx, gy, rad * 0.2, gx, gy, rad)
        grd.addColorStop(0, 'rgba(60,36,20,0.18)')
        grd.addColorStop(0.85, 'rgba(60,36,20,0.1)')
        grd.addColorStop(1, 'rgba(60,36,20,0)')
        ctx.fillStyle = grd
        ctx.fillRect(gx - rad, gy - rad, rad * 2, rad * 2)
      }
    }
    return finish(c)
  })
}

/** Damp potting soil with perlite flecks. */
export function soilTex() {
  return once('soil', () => {
    const size = 512
    const { c, ctx } = canvas(size)
    const n = fbm(size, 61, 5, 8)
    paintNoise(ctx, size, n, (v) => {
      const k = 0.55 + v * 0.75
      return [62 * k, 42 * k, 28 * k]
    })
    const r = rng(77)
    for (let i = 0; i < 900; i++) {
      const p = r()
      ctx.fillStyle = p < 0.12 ? 'rgba(236,228,214,0.85)' : p < 0.5 ? 'rgba(30,18,10,0.6)' : 'rgba(120,88,58,0.5)'
      const s = 1 + r() * 3
      ctx.fillRect(r() * size, r() * size, s, s)
    }
    return finish(c)
  })
}

/** Moss / algae patches, greyscale alpha. */
export function mossTex() {
  return once('moss', () => {
    const size = 256
    const { c, ctx } = canvas(size)
    const n = fbm(size, 91, 5, 4)
    paintNoise(ctx, size, n, (v) => {
      const a = THREE.MathUtils.smoothstep(v, 0.6, 0.78) * 0.85
      const k = 0.5 + v * 0.45
      return [70 * k, 80 * k, 40 * k, a * 255]
    })
    return finish(c)
  })
}

/** Grey fBm for bump maps (clay pores, metal pitting). */
export function bumpTex(seed = 3, base = 16) {
  return once(`bump${seed}-${base}`, () => {
    const size = 512
    const { c, ctx } = canvas(size)
    const n = fbm(size, seed, 4, base)
    paintNoise(ctx, size, n, (v) => [v * 255, v * 255, v * 255])
    return finish(c, false)
  })
}

/** Long fibres running along V, for the seed pod. */
export function fiberTex() {
  return once('fiber', () => {
    const w = 512
    const { c, ctx } = canvas(w)
    ctx.fillStyle = '#bba57e'
    ctx.fillRect(0, 0, w, w)
    const r = rng(5)
    for (let i = 0; i < 900; i++) {
      const y = r() * w
      const l = 44 + r() * 30
      ctx.strokeStyle = hsl(34 + r() * 10, 18 + r() * 16, l)
      ctx.globalAlpha = 0.35 + r() * 0.5
      ctx.lineWidth = 0.6 + r() * 1.8
      ctx.beginPath()
      ctx.moveTo(-10, y)
      ctx.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 10, w * 0.7, y + (r() - 0.5) * 10, w + 10, y + (r() - 0.5) * 6)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    overlayGrain(ctx, w, 12, 0.3)
    return finish(c)
  })
}

/** Clay skin: warm mottling + pores. */
export function clayTex() {
  return once('clay', () => {
    const size = 512
    const { c, ctx } = canvas(size)
    const n = fbm(size, 33, 5, 4)
    paintNoise(ctx, size, n, (v) => {
      const k = 0.8 + v * 0.34
      return [172 * k, 114 * k, 92 * k]
    })
    const r = rng(8)
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = r() < 0.6 ? 'rgba(80,36,20,0.32)' : 'rgba(240,200,170,0.2)'
      const s = 0.8 + r() * 1.8
      ctx.beginPath()
      ctx.arc(r() * size, r() * size, s, 0, Math.PI * 2)
      ctx.fill()
    }
    return finish(c)
  })
}

/** Leaf with midrib and veins (heart leaf, apex at top). */
export function leafTex() {
  return once('leaf', () => {
    const size = 256
    const { c, ctx } = canvas(size)
    const grd = ctx.createRadialGradient(size / 2, size * 0.7, 10, size / 2, size * 0.55, size * 0.7)
    grd.addColorStop(0, '#9fb556')
    grd.addColorStop(1, '#5e7a2c')
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = 'rgba(226,236,168,0.55)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(size / 2, size)
    ctx.lineTo(size / 2, 6)
    ctx.stroke()
    ctx.lineWidth = 1.6
    for (let i = 0; i < 6; i++) {
      const y = size * (0.85 - i * 0.13)
      for (const s of [-1, 1]) {
        ctx.beginPath()
        ctx.moveTo(size / 2, y)
        ctx.quadraticCurveTo(size / 2 + s * size * 0.2, y - size * 0.1, size / 2 + s * size * 0.42, y - size * 0.2)
        ctx.stroke()
      }
    }
    overlayGrain(ctx, size, 4, 0.25)
    return finish(c, true, false)
  })
}

/** Soft canopy shadows seen through the whitewashed glass. Greyscale. */
export function foliageTex() {
  return once('foliage', () => {
    const size = 512
    const { c, ctx } = canvas(size)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, size, size)
    const r = rng(101)
    ctx.filter = 'blur(10px)'
    for (let t = 0; t < 7; t++) {
      const cx = r() * size
      const cy = size * (0.15 + r() * 0.6)
      for (let i = 0; i < 26; i++) {
        const a = r() * Math.PI * 2
        const d = r() * 90
        const rad = 14 + r() * 36
        ctx.fillStyle = `rgba(255,255,255,${0.25 + r() * 0.35})`
        for (const ox of [-size, 0, size]) {
          for (const oy of [-size, 0, size]) {
            ctx.beginPath()
            ctx.arc(cx + Math.cos(a) * d + ox, cy + Math.sin(a) * d * 0.7 + oy, rad, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
    }
    ctx.filter = 'none'
    return finish(c, false)
  })
}

/** A tree silhouette with alpha, for the cards outside the glass. */
export function treeTex(seed: number) {
  return once(`tree${seed}`, () => {
    const w = 512
    const h = 640
    const { c, ctx } = canvas(w, h)
    const r = rng(seed)
    ctx.clearRect(0, 0, w, h)
    ctx.filter = 'blur(3px)'
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.moveTo(w * 0.47, h)
    ctx.lineTo(w * 0.49, h * 0.45)
    ctx.lineTo(w * 0.53, h * 0.45)
    ctx.lineTo(w * 0.55, h)
    ctx.fill()
    for (let i = 0; i < 80; i++) {
      const a = r() * Math.PI * 2
      const d = Math.sqrt(r()) * w * 0.34
      const rad = 18 + r() * 42
      ctx.globalAlpha = 0.55 + r() * 0.45
      ctx.beginPath()
      ctx.arc(w / 2 + Math.cos(a) * d, h * 0.36 + Math.sin(a) * d * 0.8, rad, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.filter = 'none'
    return finish(c, false, false)
  })
}

/** Scales a BoxGeometry's UVs to metres and turns the grain along the box's longest side. */
export function boxUV(geo: THREE.BufferGeometry, w: number, h: number, d: number, tile = 1, grain = false) {
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute
  // faces: +x, -x, +y, -y, +z, -z — (u axis, v axis) sizes
  const dims: [number, number][] = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ]
  const longest = Math.max(w, h, d)
  for (let f = 0; f < 6; f++) {
    const [du, dv] = dims[f]
    const swap = grain && du === longest && dv !== longest
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k
      const u = uv.getX(i) * du
      const v = uv.getY(i) * dv
      if (swap) uv.setXY(i, v / tile, u / tile)
      else uv.setXY(i, u / tile, v / tile)
    }
  }
  uv.needsUpdate = true
  return geo
}
