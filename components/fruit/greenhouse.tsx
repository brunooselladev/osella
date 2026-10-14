'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { live } from './bench-live'
import { Builder, QuadBuilder } from './build'
import { nearestCaseStation, SPECIMENS } from './camera-path'
import { day } from './day'
import { initGlass, makeGlassMaterial, syncGlass } from './glass'
import { brickTex, bumpTex, herringboneTex, rng, soilTex, woodTex } from './textures'
import {
  BAR,
  BAY,
  BAYS,
  BENCH_END,
  BENCH_IN,
  BENCH_OUT,
  BENCH_START,
  BENCH_TOP,
  DOOR_H,
  DOOR_W,
  EAVE,
  ENTRY_H,
  ENTRY_W,
  HALF,
  KNEE,
  LENGTH,
  POST,
  RIDGE,
  roofY,
} from './world'

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const MID = (KNEE + EAVE) / 2
const SLOPE = Math.atan2(RIDGE - EAVE, HALF)
const VENT = { bay: 2, side: 1, t0: 0.58, t1: 0.9, z0: 4.5, z1: 5.5, open: 0.42 }

export const LAMP_POS = V(-1.95, BENCH_TOP + 0.42, 18.7)

/* ---------------------------------------------------------------- frame */

function frameGeometry() {
  const b = new Builder()
  for (let k = 0; k <= BAYS; k++) {
    const z = k * BAY
    for (const s of [-1, 1]) {
      // post
      b.box(POST, EAVE - KNEE, POST, [s * (HALF - POST / 2), MID, z])
      // rafter, eave to ridge
      b.beam(V(s * HALF, EAVE, z), V(0, RIDGE, z), 0.07, 0.09)
      // cast spandrel bracket
      const shape = new THREE.Shape()
      const r = 0.34
      shape.moveTo(0, 0)
      shape.lineTo(r, 0)
      shape.absarc(r, -r, r, Math.PI / 2, Math.PI, false)
      shape.lineTo(0, 0)
      const hole = new THREE.Path()
      hole.absarc(0.085, -0.085, 0.045, 0, Math.PI * 2, true)
      shape.holes.push(hole)
      const ext = new THREE.ExtrudeGeometry(shape, { depth: 0.022, bevelEnabled: false, curveSegments: 10 })
      ext.translate(0, 0, -0.011)
      if (s > 0) ext.scale(-1, 1, 1)
      b.add(ext, [s * (HALF - POST), EAVE - 0.02, z])
    }
    // tie rod with ring, every other frame
    if (k % 2 === 1) {
      b.add(new THREE.CylinderGeometry(0.011, 0.011, HALF * 2 - 0.1, 6), [0, EAVE + 0.06, z], { rot: [0, 0, Math.PI / 2] })
    }
  }
  for (const s of [-1, 1]) {
    // gutter / eave beam, knee sill, transom, purlins
    b.box(0.13, 0.11, LENGTH + 0.3, [s * HALF, EAVE, LENGTH / 2])
    b.box(0.09, 0.05, LENGTH, [s * HALF, KNEE + 0.025, LENGTH / 2])
    b.box(0.04, 0.035, LENGTH, [s * HALF, MID, LENGTH / 2])
    for (const t of [0.34, 0.67]) {
      b.box(0.05, 0.05, LENGTH, [s * HALF * (1 - t), EAVE + (RIDGE - EAVE) * t - 0.03, LENGTH / 2], { rot: [0, 0, -s * SLOPE] })
    }
    // glazing bars
    for (let k = 0; k < BAYS; k++) {
      for (let j = 1; j < 4; j++) {
        const z = k * BAY + j * 0.5
        b.box(BAR, EAVE - KNEE, BAR, [s * HALF, MID, z])
        b.beam(V(s * HALF, EAVE, z), V(0, RIDGE, z), BAR, BAR)
      }
    }
  }
  b.box(0.1, 0.14, LENGTH + 0.3, [0, RIDGE, LENGTH / 2])
  // ridge cresting outside
  for (let z = 0.25; z < LENGTH; z += 0.5) b.add(new THREE.TorusGeometry(0.06, 0.008, 4, 12), [0, RIDGE + 0.14, z], { rot: [0, Math.PI / 2, 0] })

  // entrance gable
  for (let x = -HALF + 0.5; x < HALF - 0.01; x += 0.5) {
    const inDoor = Math.abs(x) < ENTRY_W / 2 + 0.01
    const y0 = inDoor ? ENTRY_H + 0.06 : KNEE
    b.box(BAR, roofY(x) - y0, BAR, [x, (roofY(x) + y0) / 2, 0])
  }
  b.box(HALF * 2, 0.05, 0.06, [0, EAVE, 0])
  b.box(0.08, ENTRY_H, 0.1, [-ENTRY_W / 2 - 0.04, ENTRY_H / 2, 0])
  b.box(0.08, ENTRY_H, 0.1, [ENTRY_W / 2 + 0.04, ENTRY_H / 2, 0])
  b.box(ENTRY_W + 0.16, 0.08, 0.1, [0, ENTRY_H + 0.04, 0])
  const side = HALF - ENTRY_W / 2 - 0.08
  for (const s of [-1, 1]) b.box(side, 0.05, 0.06, [s * (ENTRY_W / 2 + 0.08 + side / 2), MID, 0])
  // finial
  b.add(new THREE.SphereGeometry(0.06, 12, 8), [0, RIDGE + 0.2, -0.02])
  b.add(new THREE.ConeGeometry(0.025, 0.22, 8), [0, RIDGE + 0.36, -0.02])

  // end gable above the brick wall
  for (let x = -HALF + 0.5; x < HALF - 0.01; x += 0.5) b.box(BAR, roofY(x) - EAVE, BAR, [x, (roofY(x) + EAVE) / 2, LENGTH])

  // roof vent frame (open)
  const vz0 = VENT.z0
  const vz1 = VENT.z1
  const ventFrame = new Builder()
  const vl = (VENT.t1 - VENT.t0) * Math.hypot(HALF, RIDGE - EAVE)
  ventFrame.box(0.04, 0.04, vz1 - vz0, [0, 0, (vz0 + vz1) / 2])
  ventFrame.box(0.04, 0.04, vz1 - vz0, [0, -vl, (vz0 + vz1) / 2])
  ventFrame.box(0.035, vl, 0.035, [0, -vl / 2, vz0])
  ventFrame.box(0.035, vl, 0.035, [0, -vl / 2, vz1])
  const vent = ventFrame.merge()
  const hinge = V(VENT.side * HALF * (1 - VENT.t1), EAVE + (RIDGE - EAVE) * VENT.t1, 0)
  vent.applyMatrix4(new THREE.Matrix4().makeRotationZ(VENT.side * (Math.PI / 2 - SLOPE) + VENT.side * VENT.open))
  vent.translate(hinge.x, hinge.y, 0)
  b.parts.push(vent)
  return b.merge()
}

