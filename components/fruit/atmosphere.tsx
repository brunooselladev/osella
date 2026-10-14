'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { live } from './bench-live'
import { day } from './day'
import { rng, treeTex } from './textures'
import { EAVE, HALF, LENGTH, RIDGE } from './world'

/* ---------------------------------------------------------------- sky */

export function Sky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uTop: { value: new THREE.Color() },
          uLow: { value: new THREE.Color() },
          uSun: { value: new THREE.Vector3() },
          uSunColor: { value: new THREE.Color() },
          uSunI: { value: 0 },
        },
        vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
        fragmentShader: `uniform vec3 uTop; uniform vec3 uLow; uniform vec3 uSun; uniform vec3 uSunColor; uniform float uSunI; varying vec3 vDir;
          void main(){
            float h = clamp(vDir.y, -0.2, 1.0);
            vec3 col = mix(uLow, uTop, smoothstep(-0.02, 0.55, h));
            float s = max(dot(normalize(vDir), normalize(uSun)), 0.0);
            col += uSunColor * (pow(s, 12.0) * 0.35 + pow(s, 400.0) * 2.0) * uSunI;
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  )
  useFrame(({ camera }) => {
    mat.uniforms.uTop.value.copy(day.skyTop)
    mat.uniforms.uLow.value.copy(day.skyLow)
    mat.uniforms.uSun.value.copy(day.sunDir)
    mat.uniforms.uSunColor.value.copy(day.sunColor)
    mat.uniforms.uSunI.value = Math.min(1, day.sunI / 3)
    sky.current?.position.copy(camera.position)
  })
  const sky = useRef<THREE.Mesh>(null)
  return (
    <mesh ref={sky} material={mat} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[70, 32, 16]} />
    </mesh>
  )
}

/* ---------------------------------------------------------------- trees outside */

export function Trees() {
  const items = useMemo(() => {
    const r = rng(404)
    const out: { pos: [number, number, number]; rot: number; h: number; seed: number }[] = []
    for (let i = 0; i < 16; i++) {
      const s = i % 2 ? 1 : -1
      const z = -6 + r() * (LENGTH + 14)
      const x = s * (HALF + 3 + r() * 9)
      const h = 6 + r() * 6
      out.push({ pos: [x, h / 2 - 0.2, z], rot: Math.atan2(-x, 0) + (r() - 0.5) * 0.6, h, seed: 1 + Math.floor(r() * 3) })
    }
    for (let i = 0; i < 6; i++) {
      const h = 7 + r() * 5
      out.push({ pos: [-12 + r() * 24, h / 2 - 0.2, LENGTH + 4 + r() * 10], rot: Math.PI, h, seed: 1 + Math.floor(r() * 3) })
    }
    for (let i = 0; i < 5; i++) {
      const h = 7 + r() * 5
      const side = i % 2 ? 1 : -1
      out.push({ pos: [side * (4 + r() * 10), h / 2 - 0.2, -10 - r() * 10], rot: 0, h, seed: 1 + Math.floor(r() * 3) })
    }
    return out
  }, [])
  const mats = useMemo(
    () =>
      [1, 2, 3].map(
        (seed) =>
          new THREE.MeshBasicMaterial({
            color: '#8f8a6e',
            alphaMap: treeTex(seed * 17),
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
          }),
      ),
    [],
  )
  const tint = useMemo(() => new THREE.Color(), [])
  useFrame(() => {
    tint.copy(day.fog).lerp(new THREE.Color('#5d5a45'), 0.42 * (1 - day.night))
    for (const m of mats) m.color.copy(tint)
  })
  return (
    <group>
      {items.map((t, i) => (
        <mesh key={i} position={t.pos} rotation-y={t.rot} material={mats[t.seed - 1]} renderOrder={-5}>
          <planeGeometry args={[t.h * 0.8, t.h]} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------------------------------------------------------------- light shafts */

const shaftVertex = /* glsl */ `
attribute vec3 aStart;
attribute vec2 aCorner;
attribute float aSeed;
uniform vec3 uSun;
uniform float uLen;
varying vec2 vUv;
varying float vSeed;
varying vec3 vWorld;
void main() {
  vec3 down = -normalize(uSun);
  vec3 across = normalize(cross(down, vec3(0.0, 0.0, 1.0)));
  if (length(cross(down, vec3(0.0, 0.0, 1.0))) < 0.05) across = vec3(1.0, 0.0, 0.0);
  float width = 0.42 + aSeed * 0.5;
  // walk along the beam until it hits the floor
  float len = min(uLen, (aStart.y - 0.02) / max(-down.y, 0.08));
  vec3 p = aStart + across * (aCorner.x - 0.5) * width + down * aCorner.y * len;
  vUv = aCorner;
  vSeed = aSeed;
  vWorld = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}
