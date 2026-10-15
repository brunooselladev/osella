// Procedural canvas textures, deterministic. In production they are served pre-baked as WebP
// (public/fruit/tex, made by `?bake=1` + scripts/bake-fruit-textures.mjs) and decoded off the main
// thread; the generators stay as the fallback and as the source of truth. Every generator goes
// through `cachedTexture`, so a texture is made (or fetched) once however many pieces use it.

// ===== External modules =====
import * as THREE from 'three'

// ===== Internal modules =====
import { BAKED } from './baked'
import { hasFlag } from './lookdev'

// ===== Types =====

type TextureOptions = {
  /** Colour data (sRGB) rather than linear data such as bump maps. */
  color?: boolean
  /** Tile in both directions. */
  repeat?: boolean
}

// ===== Constants =====

const cache = new Map<string, THREE.Texture>()
/** One promise per baked texture still loading; `texturesReady` waits for all of them. */
const pending: Promise<void>[] = []
/** `?bake=1`: generate everything on canvas and expose it for the bake script. */
const baking = hasFlag('bake')

// ===== Helpers: plumbing =====

/** Resolves once every texture requested so far has its pixels. */
export const texturesReady = () => Promise.all(pending).then(() => undefined)

/** A seeded xorshift RNG, 0..1. Same seed, same sequence, so every bake is identical. */
export const rng = (seed: number) => {
  let state = seed >>> 0 || 1
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return ((state >>> 0) % 100000) / 100000
  }
}

const makeCanvas = (width: number, height = width) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  return { canvas, ctx }
}

/** Wraps a painted canvas as a three texture with the right colour space and wrapping. */
const toTexture = (canvas: HTMLCanvasElement, color = true, repeat = true) => {
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace
  if (repeat) texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 16
  texture.needsUpdate = true
  return texture
}

