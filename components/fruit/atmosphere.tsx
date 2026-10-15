'use client'

// What surrounds and fills the room: the sky dome, the trees outside the glass, the light shafts
// and the dust. All of it reads `day` every frame; none of it is interactive.

// ===== External modules =====
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ===== Internal modules =====
import { live } from './bench-live'
import { day } from './day'
import { rng, treeTex } from './textures'
import { EAVE, HALF, LENGTH, RIDGE } from './world'

// ===== Types =====

type TreeCard = { position: [number, number, number]; rotation: number; height: number; seed: number }

// ===== Constants =====

/** How much the trees darken from the fog colour in daylight. */
const TREE_SHADE = new THREE.Color('#5d5a45')
/** The warm colour the dust takes at night, under the lantern. */
const DUST_NIGHT = new THREE.Color('#ffc98e')

// ===== Shaders =====

// Sky: a vertical gradient with a soft and a sharp sun glow.
const skyVertexShader = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const skyFragmentShader = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uLow;
uniform vec3 uSun;
uniform vec3 uSunColor;
uniform float uSunI;
varying vec3 vDir;
void main() {
  float h = clamp(vDir.y, -0.2, 1.0);
  vec3 col = mix(uLow, uTop, smoothstep(-0.02, 0.55, h));
  float s = max(dot(normalize(vDir), normalize(uSun)), 0.0);
  col += uSunColor * (pow(s, 12.0) * 0.35 + pow(s, 400.0) * 2.0) * uSunI;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`

// Shafts: each beam is a quad built in the vertex shader from its start point, the sun direction
// and the corner it represents, so moving the sun re-aims every beam for free.
const shaftVertexShader = /* glsl */ `
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

const shaftFragmentShader = /* glsl */ `
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

// Dust: points that drift on sine waves and fall slowly, fading with distance.
const dustVertexShader = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uPx;
varying float vA;
void main() {
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
}
`

const dustFragmentShader = /* glsl */ `
uniform vec3 uColor;
uniform float uI;
varying float vA;
void main() {
  float r = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, r);
  gl_FragColor = vec4(uColor * a * vA * uI, 1.0);
}
`

// ===== Component: Sky =====

/** A dome that follows the camera, coloured by the day. */
export const Sky = () => {
  // --- Refs & state ---
  const domeRef = useRef<THREE.Mesh>(null)
  const material = useMemo(
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
        vertexShader: skyVertexShader,
        fragmentShader: skyFragmentShader,
      }),
    [],
  )

  // --- Frame ---
  useFrame(({ camera }) => {
    material.uniforms.uTop.value.copy(day.skyTop)
    material.uniforms.uLow.value.copy(day.skyLow)
    material.uniforms.uSun.value.copy(day.sunDir)
    material.uniforms.uSunColor.value.copy(day.sunColor)
    material.uniforms.uSunI.value = Math.min(1, day.sunI / 3)
    domeRef.current?.position.copy(camera.position)
  })

  // --- Render ---
  return (
    <mesh ref={domeRef} material={material} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[70, 32, 16]} />
    </mesh>
  )
}

// ===== Component: Trees =====