/* ---------------------------------------------------------------- glass */

function glassGeometry() {
  const q = new QuadBuilder(rng(7))
  const inset = 0.006
  for (const s of [-1, 1]) {
    const x = s * (HALF + 0.005)
    for (let k = 0; k < BAYS; k++) {
      for (let j = 0; j < 4; j++) {
        const z0 = k * BAY + j * 0.5 + inset
        const z1 = z0 + 0.5 - inset * 2
        for (const [y0, y1] of [
          [KNEE + 0.05, MID],
          [MID, EAVE - 0.05],
        ]) {
          q.quad(V(x, y0, z0), V(x, y0, z1), V(x, y1, z1), V(x, y1, z0))
        }
        // roof: five lapped panes up the slope
        for (let r = 0; r < 5; r++) {
          const t0 = r / 5
          const t1 = (r + 1) / 5 + 0.012
          const zc = (z0 + z1) / 2
          if (s === VENT.side && zc > VENT.z0 && zc < VENT.z1 && t0 >= VENT.t0 - 0.05 && t1 <= VENT.t1 + 0.1) continue
          const p0 = (t: number) => [s * HALF * (1 - t), EAVE + (RIDGE - EAVE) * t + 0.02] as const
          const [ax, ay] = p0(t0)
          const [bx, by] = p0(t1)
          q.quad(V(ax, ay, z0), V(ax, ay, z1), V(bx, by, z1), V(bx, by, z0))
        }
      }
    }
  }
  // entrance gable panes, kept clear of the doorway
  const E = ENTRY_W / 2 + 0.08
  for (let x0 = -HALF; x0 < HALF - 0.01; x0 += 0.5) {
    const x1 = x0 + 0.5
    const spans: [number, number, boolean][] = []
    if (x1 <= -E || x0 >= E) spans.push([x0, x1, false])
    else {
      if (x0 < -E) spans.push([x0, -E, false])
      spans.push([Math.max(x0, -E), Math.min(x1, E), true])
      if (x1 > E) spans.push([E, x1, false])
    }
    for (const [a, b, door] of spans) {
      const rows: [number, number][] = door
        ? [[ENTRY_H + 0.08, EAVE]]
        : [
            [KNEE + 0.04, MID],
            [MID, EAVE],
          ]
      for (const [y0, y1] of rows) q.quad(V(a + inset, y0, -0.01), V(b - inset, y0, -0.01), V(b - inset, y1, -0.01), V(a + inset, y1, -0.01))
    }
    q.quad(V(x0 + inset, EAVE, -0.01), V(x1 - inset, EAVE, -0.01), V(x1 - inset, roofY(x1), -0.01), V(x0 + inset, roofY(x0), -0.01))
  }
  // end gable triangle
  for (let x0 = -HALF; x0 < HALF - 0.01; x0 += 0.5) {
    const x1 = x0 + 0.5
    q.quad(V(x0, EAVE, LENGTH - 0.03), V(x1, EAVE, LENGTH - 0.03), V(x1, roofY(x1), LENGTH - 0.03), V(x0, roofY(x0), LENGTH - 0.03))
  }
  // the open vent pane
  const vl = (VENT.t1 - VENT.t0) * Math.hypot(HALF, RIDGE - EAVE)
  const hinge = V(VENT.side * HALF * (1 - VENT.t1), EAVE + (RIDGE - EAVE) * VENT.t1, 0)
  const rot = new THREE.Matrix4().makeRotationZ(VENT.side * (Math.PI / 2 - SLOPE) + VENT.side * VENT.open)
  const pv = (y: number, z: number) => V(0, y, z).applyMatrix4(rot).add(V(hinge.x, hinge.y, 0))
  q.quad(pv(0, VENT.z0), pv(0, VENT.z1), pv(-vl, VENT.z1), pv(-vl, VENT.z0), 0.99)
  return q.geometry()
}

