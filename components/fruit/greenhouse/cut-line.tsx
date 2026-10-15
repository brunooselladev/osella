'use client'

// The engineering cut: a dashed rose line that appears in the Engineering lens, drawn from the
// aisle edge of the bench, out to the wall and up to the eave at the selected specimen's z.

// ===== External modules =====
import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ===== Internal modules =====
import { live } from '../bench-live'
import { nearestCaseStation, SPECIMENS } from '../camera-path'
import { vec3 } from '../vec'
import { BENCH_IN, BENCH_TOP, EAVE, HALF } from '../world'

// ===== Component: CutLine =====

export const CutLine = () => {
  // --- Refs & state ---
  const line = useMemo(() => {
    const points = [vec3(0, BENCH_TOP + 0.004, 0), vec3(1, BENCH_TOP + 0.004, 0), vec3(1, EAVE, 0)]
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineDashedMaterial({ color: '#e0566b', dashSize: 0.09, gapSize: 0.06, transparent: true, opacity: 0, depthTest: true, toneMapped: false })
    const dashed = new THREE.Line(geometry, material)
    dashed.computeLineDistances()
    return dashed
  }, [])

  // --- Frame ---
  useFrame((_, dt) => {
    const material = line.material as THREE.LineDashedMaterial
    const wantOpacity = live.lens === 'engineering' ? 0.9 : 0
    material.opacity = THREE.MathUtils.damp(material.opacity, wantOpacity, 6, dt)
    line.visible = material.opacity > 0.01
    // follow the selected specimen, or the nearest station's
    const station = nearestCaseStation(live.progress)
    const specimen = SPECIMENS.find((item) => item.id === (live.selectedId ?? station.caseId)) ?? SPECIMENS[0]
    const side = Math.sign(specimen.position[0])
    const positions = line.geometry.getAttribute('position') as THREE.BufferAttribute
    const z = specimen.position[2]
    positions.setXYZ(0, side * (BENCH_IN - 0.02), BENCH_TOP + 0.004, z)
    positions.setXYZ(1, side * (HALF - 0.08), BENCH_TOP + 0.004, z)
    positions.setXYZ(2, side * (HALF - 0.08), EAVE - 0.06, z)
    positions.needsUpdate = true
    line.computeLineDistances()
  })

  // --- Render ---
  return <primitive object={line} />
}
