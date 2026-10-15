'use client'

// Runs first each frame (priority -2): moves the day along the walk, or jumps it to a picked lens,
// evaluates `day`, and applies it to the sun, the hemisphere light, the fog and the clear colour.
// Everything else reads `day` after this.

// ===== External modules =====
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ===== Internal modules =====
import { live } from '../bench-live'
import { day, evalDay, LENS_TOD, todAt } from '../day'
import { TIERS, useTier } from '../quality'
import { LENGTH } from '../world'
import { requestShadowUpdate } from './shadows'

// ===== Constants =====

/** How fast the time of day chases its target (damp lambda): walking, lens click, reduced motion. */
const DAY_RATE = { walk: 2.8, lens: 7.5, reduce: 24 }
/** The sun sits this far from its target (m); far enough that its ortho shadow box covers the room ahead. */
const SUN_DISTANCE = 24

// ===== Component: DayRig =====

export const DayRig = ({ mobile }: { mobile: boolean }) => {
  // --- Refs & state ---
  const { scene, gl, camera } = useThree()
  const tier = useTier()
  /** Current time of day, 0..2; -1 until the first frame seeds it. */
  const tod = useRef(-1)
  const sunRef = useRef<THREE.DirectionalLight>(null)
  const hemiRef = useRef<THREE.HemisphereLight>(null)
  /** What the sun points at: a spot on the aisle a little ahead of the camera. */
  const sunTarget = useMemo(() => new THREE.Object3D(), [])

  // --- Effects ---
  // Resizes the shadow map when the quality tier changes.
  useEffect(() => {
    const sun = sunRef.current
    const size = TIERS[tier].shadowMap
    if (!sun || sun.shadow.mapSize.x === size) return
    sun.shadow.mapSize.set(size, size)
    sun.shadow.map?.dispose()
    sun.shadow.map = null
    requestShadowUpdate('resize')
  }, [tier])

  useEffect(() => {
    scene.fog = new THREE.Fog('#f1e3ca', 5, 38)
    gl.domElement.setAttribute('aria-hidden', 'true')
    if (sunRef.current) sunRef.current.target = sunTarget
  }, [gl, scene, sunTarget])

  // --- Frame ---
  useFrame((_, dt) => {
    const want = live.lensLocked ? LENS_TOD[live.lens] : todAt(live.progress)
    if (tod.current < 0) tod.current = want
    const rate = live.reduce ? DAY_RATE.reduce : live.lensLocked ? DAY_RATE.lens : DAY_RATE.walk
    const previousTod = tod.current
    tod.current = THREE.MathUtils.damp(tod.current, want, rate, dt)
    evalDay(tod.current)
    // the sun moved: its shadows must be drawn again
    if (Math.abs(tod.current - previousTod) > 1e-5) requestShadowUpdate('sun')

    const fog = scene.fog as THREE.Fog
    fog.color.copy(day.fog)
    fog.near = day.fogNear
    fog.far = day.fogFar
    gl.setClearColor(day.fog, 1)
    scene.environmentIntensity = day.env

    const sun = sunRef.current
    if (sun) {
      sunTarget.position.set(0, 0, THREE.MathUtils.clamp(camera.position.z + 5, 4, LENGTH - 4))
      sunTarget.updateMatrixWorld()
      sun.position.copy(sunTarget.position).addScaledVector(day.sunDir, SUN_DISTANCE)
      sun.color.copy(day.sunColor)
      sun.intensity = day.sunI
    }
    if (hemiRef.current) {
      hemiRef.current.color.copy(day.sky)
      hemiRef.current.groundColor.copy(day.ground)
      hemiRef.current.intensity = day.hemiI
    }
  }, -2)

  // --- Render ---
  return (
    <>
      <primitive object={sunTarget} />
      <hemisphereLight ref={hemiRef} args={['#f8ecd6', '#a87f5a', 1]} />
      <directionalLight
        ref={sunRef}
        intensity={3}
        castShadow={!mobile}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-radius={4}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={1}
        shadow-camera-far={60}
      />
    </>
  )
}
