'use client'

import { Component, type ReactNode, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { Bloom, DepthOfField, EffectComposer, N8AO, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode, type DepthOfFieldEffect } from 'postprocessing'
import * as THREE from 'three'
import { live } from './bench-live'
import { CAMERA_LOOK, CAMERA_POS, SPECIMENS, nearestCaseStation, nearestStation, splineT } from './camera-path'
import { day, evalDay, LENS_TOD, todAt } from './day'
import { Dust, Shafts, Sky, Trees } from './atmosphere'
import { Greenhouse } from './greenhouse'
import { Props } from './props'
import { Specimens } from './specimens'
import { LENGTH } from './world'

// Lookdev switches: ?post=0
function flag(name: string) {
  return typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get(name)
}

function fx(name: string) {
  const off = flag('off')
  return !off || !off.split(',').includes(name)
}

class SceneErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null }
  static getDerivedStateFromError(error: Error) {
    return { error: error.message }
  }
  componentDidCatch(error: Error) {
    ;(window as Window & { __benchErr?: string }).__benchErr = error.stack || error.message
  }
  render() {
    if (this.state.error) return null
    return this.props.children
  }
}

function CameraRig({ mobile }: { mobile: boolean }) {
  const posCurve = useMemo(() => new THREE.CatmullRomCurve3(CAMERA_POS.map((p) => new THREE.Vector3(...p))), [])
  const lookCurve = useMemo(() => new THREE.CatmullRomCurve3(CAMERA_LOOK.map((p) => new THREE.Vector3(...p))), [])
  const t = useRef(0)
  const look = useRef(new THREE.Vector3())
  const pos = useRef(new THREE.Vector3())
  const yaw = useRef(0)
  const push = useRef(new THREE.Vector3())
  const dest = useRef(new THREE.Vector3())
  const aim = useRef(new THREE.Vector3())
  const zero = useRef(new THREE.Vector3())
  const sheetAim = useRef(new THREE.Vector3())
  const sheetK = useRef(0)
  const { camera } = useThree()

  useEffect(() => {
    if (!('fov' in camera)) return
    camera.fov = mobile ? 52 : 42
    camera.updateProjectionMatrix()
  }, [camera, mobile])

  useFrame((_, dt) => {
    const targetT = live.reduce ? splineT(nearestStation(live.progress).progress) : splineT(live.progress)
    t.current = live.reduce ? targetT : THREE.MathUtils.damp(t.current, Number.isFinite(targetT) ? targetT : 0, 4.2, dt)
    posCurve.getPoint(Math.max(0, Math.min(1, t.current)), pos.current)
    lookCurve.getPoint(Math.max(0, Math.min(1, t.current)), look.current)

    const selected = SPECIMENS.find((item) => item.id === live.selectedId)
    const wantYaw = selected && !live.reduce ? THREE.MathUtils.clamp(selected.position[0] * 0.12, -0.052, 0.052) : 0
    yaw.current = THREE.MathUtils.damp(yaw.current, wantYaw, 7, dt)

    // sheet: stand in the aisle beside the specimen and frame it in the free left 45% of the screen
    const sheet = live.sheetOpen && selected
    if (sheet) {
      const [sx, sy, sz] = selected.position
      dest.current.set(sx - Math.sign(sx) * 1.5, sy + 0.18, sz - 1.35)
      dest.current.sub(pos.current)
      push.current.lerp(dest.current, 1 - Math.exp(-5 * dt))
      sheetAim.current.set(sx - (mobile ? 0 : 0.85), sy - 0.04, sz)
    } else {
      push.current.lerp(zero.current, 1 - Math.exp(-6 * dt))
    }
    sheetK.current = THREE.MathUtils.damp(sheetK.current, sheet ? 1 : 0, sheet ? 5 : 6, dt)

    camera.position.copy(pos.current).add(push.current)
    aim.current.copy(look.current)
    aim.current.x += Math.tan(yaw.current) * 2.4
    aim.current.lerp(sheetAim.current, sheetK.current)
    camera.lookAt(aim.current)
  })

  return null
}

