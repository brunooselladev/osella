// Geometry builders. The room and the props are hundreds of boxes and beams; drawing each as its
// own mesh would cost hundreds of draw calls, so a Builder accumulates transformed pieces and
// merges them into one geometry (one draw call). QuadBuilder does the same for flat panes.

// ===== External modules =====
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// ===== Internal modules =====
import { boxUV } from './textures'

// ===== Types =====

type PieceOptions = {
  /** Euler rotation (radians). */
  rot?: [number, number, number]
  /** Vertex colour multiplier, used to vary wood tones (needs `Builder(true)`). */
  tint?: number
  /** Texture tile size in metres; scales the box UVs so the grain keeps its scale. */
  tile?: number
  /** Run the texture's V axis along the box's longest side. */
  grain?: boolean
}

// ===== Constants =====

// Reused by every `add` so building the room allocates nothing per piece.
const scratchMatrix = new THREE.Matrix4()
const scratchQuaternion = new THREE.Quaternion()
const scratchEuler = new THREE.Euler()
const scratchPosition = new THREE.Vector3()
const unitScale = new THREE.Vector3(1, 1, 1)
const up = new THREE.Vector3(0, 1, 0)

// ===== Class: Builder =====

export class Builder {
  parts: THREE.BufferGeometry[] = []
  /** Whether pieces carry a vertex colour (`tint`). */
  colors: boolean

  constructor(colors = false) {
    this.colors = colors
  }

  /** Adds any geometry at `position`, rotated by `rot`. Takes ownership and disposes the original. */
  add(geometry: THREE.BufferGeometry, position: [number, number, number], options: PieceOptions = {}) {
    const flat = geometry.index ? geometry.toNonIndexed() : geometry
    if (geometry.index) geometry.dispose()
    if (!flat.getAttribute('uv')) {
      flat.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(flat.getAttribute('position').count * 2), 2))
    }
    const [rx, ry, rz] = options.rot ?? [0, 0, 0]
    scratchMatrix.compose(scratchPosition.set(...position), scratchQuaternion.setFromEuler(scratchEuler.set(rx, ry, rz)), unitScale)
    flat.applyMatrix4(scratchMatrix)
    if (this.colors) this.paint(flat, options.tint)
    this.parts.push(flat)
    return this
  }

  /** A box of w × h × d metres centred at `position`. */
  box(w: number, h: number, d: number, position: [number, number, number], options: PieceOptions = {}) {
    const geometry = new THREE.BoxGeometry(w, h, d)
    if (options.tile) boxUV(geometry, w, h, d, options.tile, options.grain)
    return this.add(geometry, position, options)
  }

  /** A bar between two points with a w × h section. */
  beam(from: THREE.Vector3, to: THREE.Vector3, w: number, h = w, options: PieceOptions = {}) {
    const direction = new THREE.Vector3().subVectors(to, from)
    const length = direction.length()
    const geometry = new THREE.BoxGeometry(w, length, h)
    if (options.tile) boxUV(geometry, w, length, h, options.tile, options.grain)
    const flat = geometry.toNonIndexed()
    geometry.dispose()
    scratchQuaternion.setFromUnitVectors(up, direction.normalize())
    scratchMatrix.compose(scratchPosition.addVectors(from, to).multiplyScalar(0.5), scratchQuaternion, unitScale)
    flat.applyMatrix4(scratchMatrix)
    if (this.colors) this.paint(flat, options.tint)
    this.parts.push(flat)
    return this
  }

  /** One geometry out of every part added so far; the parts are disposed. */
  merge() {
    const merged = mergeGeometries(this.parts, false)
    for (const part of this.parts) part.dispose()
    this.parts = []
    if (!merged) throw new Error('Builder.merge: nothing to merge')
    merged.computeBoundingSphere()
    return merged
  }

  /** Fills the vertex colour attribute with one grey level. */
  private paint(geometry: THREE.BufferGeometry, tint = 1) {
    const count = geometry.getAttribute('position').count
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(count * 3).fill(tint), 3))
  }
}

// ===== Class: QuadBuilder =====

/** Flat quads (two triangles each) with per-quad uv 0..1 and a random seed the glass shader reads. */
export class QuadBuilder {
  positions: number[] = []
  normals: number[] = []
  uvs: number[] = []
  seeds: number[] = []
  random: () => number

  constructor(random: () => number) {
    this.random = random
  }

  /** Corners a b c d counter-clockwise: a(0,0) b(1,0) c(1,1) d(0,1). */
  quad(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, seed = this.random()) {
    // The normal comes from the diagonals, so a quad that degenerates into a triangle still gets one.
    const normal = new THREE.Vector3().subVectors(c, a).cross(new THREE.Vector3().subVectors(d, b))
    if (normal.lengthSq() < 1e-12) return
    normal.normalize()
    const corners = [a, b, c, a, c, d]
    const cornerUvs = [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]
    corners.forEach((corner, index) => {
      this.positions.push(corner.x, corner.y, corner.z)
      this.normals.push(normal.x, normal.y, normal.z)
      this.uvs.push(cornerUvs[index * 2], cornerUvs[index * 2 + 1])
      this.seeds.push(seed)
    })
  }

  geometry() {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(this.normals, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(this.uvs, 2))
    geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(this.seeds, 1))
    geometry.computeBoundingSphere()
    return geometry
  }
}
