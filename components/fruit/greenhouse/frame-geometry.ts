// The cast-iron structure as one merged geometry: posts, rafters, brackets, tie rods, sills,
// purlins, glazing bars, ridge, cresting, both gables and the open vent frame. Sizes in metres.

// ===== External modules =====
import * as THREE from 'three'

// ===== Internal modules =====
import { Builder } from '../build'
import { vec3 } from '../vec'
import { BAR, BAY, BAYS, EAVE, ENTRY_H, ENTRY_W, HALF, KNEE, LENGTH, POST, RIDGE, ROOF_SLOPE, TRANSOM, roofY } from '../world'
import { VENT, VENT_HINGE, VENT_LENGTH, VENT_ROTATION } from './vent'

// ===== Constants =====

/** Rafter section, w × h (m). */
const RAFTER = { w: 0.07, h: 0.09 }
/** Spandrel bracket radius (m). */
const BRACKET_RADIUS = 0.34

// ===== Helpers =====

/** A cast spandrel bracket: a quarter circle with a hole, extruded. */
const bracketGeometry = () => {
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  shape.lineTo(BRACKET_RADIUS, 0)
  shape.absarc(BRACKET_RADIUS, -BRACKET_RADIUS, BRACKET_RADIUS, Math.PI / 2, Math.PI, false)
  shape.lineTo(0, 0)
  const hole = new THREE.Path()
  hole.absarc(0.085, -0.085, 0.045, 0, Math.PI * 2, true)
  shape.holes.push(hole)
  const extruded = new THREE.ExtrudeGeometry(shape, { depth: 0.022, bevelEnabled: false, curveSegments: 10 })
  extruded.translate(0, 0, -0.011)
  return extruded
}

/** The open vent's frame, built hanging from its hinge then rotated into place. */
const ventFrameGeometry = () => {
  const builder = new Builder()
  const { z0, z1 } = VENT
  builder.box(0.04, 0.04, z1 - z0, [0, 0, (z0 + z1) / 2]) // top rail (at the hinge)
  builder.box(0.04, 0.04, z1 - z0, [0, -VENT_LENGTH, (z0 + z1) / 2]) // bottom rail
  builder.box(0.035, VENT_LENGTH, 0.035, [0, -VENT_LENGTH / 2, z0]) // stiles
  builder.box(0.035, VENT_LENGTH, 0.035, [0, -VENT_LENGTH / 2, z1])
  const vent = builder.merge()
  vent.applyMatrix4(VENT_ROTATION)
  vent.translate(VENT_HINGE.x, VENT_HINGE.y, 0)
  return vent
}

// ===== Builder =====

export const frameGeometry = () => {
  const builder = new Builder()

  // --- one frame per bay line: post, rafter and bracket on each side, a tie rod every other one ---
  for (let k = 0; k <= BAYS; k++) {
    const z = k * BAY
    for (const side of [-1, 1]) {
      builder.box(POST, EAVE - KNEE, POST, [side * (HALF - POST / 2), TRANSOM, z]) // post, knee to eave
      builder.beam(vec3(side * HALF, EAVE, z), vec3(0, RIDGE, z), RAFTER.w, RAFTER.h) // rafter, eave to ridge
      const bracket = bracketGeometry()
      if (side > 0) bracket.scale(-1, 1, 1)
      builder.add(bracket, [side * (HALF - POST), EAVE - 0.02, z])
    }
    if (k % 2 === 1) builder.add(new THREE.CylinderGeometry(0.011, 0.011, HALF * 2 - 0.1, 6), [0, EAVE + 0.06, z], { rot: [0, 0, Math.PI / 2] }) // tie rod
  }

  // --- longitudinal members on each side ---
  for (const side of [-1, 1]) {
    builder.box(0.13, 0.11, LENGTH + 0.3, [side * HALF, EAVE, LENGTH / 2]) // gutter / eave beam, 13 × 11 cm
    builder.box(0.09, 0.05, LENGTH, [side * HALF, KNEE + 0.025, LENGTH / 2]) // knee sill
    builder.box(0.04, 0.035, LENGTH, [side * HALF, TRANSOM, LENGTH / 2]) // transom
    for (const up of [0.34, 0.67]) {
      builder.box(0.05, 0.05, LENGTH, [side * HALF * (1 - up), EAVE + (RIDGE - EAVE) * up - 0.03, LENGTH / 2], { rot: [0, 0, -side * ROOF_SLOPE] }) // purlins, a third and two thirds up the slope
    }
    // glazing bars: three per bay on the wall and up the roof
    for (let k = 0; k < BAYS; k++) {
      for (let j = 1; j < 4; j++) {
        const z = k * BAY + j * 0.5
        builder.box(BAR, EAVE - KNEE, BAR, [side * HALF, TRANSOM, z])
        builder.beam(vec3(side * HALF, EAVE, z), vec3(0, RIDGE, z), BAR, BAR)
      }
    }
  }
  builder.box(0.1, 0.14, LENGTH + 0.3, [0, RIDGE, LENGTH / 2]) // ridge beam
  for (let z = 0.25; z < LENGTH; z += 0.5) builder.add(new THREE.TorusGeometry(0.06, 0.008, 4, 12), [0, RIDGE + 0.14, z], { rot: [0, Math.PI / 2, 0] }) // cresting outside

  // --- entrance gable: bars every 0.5 m, shortened over the doorway; eave rail, door posts, lintel, transoms ---
  for (let x = -HALF + 0.5; x < HALF - 0.01; x += 0.5) {
    const inDoor = Math.abs(x) < ENTRY_W / 2 + 0.01
    const bottom = inDoor ? ENTRY_H + 0.06 : KNEE
    builder.box(BAR, roofY(x) - bottom, BAR, [x, (roofY(x) + bottom) / 2, 0])
  }
  builder.box(HALF * 2, 0.05, 0.06, [0, EAVE, 0]) // eave rail across the gable
  builder.box(0.08, ENTRY_H, 0.1, [-ENTRY_W / 2 - 0.04, ENTRY_H / 2, 0]) // door posts
  builder.box(0.08, ENTRY_H, 0.1, [ENTRY_W / 2 + 0.04, ENTRY_H / 2, 0])
  builder.box(ENTRY_W + 0.16, 0.08, 0.1, [0, ENTRY_H + 0.04, 0]) // lintel
  const sideSpan = HALF - ENTRY_W / 2 - 0.08
  for (const side of [-1, 1]) builder.box(sideSpan, 0.05, 0.06, [side * (ENTRY_W / 2 + 0.08 + sideSpan / 2), TRANSOM, 0]) // transoms beside the door
  builder.add(new THREE.SphereGeometry(0.06, 12, 8), [0, RIDGE + 0.2, -0.02]) // finial
  builder.add(new THREE.ConeGeometry(0.025, 0.22, 8), [0, RIDGE + 0.36, -0.02])

  // --- end gable above the brick wall ---
  for (let x = -HALF + 0.5; x < HALF - 0.01; x += 0.5) builder.box(BAR, roofY(x) - EAVE, BAR, [x, (roofY(x) + EAVE) / 2, LENGTH])

  // --- the open roof vent ---
  builder.parts.push(ventFrameGeometry())
  return builder.merge()
}
