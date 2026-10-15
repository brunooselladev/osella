'use client'

// The building. Each piece is its own component in greenhouse/; this is only the list, with a
// lookdev switch per piece (`?off=floor,masonry,frame,benches,glass,leaves,door,lantern,cut`).

// ===== Internal modules =====
import { isOn } from './lookdev'
import { Benches } from './greenhouse/benches'
import { CutLine } from './greenhouse/cut-line'
import { EndDoor } from './greenhouse/end-door'
import { EntranceLeaves } from './greenhouse/entrance-leaves'
import { Floor } from './greenhouse/floor'
import { Frame } from './greenhouse/frame'
import { Lantern } from './greenhouse/lantern'
import { Masonry } from './greenhouse/masonry'
import { Panes } from './greenhouse/panes'

// ===== Component: Greenhouse =====

export const Greenhouse = () => (
  <group>
    {isOn('floor') ? <Floor /> : null}
    {isOn('masonry') ? <Masonry /> : null}
    {isOn('frame') ? <Frame /> : null}
    {isOn('benches') ? <Benches /> : null}
    {isOn('glass') ? <Panes /> : null}
    {isOn('leaves') ? <EntranceLeaves /> : null}
    {isOn('door') ? <EndDoor /> : null}
    {isOn('lantern') ? <Lantern /> : null}
    {isOn('cut') ? <CutLine /> : null}
  </group>
)
