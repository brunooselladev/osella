import type { Lang, Lens } from './types'

export const fruitUi = {
  en: {
    fruit: 'Fruit',
    bench: 'THE BENCH',
    benchAria: 'The Bench',
    lensAria: 'Lens',
    lens: { business: 'Business', engineering: 'Engineering', delivery: 'Delivery' } satisfies Record<Lens, string>,
    need: 'Need',
    engineering: 'Engineering',
    read: 'Read the case →',
    // the case unfolds in the sheet as growth stages
    steps: ['Seed', 'Roots', 'Stem', 'Bloom', 'Fruit'],
    stepsAria: 'Case stages',
    next: 'Next →',
    prev: '← Back',
    card: '← Card',
    backToBench: 'Back to the bench →',
    walk: 'Walk out →',
    close: 'Close case sheet',
    visited: 'visited',
    skins: 'Portfolio modes',
    skinDev: 'Dev',
    skinFruit: 'Fruit, current',
    skinGaming: 'Gaming',
    room: 'A greenhouse with a wooden bench of four specimens. Cases are listed on the left. Scroll walks the aisle. The door at the end is the contact.',
    caption: 'Next.js 16 · React 19 · Three.js · GSAP ScrollTrigger · Lenis · DOM over WebGL',
    hud: 'bench',
  },
  es: {
    fruit: 'Fruit',
    bench: 'THE BENCH',
    benchAria: 'The Bench',
    lensAria: 'Lente',
    lens: { business: 'Negocio', engineering: 'Ingeniería', delivery: 'Entrega' } satisfies Record<Lens, string>,
    // TODO: short sheet labels Need / Engineering are not in content/. EN matches the board. Confirm ES.
    need: 'Need',
    engineering: 'Engineering',
    read: 'Ver el caso →',
    steps: ['Semilla', 'Raíces', 'Tallo', 'Flor', 'Fruto'],
    stepsAria: 'Etapas del caso',
    next: 'Siguiente →',
    prev: '← Atrás',
    card: '← Ficha',
    backToBench: 'Volver al banco →',
    walk: 'Salir →',
    close: 'Cerrar la ficha del caso',
    visited: 'visitado',
    skins: 'Modos del portfolio',
    skinDev: 'Dev',
    skinFruit: 'Fruit, actual',
    skinGaming: 'Gaming',
    room: 'Un invernadero con un banco de madera y cuatro especímenes. Los casos están a la izquierda. El scroll recorre el pasillo. La puerta del fondo es el contacto.',
    caption: 'Next.js 16 · React 19 · Three.js · GSAP ScrollTrigger · Lenis · DOM over WebGL',
    hud: 'bench',
  },
} as const

export function fruitCopy(lang: Lang) {
  return fruitUi[lang]
}
