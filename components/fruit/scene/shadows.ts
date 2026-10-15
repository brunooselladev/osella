// A one-bit mailbox for the sun's shadow map. Rendering shadows costs a full pass over every
// caster, and three.js does it every frame by default; here it only happens when something that
// casts or receives a shadow moved. Anything that moves such a thing calls `requestShadowUpdate`
// with who it is; ShadowRig consumes the flag once per frame.

// ===== Internal modules =====
import { markMotion } from './activity'

// ===== Types =====

/** Who asked for the shadows to be redrawn; the ?perf overlay shows the counts. */
export type ShadowSource = 'sun' | 'camera' | 'specimen' | 'resize'

// ===== Constants =====

let dirty = true
let renders = 0
const requests: Record<ShadowSource, number> = { sun: 0, camera: 0, specimen: 0, resize: 0 }

// ===== Helpers =====

/** Something that casts a shadow moved (or the light did): render the shadow map this frame. */
export const requestShadowUpdate = (source: ShadowSource) => {
  dirty = true
  requests[source] += 1
  // a moving caster is also a reason to keep rendering at full rate
  markMotion()
}

/** True once per request; also counts the renders for the ?perf overlay. */
export const consumeShadowUpdate = () => {
  const wanted = dirty
  dirty = false
  if (wanted) renders += 1
  return wanted
}

/** How many shadow maps have been rendered so far. */
export const shadowRenders = () => renders

/** How many requests each source has made so far. */
export const shadowRequests = () => ({ ...requests })