/** Flat tree silhouettes outside the glass: along both sides, behind the end wall, before the entrance. */
export const Trees = () => {
  // --- Refs & state ---
  const cards = useMemo(() => {
    const random = rng(404)
    const out: TreeCard[] = []
    for (let i = 0; i < 16; i++) {
      const side = i % 2 ? 1 : -1
      const z = -6 + random() * (LENGTH + 14)
      const x = side * (HALF + 3 + random() * 9)
      const height = 6 + random() * 6
      out.push({ position: [x, height / 2 - 0.2, z], rotation: Math.atan2(-x, 0) + (random() - 0.5) * 0.6, height, seed: 1 + Math.floor(random() * 3) })
    }
    for (let i = 0; i < 6; i++) {
      const height = 7 + random() * 5
      out.push({ position: [-12 + random() * 24, height / 2 - 0.2, LENGTH + 4 + random() * 10], rotation: Math.PI, height, seed: 1 + Math.floor(random() * 3) })
    }
    for (let i = 0; i < 5; i++) {
      const height = 7 + random() * 5
      const side = i % 2 ? 1 : -1
      out.push({ position: [side * (4 + random() * 10), height / 2 - 0.2, -10 - random() * 10], rotation: 0, height, seed: 1 + Math.floor(random() * 3) })
    }
    return out
  }, [])
  // three silhouettes, shared by all the cards
  const materials = useMemo(
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
  const scratchTint = useMemo(() => new THREE.Color(), [])

  // --- Frame ---
  useFrame(() => {
    scratchTint.copy(day.fog).lerp(TREE_SHADE, 0.42 * (1 - day.night))
    for (const material of materials) material.color.copy(scratchTint)
  })

  // --- Render ---
  return (
    <group>
      {cards.map((card, index) => (
        <mesh key={index} position={card.position} rotation-y={card.rotation} material={materials[card.seed - 1]} renderOrder={-5}>
          <planeGeometry args={[card.height * 0.8, card.height]} />
        </mesh>
      ))}
    </group>
  )
}

// ===== Component: Shafts =====

/** Sun beams falling from the roof glass, as additive quads. */
export const Shafts = ({ mobile }: { mobile: boolean }) => {
  // --- Refs & state ---
  const geometry = useMemo(() => {
    const random = rng(55)
    const starts: number[] = []
    const corners: number[] = []
    const seeds: number[] = []
    const count = mobile ? 7 : 14
    for (let i = 0; i < count; i++) {
      const side = i % 2 ? 1 : -1
      const up = 0.2 + random() * 0.6 // how far up the roof slope the beam starts (0 eave, 1 ridge)
      const z = 1 + random() * (LENGTH - 3)
      const start = [side * HALF * (1 - up), EAVE + (RIDGE - EAVE) * up, z]
      const seed = random()
      const quadCorners = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 0],
        [1, 1],
        [0, 1],
      ]
      for (const [cx, cy] of quadCorners) {
        starts.push(...start)
        corners.push(cx, cy)
        seeds.push(seed)
      }
    }
    const out = new THREE.BufferGeometry()
    out.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(starts.length), 3))
    out.setAttribute('aStart', new THREE.Float32BufferAttribute(starts, 3))
    out.setAttribute('aCorner', new THREE.Float32BufferAttribute(corners, 2))
    out.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1))
    return out
  }, [mobile])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: shaftVertexShader,
        fragmentShader: shaftFragmentShader,
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

  // --- Frame ---
  useFrame(({ clock }) => {
    material.uniforms.uSun.value.copy(day.sunDir)
    material.uniforms.uColor.value.copy(day.sunColor)
    material.uniforms.uI.value = day.shafts * 0.045 * Math.min(1, day.sunI / 2.5)
    material.uniforms.uTime.value = live.reduce ? 0 : clock.elapsedTime
  })

  // --- Render ---
  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={5} />
}

// ===== Component: Dust =====

/** Motes drifting through the room, lit by the sun by day and by the lantern at night. */
export const Dust = ({ mobile }: { mobile: boolean }) => {
  // --- Refs & state ---
  const count = mobile ? 500 : 1300
  const geometry = useMemo(() => {
    const random = rng(9)
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (random() - 0.5) * 2 * (HALF - 0.4)
      positions[i * 3 + 1] = 0.2 + random() * (EAVE + 0.6)
      positions[i * 3 + 2] = -0.5 + random() * (LENGTH + 0.5)
      seeds[i] = random()
    }
    const out = new THREE.BufferGeometry()
    out.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    out.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1))
    return out
  }, [count])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uI: { value: 1 }, uColor: { value: new THREE.Color('#fff1d6') }, uPx: { value: 1 } },
        vertexShader: dustVertexShader,
        fragmentShader: dustFragmentShader,
      }),
    [],
  )

  // --- Frame ---
  useFrame(({ clock, gl }) => {
    material.uniforms.uTime.value = live.reduce ? 0 : clock.elapsedTime
    material.uniforms.uI.value = day.dust * 0.55
    material.uniforms.uPx.value = gl.getPixelRatio()
    material.uniforms.uColor.value.copy(day.sunColor).lerp(DUST_NIGHT, day.night)
  })

  // --- Render ---
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={6} />
}