/** An empty texture that fills itself from the baked WebP, or from the generator if that fails. */
const loadBaked = (key: string, make: () => THREE.Texture, { color = true, repeat = true }: TextureOptions) => {
  const texture = new THREE.Texture()
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace
  if (repeat) texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 16
  texture.flipY = false
  texture.premultiplyAlpha = false
  pending.push(
    new Promise<void>((resolve) => {
      const fallback = () => {
        const made = make()
        texture.image = made.image
        texture.flipY = true
        texture.needsUpdate = true
        resolve()
      }
      new THREE.ImageBitmapLoader()
        .setOptions({ imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none' })
        .load(
          `/fruit/tex/${key}.webp`,
          (bitmap) => {
            texture.image = bitmap
            texture.needsUpdate = true
            resolve()
          },
          undefined,
          fallback,
        )
    }),
  )
  return texture
}

/**
 * The texture for `key`: from the cache, else from the baked WebP when one exists, else generated
 * now. While baking, generators always run and their output is collected on `window.__bake`.
 */
const cachedTexture = (key: string, make: () => THREE.Texture, options: TextureOptions = {}) => {
  const hit = cache.get(key)
  if (hit) return hit
  if (!baking && BAKED.includes(key)) {
    const baked = loadBaked(key, make, options)
    cache.set(key, baked)
    return baked
  }
  const started = performance.now()
  const texture = make()
  const perfWindow = window as Window & { __benchPerf?: Record<string, number>; __bake?: Record<string, string> }
  if (perfWindow.__benchPerf) perfWindow.__benchPerf[`tex:${key}`] = performance.now() - started
  if (baking) (perfWindow.__bake ??= {})[key] = (texture.image as HTMLCanvasElement).toDataURL('image/webp', 0.9)
  cache.set(key, texture)
  return texture
}

// ===== Helpers: noise painting =====

/** Tileable value noise on a grid of `cells`, as a size × size float array. */
const valueNoise = (size: number, cells: number, seed: number) => {
  const random = rng(seed)
  const grid = Array.from({ length: cells * cells }, () => random())
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

/** Fractal noise: `octaves` layers of value noise, each twice as fine and half as strong. */
const fbm = (size: number, seed: number, octaves = 4, base = 4) => {
  const out = new Float32Array(size * size)
  let amplitude = 0.5
  let total = 0
  for (let octave = 0; octave < octaves; octave++) {
    const layer = valueNoise(size, base << octave, seed + octave * 31)
    for (let i = 0; i < out.length; i++) out[i] += layer[i] * amplitude
    total += amplitude
    amplitude *= 0.5
  }
  for (let i = 0; i < out.length; i++) out[i] /= total
  return out
}

/** Paints every pixel from a noise value through `toRgba`. */
const paintNoise = (ctx: CanvasRenderingContext2D, size: number, noise: Float32Array, toRgba: (value: number, index: number) => [number, number, number, number?]) => {
  const image = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < noise.length; i++) {
    const [r, g, b, a] = toRgba(noise[i], i)
    image.data[i * 4] = r
    image.data[i * 4 + 1] = g
    image.data[i * 4 + 2] = b
    image.data[i * 4 + 3] = a ?? 255
  }
  ctx.putImageData(image, 0, 0)
}

/** Multiplies the canvas by fine noise so flat colours get some tooth. */
const overlayGrain = (ctx: CanvasRenderingContext2D, size: number, seed: number, strength: number) => {
  const noise = fbm(size, seed, 3, 32)
  const image = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < noise.length; i++) {
    const k = 1 + (noise[i] - 0.5) * strength
    image.data[i * 4] = Math.min(255, image.data[i * 4] * k)
    image.data[i * 4 + 1] = Math.min(255, image.data[i * 4 + 1] * k)
    image.data[i * 4 + 2] = Math.min(255, image.data[i * 4 + 2] * k)
  }
  ctx.putImageData(image, 0, 0)
}

const hsl = (h: number, s: number, l: number) => `hsl(${h} ${s}% ${l}%)`

// ===== Generators =====

/** Running-bond brick, 1 m × 1 m per tile. `limewash` 1 paints it over in pale lime. */
export const brickTex = (limewash = 0) =>
  cachedTexture(`brick${limewash}`, () => {
    const size = 1024
    const { canvas, ctx } = makeCanvas(size)
    const random = rng(11 + limewash * 7)
    const px = size / 1.0 // pixels per metre
    const brickW = 0.215 * px
    const brickH = 0.065 * px
    const mortar = 0.011 * px
    ctx.fillStyle = limewash ? '#e9e0cf' : '#cdbfa6'
    ctx.fillRect(0, 0, size, size)
    const rows = Math.round(size / (brickH + mortar))
    const rowH = size / rows
    const cols = Math.round(size / (brickW + mortar))
    const colW = size / cols
    for (let row = 0; row < rows; row++) {
      const offset = row % 2 ? colW / 2 : 0
      for (let col = -1; col < cols + 1; col++) {
        const x = col * colW + offset + mortar / 2
        const y = row * rowH + mortar / 2
        const hue = 12 + random() * 14
        const saturation = 32 + random() * 22
        const lightness = 36 + random() * 14 - (random() < 0.08 ? 10 : 0)
        ctx.fillStyle = limewash ? hsl(hue + 18, 22 + random() * 14, 78 + random() * 10) : hsl(hue, saturation, lightness)
        ctx.fillRect(x, y, colW - mortar, rowH - mortar)
        if (!limewash && random() < 0.35) {
          // a paler band on some bricks
          ctx.fillStyle = `rgba(250,240,220,${0.06 + random() * 0.12})`
          ctx.fillRect(x, y + (rowH - mortar) * random() * 0.5, colW - mortar, (rowH - mortar) * 0.5)
        }
      }
    }
    overlayGrain(ctx, size, 5 + limewash, limewash ? 0.25 : 0.45)
    return toTexture(canvas)
  })

/** Herringbone brick floor, 0.8 m per tile. */
export const herringboneTex = () =>
  cachedTexture('herring', () => {
    const size = 1024
    const { canvas, ctx } = makeCanvas(size)
    const random = rng(23)
    const unit = size / 8
    const gap = unit * 0.07
    ctx.fillStyle = '#9a8a78'
    ctx.fillRect(0, 0, size, size)
    const brick = (x: number, y: number, w: number, h: number) => {
      const lightness = 58 + random() * 12
      ctx.fillStyle = hsl(20 + random() * 14, 16 + random() * 14, lightness)
      ctx.fillRect(x * unit + gap, y * unit + gap, w * unit - 2 * gap, h * unit - 2 * gap)
      ctx.fillStyle = `rgba(255,236,210,${random() * 0.12})`
      ctx.fillRect(x * unit + gap, y * unit + gap, w * unit - 2 * gap, (h * unit - 2 * gap) * 0.4)
    }
    // Each cell of the pattern is one horizontal and one vertical brick; the lattice is laid on
    // the diagonal and repeated so the tile edges wrap.
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
    return toTexture(canvas)
  })

/** Wood grain running along V (tile = 0.6 m). */
export const woodTex = (tone: 'bench' | 'door' | 'crate' = 'bench') =>
  cachedTexture(`wood-${tone}`, () => {
    const size = 512
    const { canvas, ctx } = makeCanvas(size)
    const noise = fbm(size, tone === 'door' ? 3 : 17, 4, 4)
    const base = tone === 'door' ? [92, 58, 38] : tone === 'crate' ? [192, 164, 126] : [178, 146, 112]
    paintNoise(ctx, size, noise, (value, index) => {
      const x = index % size
      const y = Math.floor(index / size)
      const ring = Math.sin((x / size) * 70 + value * 18 + Math.sin(y / 60) * 0.6)
      const k = 0.82 + value * 0.3 + ring * 0.07
      return [base[0] * k, base[1] * k, base[2] * k]
    })
    // long fibres
    const random = rng(41)
    ctx.globalAlpha = 0.18
    for (let i = 0; i < 70; i++) {
      ctx.strokeStyle = random() < 0.5 ? '#3d2715' : '#e8cfa6'
      ctx.lineWidth = 0.6 + random() * 1.2
      const x = random() * size
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.bezierCurveTo(x + (random() - 0.5) * 14, size * 0.33, x + (random() - 0.5) * 14, size * 0.66, x, size)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    if (tone === 'bench') {
      // watering stains
      for (let i = 0; i < 9; i++) {
        const cx = random() * size
        const cy = random() * size
        const radius = 20 + random() * 60
        const gradient = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius)
        gradient.addColorStop(0, 'rgba(60,36,20,0.18)')
        gradient.addColorStop(0.85, 'rgba(60,36,20,0.1)')
        gradient.addColorStop(1, 'rgba(60,36,20,0)')
        ctx.fillStyle = gradient
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
      }
    }
    return toTexture(canvas)
  })

/** Damp potting soil with perlite flecks. */
export const soilTex = () =>
  cachedTexture('soil', () => {
    const size = 512
    const { canvas, ctx } = makeCanvas(size)
    const noise = fbm(size, 61, 5, 8)
    paintNoise(ctx, size, noise, (value) => {
      const k = 0.55 + value * 0.75
      return [62 * k, 42 * k, 28 * k]
    })
    const random = rng(77)
    for (let i = 0; i < 900; i++) {
      const pick = random()
      ctx.fillStyle = pick < 0.12 ? 'rgba(236,228,214,0.85)' : pick < 0.5 ? 'rgba(30,18,10,0.6)' : 'rgba(120,88,58,0.5)'
      const fleck = 1 + random() * 3
      ctx.fillRect(random() * size, random() * size, fleck, fleck)
    }
    return toTexture(canvas)
  })

/** Moss / algae patches with alpha. */
export const mossTex = () =>
  cachedTexture('moss', () => {
    const size = 256
    const { canvas, ctx } = makeCanvas(size)
    const noise = fbm(size, 91, 5, 4)
    paintNoise(ctx, size, noise, (value) => {
      const alpha = THREE.MathUtils.smoothstep(value, 0.6, 0.78) * 0.85
      const k = 0.5 + value * 0.45
      return [70 * k, 80 * k, 40 * k, alpha * 255]
    })
    return toTexture(canvas)
  })

/** Grey fbm for bump maps (clay pores, metal pitting). `base` is the coarsest cell count. */
export const bumpTex = (seed = 3, base = 16) =>
  cachedTexture(
    `bump${seed}-${base}`,
    () => {
      const size = 512
      const { canvas, ctx } = makeCanvas(size)
      const noise = fbm(size, seed, 4, base)
      paintNoise(ctx, size, noise, (value) => [value * 255, value * 255, value * 255])
      return toTexture(canvas, false)
    },
    { color: false },
  )

/** Long fibres running along V, for the seed pod. */
export const fiberTex = () =>
  cachedTexture('fiber', () => {
    const size = 512
    const { canvas, ctx } = makeCanvas(size)
    ctx.fillStyle = '#bba57e'
    ctx.fillRect(0, 0, size, size)
    const random = rng(5)
    for (let i = 0; i < 900; i++) {
      const y = random() * size
      const lightness = 44 + random() * 30
      ctx.strokeStyle = hsl(34 + random() * 10, 18 + random() * 16, lightness)
      ctx.globalAlpha = 0.35 + random() * 0.5
      ctx.lineWidth = 0.6 + random() * 1.8
      ctx.beginPath()
      ctx.moveTo(-10, y)
      ctx.bezierCurveTo(size * 0.3, y + (random() - 0.5) * 10, size * 0.7, y + (random() - 0.5) * 10, size + 10, y + (random() - 0.5) * 6)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    overlayGrain(ctx, size, 12, 0.3)
    return toTexture(canvas)
  })

/** Clay skin: warm mottling plus pores. */
export const clayTex = () =>
  cachedTexture('clay', () => {
    const size = 512
    const { canvas, ctx } = makeCanvas(size)
    const noise = fbm(size, 33, 5, 4)
    paintNoise(ctx, size, noise, (value) => {
      const k = 0.8 + value * 0.34
      return [172 * k, 114 * k, 92 * k]
    })
    const random = rng(8)
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = random() < 0.6 ? 'rgba(80,36,20,0.32)' : 'rgba(240,200,170,0.2)'
      const pore = 0.8 + random() * 1.8
      ctx.beginPath()
      ctx.arc(random() * size, random() * size, pore, 0, Math.PI * 2)
      ctx.fill()
    }
    return toTexture(canvas)
  })

/** Leaf with midrib and veins (heart leaf, apex at the top). Not tiled. */
export const leafTex = () =>
  cachedTexture(
    'leaf',
    () => {
      const size = 256
      const { canvas, ctx } = makeCanvas(size)
      const gradient = ctx.createRadialGradient(size / 2, size * 0.7, 10, size / 2, size * 0.55, size * 0.7)
      gradient.addColorStop(0, '#9fb556')
      gradient.addColorStop(1, '#5e7a2c')
      ctx.fillStyle = gradient
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
        for (const side of [-1, 1]) {
          ctx.beginPath()
          ctx.moveTo(size / 2, y)
          ctx.quadraticCurveTo(size / 2 + side * size * 0.2, y - size * 0.1, size / 2 + side * size * 0.42, y - size * 0.2)
          ctx.stroke()
        }
      }
      overlayGrain(ctx, size, 4, 0.25)
      return toTexture(canvas, true, false)
    },
    { repeat: false },
  )