/* ---------------------------------------------------------------- masonry */

function wallGeometry() {
  const b = new Builder()
  const t = 0.22
  for (const s of [-1, 1]) b.box(t, KNEE, LENGTH + t, [s * (HALF - 0.04), KNEE / 2, LENGTH / 2], { tile: 1 })
  const side = HALF - ENTRY_W / 2 - 0.08
  for (const s of [-1, 1]) b.box(side, KNEE, t, [s * (ENTRY_W / 2 + 0.08 + side / 2), KNEE / 2, 0], { tile: 1 })
  return b.merge()
}

function endWallGeometry() {
  const b = new Builder()
  const t = 0.24
  const z = LENGTH + t / 2 - 0.02
  const side = HALF - DOOR_W / 2 - 0.06
  for (const s of [-1, 1]) b.box(side, EAVE, t, [s * (DOOR_W / 2 + 0.06 + side / 2), EAVE / 2, z], { tile: 1 })
  b.box(DOOR_W + 0.12, EAVE - DOOR_H - 0.06, t, [0, (EAVE + DOOR_H + 0.06) / 2, z], { tile: 1 })
  return b.merge()
}

function copingGeometry() {
  const b = new Builder()
  for (const s of [-1, 1]) b.box(0.3, 0.05, LENGTH + 0.3, [s * (HALF - 0.04), KNEE + 0.02, LENGTH / 2], { tile: 0.5 })
  const side = HALF - ENTRY_W / 2 - 0.08
  for (const s of [-1, 1]) b.box(side, 0.05, 0.3, [s * (ENTRY_W / 2 + 0.08 + side / 2), KNEE + 0.02, 0], { tile: 0.5 })
  b.box(ENTRY_W + 0.3, 0.04, 0.5, [0, 0.02, 0])
  return b.merge()
}

/* ---------------------------------------------------------------- benches */

