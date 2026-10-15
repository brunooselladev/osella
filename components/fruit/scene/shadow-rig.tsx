'use client'

// Turns the sun's shadow map from "every frame" into "only when something moved". The camera
// and the day report their own motion here; the specimens report theirs through
// requestShadowUpdate. Runs at priority -1: after DayRig has moved the sun, before anything
// renders (the glass fruit's buffer at 0, the composer at 1).

// ===== External modules =====
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ===== Internal modules =====
import { consumeShadowUpdate, requestShadowUpdate } from './shadows'

// ===== Constants =====

/** Camera movement below this (m) does not count as motion. */
const STILL_EPSILON = 1e-5

// ===== Component: ShadowRig =====

export const ShadowRig = () => {
  // --- Refs & state ---
  const { gl, camera } = useThree()
  const lastPosition = useRef(new THREE.Vector3(Infinity, Infinity, Infinity))

  // --- Effects ---
  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    requestShadowUpdate('resize')
    return () => {
      gl.shadowMap.autoUpdate = true
    }
  }, [gl])

  // --- Frame ---
  useFrame(() => {
    if (lastPosition.current.distanceToSquared(camera.position) > STILL_EPSILON * STILL_EPSILON) {
      lastPosition.current.copy(camera.position)
      requestShadowUpdate('camera')
    }
    if (consumeShadowUpdate()) gl.shadowMap.needsUpdate = true
  }, -1)

  // --- Render ---
  return null
}
