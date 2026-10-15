'use client'

// `?perf`: an on-screen readout of what a frame costs, plus window.__benchStats for scripts.
// Draw calls are counted across every render of the frame (the composer's passes, the glass
// fruit's buffer, the shadow map) by pausing gl.info's automatic reset and resetting it ourselves
// at the start of each frame.

// ===== External modules =====
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

// ===== Internal modules =====
import { getTier } from '../quality'
import { shadowRenders, shadowRequests, type ShadowSource } from './shadows'

// ===== Types =====

type Stats = { fps: number; ms: number; calls: number; triangles: number; programs: number; tier: number; dpr: number; shadowRenders: number; shadowBy: Record<ShadowSource, number> }

// ===== Constants =====

/** How often the readout refreshes (ms). */
const REFRESH_MS = 500

// ===== Component: PerfRig =====

export const PerfRig = () => {
  // --- Refs & state ---
  const { gl } = useThree()
  const nodeRef = useRef<HTMLDivElement | null>(null)
  const frameStart = useRef(0)
  const window_ = useRef({ frames: 0, ms: 0, since: 0, shadowsAt: 0, requestsAt: shadowRequests() })

  // --- Effects ---
  useEffect(() => {
    gl.info.autoReset = false
    const node = document.createElement('div')
    node.className = 'fruit-perf'
    node.setAttribute('aria-hidden', 'true')
    document.body.appendChild(node)
    nodeRef.current = node
    window_.current.since = performance.now()
    window_.current.shadowsAt = shadowRenders()
    return () => {
      gl.info.autoReset = true
      node.remove()
      nodeRef.current = null
    }
  }, [gl])

  // --- Frame ---
  // first: wipe last frame's counters
  useFrame(() => {
    gl.info.reset()
    frameStart.current = performance.now()
  }, -10)

  // last: read the counters and, every REFRESH_MS, publish them
  useFrame(() => {
    const now = performance.now()
    const acc = window_.current
    acc.frames += 1
    acc.ms += now - frameStart.current
    const elapsed = now - acc.since
    if (elapsed < REFRESH_MS) return
    const render = gl.info.render
    const requests = shadowRequests()
    const shadowBy = Object.fromEntries((Object.keys(requests) as ShadowSource[]).map((source) => [source, requests[source] - acc.requestsAt[source]])) as Record<ShadowSource, number>
    const stats: Stats = {
      fps: Math.round((acc.frames / elapsed) * 1000),
      ms: Math.round((acc.ms / acc.frames) * 10) / 10,
      calls: render.calls,
      triangles: render.triangles,
      programs: gl.info.programs?.length ?? 0,
      tier: getTier(),
      dpr: gl.getPixelRatio(),
      shadowRenders: shadowRenders() - acc.shadowsAt,
      shadowBy,
    }
    Object.assign(window, { __benchStats: stats })
    if (nodeRef.current) {
      const by = (Object.keys(shadowBy) as ShadowSource[]).filter((source) => shadowBy[source]).map((source) => `${source} ${shadowBy[source]}`).join(', ')
      nodeRef.current.textContent = `${stats.fps} fps · ${stats.ms} ms cpu · ${stats.calls} calls · ${Math.round(stats.triangles / 1000)}k tris · ${stats.programs} programs · tier ${stats.tier} · dpr ${stats.dpr} · shadow maps ${stats.shadowRenders}/${acc.frames}${by ? ` (${by})` : ''}`
    }
    acc.frames = 0
    acc.ms = 0
    acc.since = now
    acc.shadowsAt = shadowRenders()
    acc.requestsAt = requests
  }, 10)

  // --- Render ---
  return null
}
