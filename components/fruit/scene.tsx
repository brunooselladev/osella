'use client'

// The canvas. `World` lists everything inside it in mount order (the rigs first, Warmup last);
// `FruitScene` owns the Canvas, its renderer flags and the ready/shown handshake with the loader.
// Loaded lazily by BenchApp, client only. The loop runs on demand, driven by FrameRateRig.

// ===== External modules =====
import { useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'

// ===== Internal modules =====
import { Dust, Shafts, Sky, Trees } from './atmosphere'
import { CAMERA_LOOK, CAMERA_POS } from './camera-path'
import { Greenhouse } from './greenhouse'
import { flag, hasFlag, isOn } from './lookdev'
import { Props } from './props'
import { getTier, setTier, TIERS } from './quality'
import { CameraRig } from './scene/camera-rig'
import { DayRig } from './scene/day-rig'
import { SceneErrorBoundary } from './scene/error-boundary'
import { FrameRateRig } from './scene/frame-rate-rig'
import { PerfRig } from './scene/perf-rig'
import { Post } from './scene/post'
import { QualityRig } from './scene/quality-rig'
import { Reflections } from './scene/reflections'
import { ShadowRig } from './scene/shadow-rig'
import { Warmup } from './scene/warmup'
import { Specimens } from './specimens'

// ===== Types =====

type WorldProps = {
  mobile: boolean
  /** Shaders compiled: the frame loop may run. */
  ready: boolean
  onHover: (id: string | null) => void
  onPick: (id: string) => void
  onReady: () => void
  onShown: () => void
}

type FruitSceneProps = {
  onHover: (id: string | null) => void
  onPick: (id: string) => void
  /** The canvas failed (WebGL error, shader error): show the static fallback instead. */
  onFail?: () => void
  /** The room has faded in: the loader can go. */
  onShown?: () => void
}

// ===== Constants =====

/** Phones: narrower than this (px) get the lighter branch of every effect. */
const MOBILE_QUERY = '(max-width: 767px)'
/** The composer does its own multisampling, so the canvas only needs antialiasing when the composer is off. */
const CANVAS_ANTIALIAS = flag('post') === '0'

// ===== Component: World =====

const World = ({ mobile, ready, onHover, onPick, onReady, onShown }: WorldProps) => (
  <>
    {ready ? <FrameRateRig /> : null}
    <QualityRig />
    {hasFlag('perf') ? <PerfRig /> : null}
    <DayRig mobile={mobile} />
    {mobile ? null : <ShadowRig />}
    {isOn('env') ? <Reflections /> : null}
    <CameraRig mobile={mobile} />
    {isOn('sky') ? <Sky /> : null}
    {isOn('trees') ? <Trees /> : null}
    {isOn('house') ? <Greenhouse /> : null}
    {isOn('props') ? <Props /> : null}
    {isOn('specimens') ? <Specimens mobile={mobile} onHover={onHover} onPick={onPick} /> : null}
    {isOn('shafts') ? <Shafts mobile={mobile} /> : null}
    {isOn('dust') ? <Dust mobile={mobile} /> : null}
    {flag('post') !== '0' ? <Post mobile={mobile} /> : null}
    {/* last: its effect runs after fog, environment and lights are in place */}
    <Warmup onReady={onReady} onShown={onShown} />
  </>
)

// ===== Component: FruitScene =====

export const FruitScene = ({ onHover, onPick, onFail, onShown: onShownProp }: FruitSceneProps) => {
  // --- Refs & state ---
  const [mobile] = useState(() => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches)
  /** Shaders compiled: the frame loop may start. */
  const [ready, setReady] = useState(false)
  /** First frames rendered: the canvas fades in. */
  const [shown, setShown] = useState(false)
  // phones start one tier down
  const [startDpr] = useState(() => {
    if (mobile && getTier() === 0) setTier(1)
    return Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, TIERS[getTier()].dpr)
  })

  // --- Methods ---
  const onReady = useMemo(() => () => setReady(true), [])
  const onShown = useMemo(
    () => () => {
      setShown(true)
      onShownProp?.()
    },
    [onShownProp],
  )

  // --- Render ---
  return (
    <div className={`fruit-canvas${shown ? ' is-ready' : ''}`}>
      <SceneErrorBoundary onError={onFail}>
        <Canvas
          gl={{ antialias: CANVAS_ANTIALIAS, alpha: false, powerPreference: 'high-performance', stencil: false }}
          dpr={startDpr}
          camera={{ fov: mobile ? 52 : 42, near: 0.06, far: 140, position: CAMERA_POS[0] }}
          // three 0.186 dropped PCFSoftShadowMap and swaps it at first render, which invalidated every
          // pre-compiled shader; ask for PCF directly
          shadows={mobile ? false : { type: THREE.PCFShadowMap }}
          resize={{ scroll: false }}
          // never on its own: FrameRateRig advances the loop, at full rate or at the idle rate
          frameloop="never"
          onCreated={({ camera, gl, scene }) => {
            if (hasFlag('perf')) Object.assign(window, { __benchGl: gl, __benchScene: scene })
            camera.lookAt(CAMERA_LOOK[0][0], CAMERA_LOOK[0][1], CAMERA_LOOK[0][2])
            gl.domElement.setAttribute('aria-hidden', 'true')
          }}
        >
          <World mobile={mobile} ready={ready} onHover={onHover} onPick={onPick} onReady={onReady} onShown={onShown} />
        </Canvas>
      </SceneErrorBoundary>
    </div>
  )
}