`

const shaftFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uI;
uniform float uTime;
varying vec2 vUv;
varying float vSeed;
varying vec3 vWorld;
void main() {
  float edge = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x);
  float fade = smoothstep(0.0, 0.12, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y));
  float flicker = 0.75 + 0.25 * sin(uTime * 0.4 + vSeed * 30.0 + vUv.y * 3.0);
  float near = smoothstep(0.6, 2.4, distance(cameraPosition, vWorld));
  gl_FragColor = vec4(uColor * edge * fade * flicker * near * uI, 1.0);
}
`

export function Shafts({ mobile }: { mobile: boolean }) {
  const geo = useMemo(() => {
    const r = rng(55)
    const starts: number[] = []
    const corners: number[] = []
    const seeds: number[] = []
    const count = mobile ? 7 : 14
    for (let i = 0; i < count; i++) {
      const s = i % 2 ? 1 : -1
      const t = 0.2 + r() * 0.6
      const z = 1 + r() * (LENGTH - 3)
      const start = [s * HALF * (1 - t), EAVE + (RIDGE - EAVE) * t, z]
      const seed = r()
      const quad = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 0],
        [1, 1],
        [0, 1],
      ]
      for (const [cx, cy] of quad) {
        starts.push(...start)
        corners.push(cx, cy)
        seeds.push(seed)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(starts.length), 3))
    g.setAttribute('aStart', new THREE.Float32BufferAttribute(starts, 3))
    g.setAttribute('aCorner', new THREE.Float32BufferAttribute(corners, 2))
    g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1))
    return g
  }, [mobile])
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: shaftVertex,
        fragmentShader: shaftFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
          uSun: { value: new THREE.Vector3(0, 1, 0) },
          uLen: { value: 7 },
          uColor: { value: new THREE.Color() },
          uI: { value: 0 },
          uTime: { value: 0 },
        },
      }),
    [],
  )
  useFrame(({ clock }) => {
    mat.uniforms.uSun.value.copy(day.sunDir)
    mat.uniforms.uColor.value.copy(day.sunColor)
    mat.uniforms.uI.value = day.shafts * 0.07 * Math.min(1, day.sunI / 2.5)
    mat.uniforms.uTime.value = live.reduce ? 0 : clock.elapsedTime
  })
  return <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={5} />
}

/* ---------------------------------------------------------------- dust */

export function Dust({ mobile }: { mobile: boolean }) {
  const count = mobile ? 500 : 1300
  const geo = useMemo(() => {
    const r = rng(9)
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (r() - 0.5) * 2 * (HALF - 0.4)
      pos[i * 3 + 1] = 0.2 + r() * (EAVE + 0.6)
      pos[i * 3 + 2] = -0.5 + r() * (LENGTH + 0.5)
      seed[i] = r()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1))
    return g
  }, [count])
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uI: { value: 1 }, uColor: { value: new THREE.Color('#fff1d6') }, uPx: { value: 1 } },
        vertexShader: `attribute float aSeed; uniform float uTime; uniform float uPx; varying float vA;
          void main(){
            vec3 p = position;
            float t = uTime * (0.03 + aSeed * 0.04);
            p.x += sin(t * 6.0 + aSeed * 40.0) * 0.25;
            p.y += mod(t + aSeed * 3.0, 3.4) - 1.7;
            p.z += cos(t * 4.0 + aSeed * 20.0) * 0.25;
            vec4 mv = viewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            float d = -mv.z;
            gl_PointSize = uPx * (1.2 + aSeed * 2.6) * (6.0 / max(d, 0.5));
            vA = smoothstep(0.3, 1.5, d) * (1.0 - smoothstep(9.0, 16.0, d)) * (0.35 + aSeed * 0.65);
          }`,
        fragmentShader: `uniform vec3 uColor; uniform float uI; varying float vA;
          void main(){
            float r = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.0, r);
            gl_FragColor = vec4(uColor * a * vA * uI, 1.0);
          }`,
      }),
    [],
  )
  useFrame(({ clock, gl }) => {
    mat.uniforms.uTime.value = live.reduce ? 0 : clock.elapsedTime
    mat.uniforms.uI.value = day.dust * 0.55
    mat.uniforms.uPx.value = gl.getPixelRatio()
    mat.uniforms.uColor.value.copy(day.sunColor).lerp(new THREE.Color('#ffc98e'), day.night)
  })
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={6} />
}

