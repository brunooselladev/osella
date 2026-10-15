// Lookdev switches read from the URL. They never change the product, only what the room draws,
// so a layer can be compared on and off while tuning the look.
//
//   ?off=ao,dof,bloom,sharpen,env,sky,trees,house,props,specimens,shafts,dust   drop a scene layer
//   ?off=floor,masonry,frame,benches,glass,leaves,door,lantern,cut             drop a room piece
//   ?hide=<caseId>   hide one specimen            ?post=0    render without the composer
//   ?perf            stats overlay + window.__bench* handles for the console
//   ?frame=01..04    reproduce one of the board's four frames (read by BenchApp)
//   ?bake=1          generate the canvas textures for scripts/bake-fruit-textures.mjs

// ===== Helpers =====

/** The raw value of a query flag, or null when it is absent or we are on the server. */
export const flag = (name: string): string | null => {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(name)
}

/** True when `?name` is present, with or without a value. */
export const hasFlag = (name: string) => {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has(name)
}

/** True unless `?off=` lists this layer or piece. */
export const isOn = (layer: string) => {
  const off = flag('off')
  return !off || !off.split(',').includes(layer)
}

/** Case ids hidden with `?hide=`. */
export const hiddenCases = () => (flag('hide') ?? '').split(',').filter(Boolean)
