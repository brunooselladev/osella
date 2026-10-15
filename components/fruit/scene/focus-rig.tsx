'use client'

// Two jobs that both need "where is the specimen on screen": aims the depth of field at the
// selected (or nearest) specimen, and positions the DOM tag next to it, hiding the tag when a post
// or wall is in the way.

// ===== External modules =====
import { useMemo, useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { DepthOfFieldEffect } from 'postprocessing'
import * as THREE from 'three'

// ===== Internal modules =====
import { live } from '../bench-live'
import { SPECIMENS, nearestCaseStation } from '../camera-path'
import { getTier, TIERS } from '../quality'
import { LENGTH } from '../world'

// ===== Constants =====

/** Where the focus goes at the end of the walk, when nothing is selected: the door. */
const DOOR_FOCUS = new THREE.Vector3(0, 1.2, LENGTH)
/** Past this progress the door takes the focus. */
const DOOR_FROM = 0.93
/** The occlusion raycast runs every N frames; it is cheap but not free. */
const RAYCAST_EVERY = 6
/** Tag offset from the specimen on screen (px), when it sits to the right or to the left. */
const TAG_RIGHT = 70
const TAG_LEFT = 230

// ===== Component: FocusRig =====

export const FocusRig = ({ dof }: { dof: RefObject<DepthOfFieldEffect | null> }) => {
  // --- Refs & state ---
  const { size, scene } = useThree()
  const focus = useMemo(() => new THREE.Vector3(...SPECIMENS[0].position), [])
  const wantFocus = useMemo(() => new THREE.Vector3(), [])
  const scratchScreen = useMemo(() => new THREE.Vector3(), [])
  const scratchDirection = useMemo(() => new THREE.Vector3(), [])
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const rootRef = useRef<HTMLElement | null>(null)
  /** Meshes flagged `userData.occluder`, collected once. */
  const occluders = useRef<THREE.Object3D[] | null>(null)
  const seen = useRef({ id: '', frame: 0, visible: true })

  // --- Frame ---
  useFrame(({ camera }, dt) => {
    // depth of field follows the selection, the hover, or the nearest station
    const id = live.selectedId ?? live.hoverId ?? nearestCaseStation(live.progress).caseId
    const specimen = SPECIMENS.find((item) => item.id === id)
    if (live.progress > DOOR_FROM && !live.selectedId) wantFocus.copy(DOOR_FOCUS)
    else if (specimen) wantFocus.set(...specimen.position)
    focus.lerp(wantFocus, 1 - Math.exp(-4 * dt))
    const effect = dof.current
    if (effect) {
      effect.target = focus
      effect.bokehScale = TIERS[getTier()].bokeh
    }

    // project the selected specimen for the DOM tag
    if (!rootRef.current) rootRef.current = document.querySelector('.fruit-root')
    const root = rootRef.current
    const selected = SPECIMENS.find((item) => item.id === live.selectedId)
    if (!root || !selected) return
    // The tag is DOM and always draws on top, so hide it whenever the specimen is out of sight:
    // from outside the greenhouse, or behind a post or wall (raycast a few times a second).
    const memo = seen.current
    memo.frame += 1
    if (memo.id !== selected.id || memo.frame % RAYCAST_EVERY === 0) {
      memo.id = selected.id
      let visible = camera.position.z > 0.25
      if (visible) {
        occluders.current ??= (() => {
          const list: THREE.Object3D[] = []
          scene.traverse((object) => object.userData.occluder && list.push(object))
          return list
        })()
        scratchDirection.set(...selected.position).sub(camera.position)
        const distance = scratchDirection.length()
        raycaster.set(camera.position, scratchDirection.normalize())
        raycaster.far = distance - 0.25
        visible = raycaster.intersectObjects(occluders.current, false).length === 0
      }
      memo.visible = visible
    }
    root.dataset.tagHidden = memo.visible ? 'false' : 'true'
    scratchScreen.set(selected.position[0], selected.position[1] + 0.12, selected.position[2]).project(camera)
    const x = (scratchScreen.x * 0.5 + 0.5) * size.width
    const y = (-scratchScreen.y * 0.5 + 0.5) * size.height
    const toRight = x < size.width * 0.72
    root.style.setProperty('--tag-x', `${Math.round(toRight ? x + TAG_RIGHT : x - TAG_LEFT)}px`)
    root.style.setProperty('--tag-y', `${Math.round(THREE.MathUtils.clamp(y - 30, 90, size.height - 160))}px`)
    root.dataset.tagSide = toRight ? 'right' : 'left'
  })

  // --- Render ---
  return null
}