function benchGeometry() {
  const b = new Builder(true)
  const r = rng(19)
  const planks = 9
  const depth = BENCH_OUT - BENCH_IN
  const pw = depth / planks
  for (const s of [-1, 1]) {
    for (let i = 0; i < planks; i++) {
      const x = s * (BENCH_IN + pw * (i + 0.5))
      let z = BENCH_START
      while (z < BENCH_END - 0.01) {
        const len = Math.min(BENCH_END - z, 2.6 + r() * 3.4)
        b.box(pw - 0.014, 0.034, len - 0.006, [x, BENCH_TOP - 0.017, z + len / 2], { tile: 0.6, grain: true, tint: 0.84 + r() * 0.3 })
        z += len
      }
    }
    // aprons
    b.box(0.03, 0.15, BENCH_END - BENCH_START, [s * (BENCH_IN - 0.015), BENCH_TOP - 0.06, (BENCH_START + BENCH_END) / 2], { tile: 0.6, grain: true, tint: 0.78 })
    b.box(0.03, 0.15, BENCH_END - BENCH_START, [s * (BENCH_OUT + 0.015), BENCH_TOP - 0.06, (BENCH_START + BENCH_END) / 2], { tile: 0.6, grain: true, tint: 0.7 })
    for (const z of [BENCH_START, BENCH_END]) b.box(depth + 0.06, 0.15, 0.03, [s * (BENCH_IN + depth / 2), BENCH_TOP - 0.06, z], { tile: 0.6, grain: true, tint: 0.75 })
    // legs and rails
    for (let z = BENCH_START + 0.06; z < BENCH_END; z += 1.6) {
      for (const x of [BENCH_IN + 0.05, BENCH_OUT - 0.05]) b.box(0.07, BENCH_TOP - 0.05, 0.07, [s * x, (BENCH_TOP - 0.05) / 2, z], { tile: 0.6, grain: true, tint: 0.72 + r() * 0.12 })
      b.box(depth - 0.1, 0.06, 0.035, [s * (BENCH_IN + depth / 2), 0.3, z], { tile: 0.6, grain: true, tint: 0.7 })
    }
    // lower shelf
    for (let i = 0; i < 6; i++) {
      const x = s * (BENCH_IN + 0.1 + (i + 0.5) * ((depth - 0.2) / 6))
      b.box((depth - 0.2) / 6 - 0.02, 0.025, BENCH_END - BENCH_START - 0.2, [x, 0.345, (BENCH_START + BENCH_END) / 2], { tile: 0.6, grain: true, tint: 0.62 + r() * 0.2 })
    }
  }
  return b.merge()
}

/* ---------------------------------------------------------------- pieces */

function Floor() {
  const aisle = useMemo(() => {
    const t = herringboneTex().clone()
    t.repeat.set((BENCH_IN * 2) / 0.8, LENGTH / 0.8)
    t.needsUpdate = true
    return t
  }, [])
  const path = useMemo(() => {
    const t = herringboneTex().clone()
    t.repeat.set(ENTRY_W / 0.8, 7 / 0.8)
    t.needsUpdate = true
    return t
  }, [])
  const gravel = useMemo(() => {
    const t = soilTex().clone()
    t.repeat.set(2, 30)
    t.needsUpdate = true
    return t
  }, [])
  const outside = useMemo(() => {
    const t = bumpTex(71, 8).clone()
    t.repeat.set(30, 30)
    t.needsUpdate = true
    return t
  }, [])
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, LENGTH / 2]} receiveShadow>
        <planeGeometry args={[BENCH_IN * 2, LENGTH]} />
        <meshStandardMaterial map={aisle} roughness={0.86} color="#e8d4bf" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} rotation-x={-Math.PI / 2} position={[s * (BENCH_IN + (HALF - BENCH_IN) / 2), 0.001, LENGTH / 2]} receiveShadow>
          <planeGeometry args={[HALF - BENCH_IN, LENGTH]} />
          <meshStandardMaterial map={gravel} roughness={1} color="#d8c3a6" />
        </mesh>
      ))}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.003, -3.5]} receiveShadow>
        <planeGeometry args={[ENTRY_W, 7]} />
        <meshStandardMaterial map={path} roughness={0.9} color="#e8d4bf" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 8]} receiveShadow>
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial color="#c9b48c" roughness={1} bumpMap={outside} bumpScale={0.6} />
      </mesh>
      {/* drain channel down the aisle */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, LENGTH / 2]} receiveShadow>
        <planeGeometry args={[0.1, LENGTH - 0.4]} />
        <meshStandardMaterial color="#3a3029" roughness={0.6} metalness={0.4} />
      </mesh>
    </group>
  )
}

