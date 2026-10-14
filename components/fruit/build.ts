import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { boxUV } from './textures'

// Accumulates transformed pieces and merges them into one draw call.

type PieceOpts = {
  rot?: [number, number, number]
  tint?: number
  tile?: number
  grain?: boolean
}

const M = new THREE.Matrix4()
const Q = new THREE.Quaternion()
const E = new THREE.Euler()
const S = new THREE.Vector3(1, 1, 1)
const P = new THREE.Vector3()

export class Builder {
  parts: THREE.BufferGeometry[] = []
  colors: boolean

  constructor(colors = false) {
    this.colors = colors
  }

  add(geo: THREE.BufferGeometry, pos: [number, number, number], opts: PieceOpts = {}) {
    const g = geo.index ? geo.toNonIndexed() : geo
    if (geo.index) geo.dispose()
    if (!g.getAttribute('uv')) {
      g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.getAttribute('position').count * 2), 2))
    }
    const [rx, ry, rz] = opts.rot ?? [0, 0, 0]
    M.compose(P.set(...pos), Q.setFromEuler(E.set(rx, ry, rz)), S)
    g.applyMatrix4(M)
    if (this.colors) {
      const t = opts.tint ?? 1
      const n = g.getAttribute('position').count
      const arr = new Float32Array(n * 3).fill(t)
      g.setAttribute('color', new THREE.Float32BufferAttribute(arr, 3))
    }
    this.parts.push(g)
    return this
  }

  box(w: number, h: number, d: number, pos: [number, number, number], opts: PieceOpts = {}) {
    const geo = new THREE.BoxGeometry(w, h, d)
    if (opts.tile) boxUV(geo, w, h, d, opts.tile, opts.grain)
    return this.add(geo, pos, opts)
  }

  /** A bar between two points (square section). */
  beam(a: THREE.Vector3, b: THREE.Vector3, w: number, h = w, opts: PieceOpts = {}) {
    const dir = new THREE.Vector3().subVectors(b, a)
    const len = dir.length()
    const geo = new THREE.BoxGeometry(w, len, h)
    if (opts.tile) boxUV(geo, w, len, h, opts.tile, opts.grain)
    const g = geo.toNonIndexed()
    geo.dispose()
    Q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
    M.compose(P.addVectors(a, b).multiplyScalar(0.5), Q, S)
    g.applyMatrix4(M)
    if (this.colors) {
      const n = g.getAttribute('position').count
      g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(n * 3).fill(opts.tint ?? 1), 3))
    }
    this.parts.push(g)
    return this
  }

  merge() {
    const out = mergeGeometries(this.parts, false)
    for (const p of this.parts) p.dispose()
    this.parts = []
    if (!out) throw new Error('merge failed')
    out.computeBoundingSphere()
    return out
  }
}

/** Flat quads (two triangles each) with per-quad uv 0..1 and a random seed. */
export class QuadBuilder {
  pos: number[] = []
  nor: number[] = []
  uv: number[] = []
  seed: number[] = []
  r: () => number

  constructor(r: () => number) {
    this.r = r
  }

  quad(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, seed = this.r()) {
    // a b c d counter-clockwise: a(0,0) b(1,0) c(1,1) d(0,1)
    // diagonals, so a quad that degenerates into a triangle still gets a normal
    const n = new THREE.Vector3().subVectors(c, a).cross(new THREE.Vector3().subVectors(d, b))
    if (n.lengthSq() < 1e-12) return
    n.normalize()
    const verts = [a, b, c, a, c, d]
    const uvs = [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]
    verts.forEach((v, i) => {
      this.pos.push(v.x, v.y, v.z)
      this.nor.push(n.x, n.y, n.z)
      this.uv.push(uvs[i * 2], uvs[i * 2 + 1])
      this.seed.push(seed)
    })
  }

  geometry() {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2))
    g.setAttribute('aSeed', new THREE.Float32BufferAttribute(this.seed, 1))
    g.computeBoundingSphere()
    return g
  }
}
