'use client'

// Moves the camera along the walk. Position and look-at each follow a Catmull-Rom curve through
// the stations, damped so the scroll feels like walking; a small yaw turns toward the selected
// specimen, and an open sheet steps the camera into the aisle to frame that specimen on the left.

// ===== External modules =====
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ===== Internal modules =====
import { live } from '../bench-live'
import { CAMERA_LOOK, CAMERA_POS, SPECIMENS, nearestStation, splineT } from '../camera-path'

// ===== Constants =====

/** Field of view (degrees), phones wider. */
const FOV = { desktop: 42, mobile: 52 }
/** How fast the camera chases the scroll (damp lambda). */
const WALK_DAMP = 4.2
/** Largest yaw toward a selected specimen (radians). */
const MAX_YAW = 0.052
/** With the sheet open, how far beside the specimen the camera aims (metres) so it sits in the free 45% left of the sheet. */
const SHEET_AIM_OFFSET = 0.85
/** How fast the camera steps into the aisle when the sheet opens, and back when it closes (lerp lambda). Low, so it reads as a step and not a cut. */
const PUSH_DAMP_IN = 2.5
const PUSH_DAMP_OUT = 4
/** How fast the look-at blends to the sheet framing and back (damp lambda). */
const SHEET_MIX_IN = 3
const SHEET_MIX_OUT = 4

// ===== Component: CameraRig =====

export const CameraRig = ({ mobile }: { mobile: boolean }) => {
  // --- Refs & state ---
  const { camera } = useThree()
  const positionCurve = useMemo(() => new THREE.CatmullRomCurve3(CAMERA_POS.map((p) => new THREE.Vector3(...p))), [])
  const lookCurve = useMemo(() => new THREE.CatmullRomCurve3(CAMERA_LOOK.map((p) => new THREE.Vector3(...p))), [])
  /** Where along the curves we are (0..1), damped toward the scroll. */
  const t = useRef(0)
  const yaw = useRef(0)
  /** How far into the "sheet" framing we are (0..1). */
  const sheetMix = useRef(0)
  const scratchPosition = useRef(new THREE.Vector3())
  const scratchLook = useRef(new THREE.Vector3())
  const scratchAim = useRef(new THREE.Vector3())
  /** Offset from the walk position while the sheet is open, and its target. */
  const push = useRef(new THREE.Vector3())
  const pushTarget = useRef(new THREE.Vector3())
  const sheetAim = useRef(new THREE.Vector3())
  const zero = useRef(new THREE.Vector3())

  // --- Effects ---
  useEffect(() => {
    if (!('fov' in camera)) return
    camera.fov = mobile ? FOV.mobile : FOV.desktop
    camera.updateProjectionMatrix()
  }, [camera, mobile])

  // --- Frame ---
  useFrame((_, dt) => {
    // reduced motion: snap to the nearest station, no dolly
    const targetT = live.reduce ? splineT(nearestStation(live.progress).progress) : splineT(live.progress)
    t.current = live.reduce ? targetT : THREE.MathUtils.damp(t.current, Number.isFinite(targetT) ? targetT : 0, WALK_DAMP, dt)
    positionCurve.getPoint(Math.max(0, Math.min(1, t.current)), scratchPosition.current)
    lookCurve.getPoint(Math.max(0, Math.min(1, t.current)), scratchLook.current)

    const selected = SPECIMENS.find((item) => item.id === live.selectedId)
    const wantYaw = selected && !live.reduce ? THREE.MathUtils.clamp(selected.position[0] * 0.12, -MAX_YAW, MAX_YAW) : 0
    yaw.current = THREE.MathUtils.damp(yaw.current, wantYaw, 7, dt)

    // sheet: stand in the aisle beside the specimen and frame it in the free left 45% of the screen
    const framing = live.sheetOpen && selected
    if (framing) {
      const [sx, sy, sz] = selected.position
      pushTarget.current.set(sx - Math.sign(sx) * 1.5, sy + 0.18, sz - 1.35)
      pushTarget.current.sub(scratchPosition.current)
      push.current.lerp(pushTarget.current, 1 - Math.exp(-PUSH_DAMP_IN * dt))
      sheetAim.current.set(sx - (mobile ? 0 : SHEET_AIM_OFFSET), sy - 0.04, sz)
    } else {
      push.current.lerp(zero.current, 1 - Math.exp(-PUSH_DAMP_OUT * dt))
    }
    sheetMix.current = THREE.MathUtils.damp(sheetMix.current, framing ? 1 : 0, framing ? SHEET_MIX_IN : SHEET_MIX_OUT, dt)

    camera.position.copy(scratchPosition.current).add(push.current)
    scratchAim.current.copy(scratchLook.current)
    scratchAim.current.x += Math.tan(yaw.current) * 2.4
    scratchAim.current.lerp(sheetAim.current, sheetMix.current)
    camera.lookAt(scratchAim.current)
  })

  // --- Render ---
  return null
}
