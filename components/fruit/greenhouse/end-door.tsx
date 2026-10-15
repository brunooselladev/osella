'use client'

// The wooden door in the end wall. At night its panes glow, light leaks round the leaf, a fan of
// light spills on the floor and a spot lights the last metres of the aisle. All driven by day.lamp.

// ===== External modules =====
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ===== Internal modules =====
import { Builder } from '../build'
import { day } from '../day'
import { woodTex } from '../textures'
import { DOOR_H, DOOR_W, LENGTH } from '../world'

// ===== Constants =====

/** The door leaf's z, just inside the end wall (m). */
const DOOR_Z = LENGTH - 0.03
/** Wood texture tile (m). */
const WOOD_TILE = 0.6
/** The four window panes: x and y of each centre (m). */
const PANE_X = [-0.2, 0.2]
const PANE_Y = [1.45, 1.79]
/** Light leak strips round the leaf: x, y, width, height (m). */
const LEAKS = [
  [-DOOR_W / 2 + 0.01, DOOR_H / 2, 0.016, DOOR_H],
  [DOOR_W / 2 - 0.01, DOOR_H / 2, 0.016, DOOR_H],
  [0, DOOR_H - 0.005, DOOR_W, 0.014],
  [0, 0.006, DOOR_W, 0.012],
] as const

// ===== Shaders =====

// A soft wedge of light on the floor, fading with distance from the door.
const fanVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fanFragmentShader = /* glsl */ `
uniform float uI;
uniform vec3 uColor;
varying vec2 vUv;
void main() {
  float w = mix(0.22, 0.5, vUv.y);
  float x = abs(vUv.x - 0.5);
  float side = 1. - smoothstep(w * 0.35, w, x);
  float len = pow(clamp(1. - vUv.y, 0., 1.), 1.6);
  gl_FragColor = vec4(uColor * side * len * uI, 1.);
}
`

// ===== Helpers =====

/** The leaf with two lower panels and a rail, the casing, and the window muntins. */
const doorGeometry = () => {
  const builder = new Builder()
  builder.box(DOOR_W - 0.04, DOOR_H - 0.03, 0.05, [0, (DOOR_H - 0.03) / 2, DOOR_Z], { tile: WOOD_TILE, grain: true }) // leaf
  for (const x of [-0.22, 0.22]) builder.box(0.32, 0.72, 0.03, [x, 0.5, DOOR_Z - 0.03], { tile: WOOD_TILE, grain: true }) // lower panels
  builder.box(0.86, 0.04, 0.03, [0, 1.08, DOOR_Z - 0.03], { tile: WOOD_TILE, grain: true }) // rail
  // casing
  builder.box(0.08, DOOR_H + 0.1, 0.08, [-DOOR_W / 2 - 0.04, (DOOR_H + 0.1) / 2, DOOR_Z - 0.04], { tile: WOOD_TILE, grain: true })
  builder.box(0.08, DOOR_H + 0.1, 0.08, [DOOR_W / 2 + 0.04, (DOOR_H + 0.1) / 2, DOOR_Z - 0.04], { tile: WOOD_TILE, grain: true })
  builder.box(DOOR_W + 0.24, 0.1, 0.09, [0, DOOR_H + 0.07, DOOR_Z - 0.04], { tile: WOOD_TILE, grain: true })
  // window muntins
  builder.box(0.03, 0.66, 0.035, [0, 1.62, DOOR_Z - 0.035])
  builder.box(0.78, 0.03, 0.035, [0, 1.62, DOOR_Z - 0.035])
  return builder.merge()
}

// ===== Component: EndDoor =====

export const EndDoor = () => {
  // --- Refs & state ---
  const wood = woodTex('door')
  const spotRef = useRef<THREE.SpotLight>(null)
  const geometry = useMemo(doorGeometry, [])
  const panes = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a2118', emissive: '#ffcf96', emissiveIntensity: 0.5, roughness: 0.15, side: THREE.BackSide }), [])
  const leak = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb36b').multiplyScalar(2.6), transparent: true, opacity: 0.12, toneMapped: false }), [])
  const fan = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uI: { value: 0 }, uColor: { value: new THREE.Color('#ffc58a') } },
        vertexShader: fanVertexShader,
        fragmentShader: fanFragmentShader,
      }),
    [],
  )

  // --- Frame ---
  // Everything eases toward what the lamp asks for.
  useFrame((_, dt) => {
    const ease = 1 - Math.exp(-6 * dt)
    panes.emissiveIntensity += (0.45 + day.lamp * 2.6 - panes.emissiveIntensity) * ease
    leak.opacity += (0.12 + day.lamp * 0.88 - leak.opacity) * ease
    fan.uniforms.uI.value += (day.lamp * 0.42 - fan.uniforms.uI.value) * ease
    if (spotRef.current) spotRef.current.intensity += (day.lamp * 9 - spotRef.current.intensity) * ease
  })

  // --- Render ---
  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial map={wood} color="#5b5246" roughness={0.6} />
      </mesh>
      {PANE_X.map((x) =>
        PANE_Y.map((y) => (
          <mesh key={`${x}${y}`} position={[x, y, DOOR_Z - 0.03]} material={panes}>
            <planeGeometry args={[0.36, 0.3]} />
          </mesh>
        )),
      )}
      {/* handle */}
      <mesh position={[0.36, 1.0, DOOR_Z - 0.06]}>
        <sphereGeometry args={[0.03, 12, 10]} />
        <meshStandardMaterial color="#c79b52" metalness={0.9} roughness={0.3} />
      </mesh>
      {/* light leaking round the leaf */}
      {LEAKS.map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, DOOR_Z - 0.03]} rotation-y={Math.PI} material={leak}>
          <planeGeometry args={[w, h]} />
        </mesh>
      ))}
      {/* the fan of light on the floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.006, LENGTH - 2.2]} material={fan}>
        <planeGeometry args={[3, 4.4]} />
      </mesh>
      <spotLight ref={spotRef} position={[0, 1.3, LENGTH - 0.25]} angle={0.9} penumbra={0.9} distance={10} decay={1.6} color="#ffc68e" intensity={0} target-position={[0, 0, LENGTH - 6]} />
    </group>
  )
}