function Masonry() {
  const walls = useMemo(wallGeometry, [])
  const end = useMemo(endWallGeometry, [])
  const coping = useMemo(copingGeometry, [])
  const brick = brickTex(0)
  const lime = brickTex(1)
  const stone = bumpTex(5, 12)
  return (
    <group>
      <mesh geometry={walls} castShadow receiveShadow userData={{ occluder: true }}>
        <meshStandardMaterial map={brick} roughness={0.92} bumpMap={brick} bumpScale={1.2} />
      </mesh>
      <mesh geometry={end} castShadow receiveShadow userData={{ occluder: true }}>
        <meshStandardMaterial map={lime} roughness={0.95} bumpMap={lime} bumpScale={1.2} />
      </mesh>
      <mesh geometry={coping} castShadow receiveShadow>
        <meshStandardMaterial color="#d9cfbd" roughness={0.9} bumpMap={stone} bumpScale={1} />
      </mesh>
    </group>
  )
}

function Frame() {
  const geo = useMemo(frameGeometry, [])
  return (
    <mesh geometry={geo} castShadow receiveShadow userData={{ occluder: true }}>
      <meshStandardMaterial color="#2f322a" roughness={0.5} metalness={0.3} side={THREE.DoubleSide} />
    </mesh>
  )
}

function Glass() {
  const geo = useMemo(glassGeometry, [])
  const mat = useMemo(() => makeGlassMaterial(), [])
  useEffect(() => {
    initGlass(mat)
    mat.uniforms.uLampPos.value.copy(LAMP_POS)
  }, [mat])
  useFrame(() => syncGlass(mat))
  return <mesh geometry={geo} material={mat} renderOrder={2} />
}

function Benches() {
  const geo = useMemo(benchGeometry, [])
  const map = woodTex('bench')
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial map={map} vertexColors roughness={0.82} />
    </mesh>
  )
}

/* ---------------------------------------------------------------- door, lamp */