/** Soft canopy shadows seen through the whitewashed glass. Greyscale, tiled. */
export const foliageTex = () =>
  cachedTexture(
    'foliage',
    () => {
      const size = 512
      const { canvas, ctx } = makeCanvas(size)
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, size, size)
      const random = rng(101)
      ctx.filter = 'blur(10px)'
      for (let clump = 0; clump < 7; clump++) {
        const cx = random() * size
        const cy = size * (0.15 + random() * 0.6)
        for (let i = 0; i < 26; i++) {
          const angle = random() * Math.PI * 2
          const distance = random() * 90
          const radius = 14 + random() * 36
          ctx.fillStyle = `rgba(255,255,255,${0.25 + random() * 0.35})`
          // painted nine times, shifted by the tile size, so the blur wraps at the edges
          for (const ox of [-size, 0, size]) {
            for (const oy of [-size, 0, size]) {
              ctx.beginPath()
              ctx.arc(cx + Math.cos(angle) * distance + ox, cy + Math.sin(angle) * distance * 0.7 + oy, radius, 0, Math.PI * 2)
              ctx.fill()
            }
          }
        }
      }
      ctx.filter = 'none'
      return toTexture(canvas, false)
    },
    { color: false },
  )

/** A tree silhouette with alpha, for the cards outside the glass. */
export const treeTex = (seed: number) =>
  cachedTexture(
    `tree${seed}`,
    () => {
      const width = 512
      const height = 640
      const { canvas, ctx } = makeCanvas(width, height)
      const random = rng(seed)
      ctx.clearRect(0, 0, width, height)
      ctx.filter = 'blur(3px)'
      ctx.fillStyle = '#ffffff'
      // trunk
      ctx.beginPath()
      ctx.moveTo(width * 0.47, height)
      ctx.lineTo(width * 0.49, height * 0.45)
      ctx.lineTo(width * 0.53, height * 0.45)
      ctx.lineTo(width * 0.55, height)
      ctx.fill()
      // canopy
      for (let i = 0; i < 80; i++) {
        const angle = random() * Math.PI * 2
        const distance = Math.sqrt(random()) * width * 0.34
        const radius = 18 + random() * 42
        ctx.globalAlpha = 0.55 + random() * 0.45
        ctx.beginPath()
        ctx.arc(width / 2 + Math.cos(angle) * distance, height * 0.36 + Math.sin(angle) * distance * 0.8, radius, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      ctx.filter = 'none'
      return toTexture(canvas, false, false)
    },
    { color: false, repeat: false },
  )

// ===== Helpers: UVs =====

/** Scales a BoxGeometry's UVs to metres (`tile` m per repeat) and turns the grain along the longest side. */
export const boxUV = (geometry: THREE.BufferGeometry, w: number, h: number, d: number, tile = 1, grain = false) => {
  const uv = geometry.getAttribute('uv') as THREE.BufferAttribute
  // faces: +x, -x, +y, -y, +z, -z — (u axis, v axis) sizes
  const faceSizes: [number, number][] = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ]
  const longest = Math.max(w, h, d)
  for (let face = 0; face < 6; face++) {
    const [du, dv] = faceSizes[face]
    const swap = grain && du === longest && dv !== longest
    for (let corner = 0; corner < 4; corner++) {
      const index = face * 4 + corner
      const u = uv.getX(index) * du
      const v = uv.getY(index) * dv
      if (swap) uv.setXY(index, v / tile, u / tile)
      else uv.setXY(index, u / tile, v / tile)
    }
  }
  uv.needsUpdate = true
  return geometry
}