/* ---------------------------------------------------------------- light */

// Runs first each frame: moves the day along the walk, or jumps it to a picked lens.
function DayRig({ mobile }: { mobile: boolean }) {
  const tod = useRef(-1)
  const sun = useRef<THREE.DirectionalLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const target = useMemo(() => new THREE.Object3D(), [])
  const { scene, gl, camera } = useThree()

  useEffect(() => {
    scene.fog = new THREE.Fog('#f1e3ca', 5, 38)
    gl.domElement.setAttribute('aria-hidden', 'true')
    if (sun.current) sun.current.target = target
  }, [gl, scene, target])

  useFrame((_, dt) => {
    const want = live.lensLocked ? LENS_TOD[live.lens] : todAt(live.progress)
    if (tod.current < 0) tod.current = want
    const rate = live.reduce ? 24 : live.lensLocked ? 7.5 : 2.8
    tod.current = THREE.MathUtils.damp(tod.current, want, rate, dt)
    evalDay(tod.current)

    const fog = scene.fog as THREE.Fog
    fog.color.copy(day.fog)
    fog.near = day.fogNear
    fog.far = day.fogFar
    gl.setClearColor(day.fog, 1)
    scene.environmentIntensity = day.env

    const s = sun.current
    if (s) {
      target.position.set(0, 0, THREE.MathUtils.clamp(camera.position.z + 5, 4, LENGTH - 4))
      target.updateMatrixWorld()
      s.position.copy(target.position).addScaledVector(day.sunDir, 24)
      s.color.copy(day.sunColor)
      s.intensity = day.sunI
      s.castShadow = !mobile && day.sunI > 0.05
    }
    if (hemi.current) {
      hemi.current.color.copy(day.sky)
      hemi.current.groundColor.copy(day.ground)
      hemi.current.intensity = day.hemiI
    }
  }, -2)

  return (
    <>
      <primitive object={target} />
      <hemisphereLight ref={hemi} args={['#f8ecd6', '#a87f5a', 1]} />
      <directionalLight
        ref={sun}
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

// A soft, warm room for reflections and the glass fruit to refract. Rendered once.
function Reflections() {
  return (
    <Environment frames={1} resolution={256}>
      <mesh scale={30}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshBasicMaterial color="#d9c6a6" side={THREE.BackSide} />
      </mesh>
      <Lightformer form="rect" intensity={2.4} color="#fff6e6" position={[0, 6, 10]} rotation-x={Math.PI / 2} scale={[6, 20, 1]} />
      <Lightformer form="rect" intensity={1.4} color="#fbeed6" position={[-5, 2.5, 10]} rotation-y={Math.PI / 2} scale={[20, 2.6, 1]} />
      <Lightformer form="rect" intensity={1.1} color="#f7e6c8" position={[5, 2.5, 10]} rotation-y={-Math.PI / 2} scale={[20, 2.6, 1]} />
      <Lightformer form="rect" intensity={0.6} color="#ffd8a8" position={[0, 1.2, -6]} scale={[4, 2.4, 1]} />
      <Lightformer form="rect" intensity={0.5} color="#2b2c25" position={[0, -2, 10]} rotation-x={-Math.PI / 2} scale={[8, 22, 1]} />
    </Environment>
  )
}

/* ---------------------------------------------------------------- focus + tag */

const DOOR_FOCUS = new THREE.Vector3(0, 1.2, LENGTH)

function FocusRig({ dof }: { dof: React.RefObject<DepthOfFieldEffect | null> }) {
  const focus = useMemo(() => new THREE.Vector3(...SPECIMENS[0].position), [])
  const want = useMemo(() => new THREE.Vector3(), [])
  const screen = useMemo(() => new THREE.Vector3(), [])
  const root = useRef<HTMLElement | null>(null)
  const { size } = useThree()

  useFrame(({ camera }, dt) => {
    const id = live.selectedId ?? live.hoverId ?? nearestCaseStation(live.progress).caseId
    const spec = SPECIMENS.find((s) => s.id === id)
    if (live.progress > 0.93 && !live.selectedId) want.copy(DOOR_FOCUS)
    else if (spec) want.set(...spec.position)
    focus.lerp(want, 1 - Math.exp(-4 * dt))
    const effect = dof.current
    if (effect) effect.target = focus

    // project the selected specimen for the DOM tag
    if (!root.current) root.current = document.querySelector('.fruit-root')
    const el = root.current
    const sel = SPECIMENS.find((s) => s.id === live.selectedId)
    if (el && sel) {
      screen.set(sel.position[0], sel.position[1] + 0.12, sel.position[2]).project(camera)
      const x = (screen.x * 0.5 + 0.5) * size.width
      const y = (-screen.y * 0.5 + 0.5) * size.height
      const right = x < size.width * 0.72
      el.style.setProperty('--tag-x', `${Math.round(right ? x + 70 : x - 230)}px`)
      el.style.setProperty('--tag-y', `${Math.round(THREE.MathUtils.clamp(y - 30, 90, size.height - 160))}px`)
      el.dataset.tagSide = right ? 'right' : 'left'
    }
  })
  return null
}

function Post({ mobile }: { mobile: boolean }) {
  const dof = useRef<DepthOfFieldEffect>(null)
  const reduce = live.reduce
  return (
    <>
      <FocusRig dof={dof} />
      <EffectComposer multisampling={mobile ? 0 : 4} enableNormalPass={false}>
        {fx('ao') ? <N8AO aoRadius={0.6} intensity={2.2} distanceFalloff={0.9} halfRes quality={mobile ? 'performance' : 'medium'} color="#2a1c10" /> : <></>}
        {fx('dof') && !mobile && !reduce ? <DepthOfField ref={dof} worldFocusRange={2.6} bokehScale={2.2} /> : <></>}
        {fx('bloom') ? <Bloom mipmapBlur luminanceThreshold={0.95} luminanceSmoothing={0.2} intensity={0.4} /> : <></>}
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        <Vignette offset={0.32} darkness={0.36} />
        <Noise opacity={0.03} />
      </EffectComposer>
    </>
  )
}

function World({
  mobile,
  onHover,
  onPick,
}: {
  mobile: boolean
  onHover: (id: string | null) => void
  onPick: (id: string) => void
}) {
  return (
    <>
      <DayRig mobile={mobile} />
      {fx('env') ? <Reflections /> : null}
      <CameraRig mobile={mobile} />
      {fx('sky') ? <Sky /> : null}
      {fx('trees') ? <Trees /> : null}
      {fx('house') ? <Greenhouse /> : null}
      {fx('props') ? <Props /> : null}
      {fx('specimens') ? <Specimens mobile={mobile} onHover={onHover} onPick={onPick} /> : null}
      {fx('shafts') ? <Shafts mobile={mobile} /> : null}
      {fx('dust') ? <Dust mobile={mobile} /> : null}
      {flag('post') !== '0' ? <Post mobile={mobile} /> : null}
    </>
  )
}

export function FruitScene({
  onHover,
  onPick,
  onFail,
}: {
  onHover: (id: string | null) => void
  onPick: (id: string) => void
  onFail?: () => void
}) {
  const mobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  return (
    <div className="fruit-canvas">
      <SceneErrorBoundary>
        <Canvas
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', stencil: false }}
          dpr={mobile ? [1, 1.5] : [1, 2]}
          camera={{ fov: mobile ? 52 : 42, near: 0.06, far: 140, position: CAMERA_POS[0] }}
          shadows={mobile ? false : { type: THREE.PCFSoftShadowMap }}
          resize={{ scroll: false }}
          onCreated={({ camera, gl }) => {
            camera.lookAt(CAMERA_LOOK[0][0], CAMERA_LOOK[0][1], CAMERA_LOOK[0][2])
            gl.domElement.setAttribute('aria-hidden', 'true')
            void onFail
          }}
        >
          <World mobile={mobile} onHover={onHover} onPick={onPick} />
        </Canvas>
      </SceneErrorBoundary>
    </div>
  )
}