function EndDoor() {
  const wood = woodTex('door')
  const panes = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a2118', emissive: '#ffcf96', emissiveIntensity: 0.5, roughness: 0.15, side: THREE.BackSide }), [])
  const leak = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb36b').multiplyScalar(2.6), transparent: true, opacity: 0.12, toneMapped: false }), [])
  const spot = useRef<THREE.SpotLight>(null)
  const z = LENGTH - 0.03
  const geo = useMemo(() => {
    const b = new Builder()
    b.box(DOOR_W - 0.04, DOOR_H - 0.03, 0.05, [0, (DOOR_H - 0.03) / 2, z], { tile: 0.6, grain: true })
    for (const x of [-0.22, 0.22]) b.box(0.32, 0.72, 0.03, [x, 0.5, z - 0.03], { tile: 0.6, grain: true })
    b.box(0.86, 0.04, 0.03, [0, 1.08, z - 0.03], { tile: 0.6, grain: true })
    // casing
    b.box(0.08, DOOR_H + 0.1, 0.08, [-DOOR_W / 2 - 0.04, (DOOR_H + 0.1) / 2, z - 0.04], { tile: 0.6, grain: true })
    b.box(0.08, DOOR_H + 0.1, 0.08, [DOOR_W / 2 + 0.04, (DOOR_H + 0.1) / 2, z - 0.04], { tile: 0.6, grain: true })
    b.box(DOOR_W + 0.24, 0.1, 0.09, [0, DOOR_H + 0.07, z - 0.04], { tile: 0.6, grain: true })
    // window muntins
    b.box(0.03, 0.66, 0.035, [0, 1.62, z - 0.035])
    b.box(0.78, 0.03, 0.035, [0, 1.62, z - 0.035])
    return b.merge()
  }, [z])
  const fanMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uI: { value: 0 }, uColor: { value: new THREE.Color('#ffc58a') } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
        fragmentShader: `uniform float uI; uniform vec3 uColor; varying vec2 vUv;
          void main(){
            float w = mix(0.22, 0.5, vUv.y);
            float x = abs(vUv.x - 0.5);
            float side = 1. - smoothstep(w * 0.35, w, x);
            float len = pow(clamp(1. - vUv.y, 0., 1.), 1.6);
            gl_FragColor = vec4(uColor * side * len * uI, 1.);
          }`,
      }),
    [],
  )
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-6 * dt)
    panes.emissiveIntensity += (0.45 + day.lamp * 2.6 - panes.emissiveIntensity) * k
    leak.opacity += (0.12 + day.lamp * 0.88 - leak.opacity) * k
    fanMat.uniforms.uI.value += (day.lamp * 0.42 - fanMat.uniforms.uI.value) * k
    if (spot.current) spot.current.intensity += (day.lamp * 9 - spot.current.intensity) * k
  })
  return (
    <group>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial map={wood} color="#5b5246" roughness={0.6} />
      </mesh>
      {[-0.2, 0.2].map((x) =>
        [1.45, 1.79].map((y) => (
          <mesh key={`${x}${y}`} position={[x, y, z - 0.03]} material={panes}>
            <planeGeometry args={[0.36, 0.3]} />
          </mesh>
        )),
      )}
      <mesh position={[0.36, 1.0, z - 0.06]}>
        <sphereGeometry args={[0.03, 12, 10]} />
        <meshStandardMaterial color="#c79b52" metalness={0.9} roughness={0.3} />
      </mesh>
      {/* light leaking round the leaf */}
      {(
        [
          [-DOOR_W / 2 + 0.01, DOOR_H / 2, 0.016, DOOR_H],
          [DOOR_W / 2 - 0.01, DOOR_H / 2, 0.016, DOOR_H],
          [0, DOOR_H - 0.005, DOOR_W, 0.014],
          [0, 0.006, DOOR_W, 0.012],
        ] as const
      ).map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, z - 0.03]} rotation-y={Math.PI} material={leak}>
          <planeGeometry args={[w, h]} />
        </mesh>
      ))}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.006, LENGTH - 2.2]} material={fanMat}>
        <planeGeometry args={[3, 4.4]} />
      </mesh>
      <spotLight ref={spot} position={[0, 1.3, LENGTH - 0.25]} angle={0.9} penumbra={0.9} distance={10} decay={1.6} color="#ffc68e" intensity={0} target-position={[0, 0, LENGTH - 6]} />
    </group>
  )
}

function Lantern() {
  const bulb = useRef<THREE.MeshStandardMaterial>(null)
  const light = useRef<THREE.PointLight>(null)
  const shade = useMemo(() => {
    const pts = [V(0.004, 0.17, 0), V(0.04, 0.165, 0), V(0.11, 0.1, 0), V(0.15, 0.03, 0), V(0.155, 0.02, 0)].map((p) => new THREE.Vector2(p.x, p.y))
    return new THREE.LatheGeometry(pts, 28)
  }, [])
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-6 * dt)
    if (bulb.current) bulb.current.emissiveIntensity += (0.3 + day.lamp * 9 - bulb.current.emissiveIntensity) * k
    if (light.current) light.current.intensity += (day.lamp * 2.4 - light.current.intensity) * k
  })
  const base = BENCH_TOP
  return (
    <group position={[LAMP_POS.x, base, LAMP_POS.z]} scale={0.72}>
      <mesh position={[0, 0.01, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.1, 0.02, 24]} />
        <meshStandardMaterial color="#3a352c" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.38, 8]} />
        <meshStandardMaterial color="#3a352c" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.24, 0]} geometry={shade} castShadow>
        <meshStandardMaterial color="#c9b48a" metalness={0.7} roughness={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.29, 0]}>
        <sphereGeometry args={[0.03, 14, 10]} />
        <meshStandardMaterial ref={bulb} color="#fff3dc" emissive="#ffcf8f" emissiveIntensity={0.3} toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[0, 0.27, 0]} color="#ffc27e" intensity={0} distance={5.5} decay={1.7} />
    </group>
  )
}

