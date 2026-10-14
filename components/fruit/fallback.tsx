'use client'

type BeautyPass = 'enter' | 'hover' | 'sheet' | 'door'

const src: Record<BeautyPass, string> = {
  enter: '/fruit/enter.svg',
  hover: '/fruit/hover.svg',
  sheet: '/fruit/sheet.svg',
  door: '/fruit/door.svg',
}

function beautyPass(progress: number, sheetOpen: boolean): BeautyPass {
  if (sheetOpen) return 'sheet'
  if (progress >= 0.9) return 'door'
  if (progress >= 0.25) return 'hover'
  return 'enter'
}

export function FruitFallback({ progress, sheetOpen }: { progress: number; sheetOpen: boolean }) {
  const pass = beautyPass(progress, sheetOpen)
  return (
    <div className="fruit-pass" aria-hidden="true">
      <img src={src[pass]} alt="" />
    </div>
  )
}
