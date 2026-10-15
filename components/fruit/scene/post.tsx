'use client'

// The post-processing stack, in order: ambient occlusion, depth of field (desktop only), bloom
// (only real light sources: lamp, door, seam), neutral tone mapping, vignette, a sharpen pass on
// the finished image, and film grain last. Each effect has a lookdev switch (`?off=ao,dof,bloom,sharpen`).

// ===== External modules =====
import { useEffect, useMemo, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { Bloom, DepthOfField, EffectComposer, N8AO, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { EffectPass, ToneMappingMode, type DepthOfFieldEffect } from 'postprocessing'

// ===== Internal modules =====
import { live } from '../bench-live'
import { isOn } from '../lookdev'
import { getTier, TIERS, useTier } from '../quality'
import { SharpenEffect } from '../sharpen'
import { FocusRig } from './focus-rig'

// ===== Types =====

/** The part of N8AO's pass we touch at runtime. */
type AOPass = { configuration: { halfRes: boolean } }

// ===== Constants =====

/** Multisample count of the composer's buffer on desktop. 4 looks a touch cleaner on thin bars; 2 is half the fill cost. */
const MSAA_SAMPLES = 2

// ===== Component: Post =====

export const Post = ({ mobile }: { mobile: boolean }) => {
  // --- Refs & state ---
  const { camera } = useThree()
  const tier = useTier()
  const reduce = live.reduce
  const dofRef = useRef<DepthOfFieldEffect>(null)
  const aoRef = useRef<AOPass>(null)
  const [aoHalfRes] = useState(() => TIERS[getTier()].aoHalfRes)
  // Its own pass, last before the grain, so it sharpens the finished image (not the pre-DOF one).
  // Letting the composer merge it with the grain (a plain <primitive object={effect}>) would save
  // one full-screen pass, but it changes the edges visibly: that stays a lookdev decision.
  const sharpen = useMemo(() => new EffectPass(camera, new SharpenEffect(0.7)), [camera])

  // --- Effects ---
  useEffect(() => () => sharpen.dispose(), [sharpen])
  useEffect(() => {
    if (aoRef.current) aoRef.current.configuration.halfRes = TIERS[tier].aoHalfRes
  }, [tier])

  // --- Render ---
  return (
    <>
      <FocusRig dof={dofRef} />
      <EffectComposer multisampling={mobile ? 0 : MSAA_SAMPLES} enableNormalPass={false}>
        {isOn('ao') ? <N8AO ref={aoRef as never} aoRadius={0.6} intensity={2.2} distanceFalloff={0.9} halfRes={aoHalfRes} quality={mobile ? 'performance' : 'medium'} color="#2a1c10" /> : <></>}
        {isOn('dof') && !mobile && !reduce ? <DepthOfField ref={dofRef} worldFocusRange={5.5} bokehScale={1.1} /> : <></>}
        {isOn('bloom') ? <Bloom mipmapBlur luminanceThreshold={1.25} luminanceSmoothing={0.1} intensity={0.32} /> : <></>}
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        <Vignette offset={0.32} darkness={0.36} />
        {isOn('sharpen') ? <primitive object={sharpen} /> : <></>}
        <Noise opacity={0.018} />
      </EffectComposer>
    </>
  )
}