function EntranceLeaves() {
  const geo = useMemo(() => {
    const b = new Builder()
    const w = ENTRY_W / 2 - 0.02
    const h = ENTRY_H - 0.04
    b.box(0.05, h, 0.04, [0.025, h / 2, 0])
    b.box(0.05, h, 0.04, [w - 0.025, h / 2, 0])
    b.box(w, 0.06, 0.04, [w / 2, h - 0.03, 0])
    b.box(w, 0.06, 0.04, [w / 2, 0.03, 0])
    b.box(w, 0.06, 0.04, [w / 2, 0.85, 0])
    b.box(0.025, h - 0.9, 0.03, [w / 2, (h + 0.88) / 2, 0])
    b.box(w - 0.06, 0.03, 0.03, [w / 2, (h + 0.88) / 2, 0])
    return b.merge()
  }, [])
  const glass = useMemo(() => {
    const q = new QuadBuilder(rng(3))
    const w = ENTRY_W / 2 - 0.02
    const h = ENTRY_H - 0.04
    q.quad(V(0.05, 0.88, 0), V(w - 0.05, 0.88, 0), V(w - 0.05, h - 0.06, 0), V(0.05, h - 0.06, 0), 0.97)
    return q.geometry()
  }, [])
  const mat = useMemo(() => makeGlassMaterial(0.35), [])
  useEffect(() => initGlass(mat), [mat])
  useFrame(() => syncGlass(mat))
  return (
    <>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (ENTRY_W / 2), 0, -0.04]} rotation-y={s > 0 ? 1.22 : 1.92}>
          <mesh geometry={geo} castShadow>
            <meshStandardMaterial color="#2f322a" roughness={0.5} metalness={0.3} />
          </mesh>
          <mesh geometry={glass} material={mat} renderOrder={2} />
        </group>
      ))}
    </>
  )
}

/* ---------------------------------------------------------------- engineering cut */

function CutLine() {
  const line = useMemo(() => {
    const pts = [V(0, BENCH_TOP + 0.004, 0), V(1, BENCH_TOP + 0.004, 0), V(1, EAVE, 0)]
    const geom = new THREE.BufferGeometry().setFromPoints(pts)
    const mat = new THREE.LineDashedMaterial({ color: '#e0566b', dashSize: 0.09, gapSize: 0.06, transparent: true, opacity: 0, depthTest: true, toneMapped: false })
    const l = new THREE.Line(geom, mat)
    l.computeLineDistances()
    return l
  }, [])
  useFrame((_, dt) => {
    const mat = line.material as THREE.LineDashedMaterial
    const want = live.lens === 'engineering' ? 0.9 : 0
    mat.opacity = THREE.MathUtils.damp(mat.opacity, want, 6, dt)
    line.visible = mat.opacity > 0.01
    const station = nearestCaseStation(live.progress)
    const spec = SPECIMENS.find((s) => s.id === (live.selectedId ?? station.caseId)) ?? SPECIMENS[0]
    const s = Math.sign(spec.position[0])
    const pos = line.geometry.getAttribute('position') as THREE.BufferAttribute
    const z = spec.position[2]
    pos.setXYZ(0, s * (BENCH_IN - 0.02), BENCH_TOP + 0.004, z)
    pos.setXYZ(1, s * (HALF - 0.08), BENCH_TOP + 0.004, z)
    pos.setXYZ(2, s * (HALF - 0.08), EAVE - 0.06, z)
    pos.needsUpdate = true
    line.computeLineDistances()
  })
  return <primitive object={line} />
}

function on(name: string) {
  if (typeof window === 'undefined') return true
  const off = new URLSearchParams(window.location.search).get('off')
  return !off || !off.split(',').includes(name)
}

export function Greenhouse() {
  return (
    <group>
      {on('floor') ? <Floor /> : null}
      {on('masonry') ? <Masonry /> : null}
      {on('frame') ? <Frame /> : null}
      {on('benches') ? <Benches /> : null}
      {on('glass') ? <Glass /> : null}
      {on('leaves') ? <EntranceLeaves /> : null}
      {on('door') ? <EndDoor /> : null}
      {on('lantern') ? <Lantern /> : null}
      {on('cut') ? <CutLine /> : null}
    </group>
  )
}
