'use client'

// Without WebGL (or after a canvas error): one of the board's four frames as a static SVG,
// picked from where the walk stands and whether the sheet is open.

// ===== Types =====

type BeautyPass = 'enter' | 'hover' | 'sheet' | 'door'

// ===== Constants =====

const SOURCES: Record<BeautyPass, string> = {
  enter: '/fruit/enter.svg',
  hover: '/fruit/hover.svg',
  sheet: '/fruit/sheet.svg',
  door: '/fruit/door.svg',
}

// ===== Helpers =====

const beautyPass = (progress: number, sheetOpen: boolean): BeautyPass => {
  if (sheetOpen) return 'sheet'
  if (progress >= 0.9) return 'door'
  if (progress >= 0.25) return 'hover'
  return 'enter'
}

// ===== Component: FruitFallback =====

export const FruitFallback = ({ progress, sheetOpen }: { progress: number; sheetOpen: boolean }) => {
  // --- Derived ---
  const pass = beautyPass(progress, sheetOpen)

  // --- Render ---
  return (
    <div className="fruit-pass" aria-hidden="true">
      <img src={SOURCES[pass]} alt="" />
    </div>
  )
}
