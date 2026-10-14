import type { Metadata, Viewport } from 'next'
import './fruit.css'

export const metadata: Metadata = { title: 'Fruit' }
export const viewport: Viewport = { colorScheme: 'light', themeColor: '#F7EFE1' }

export default function FruitLayout({ children }: { children: React.ReactNode }) {
  return children
}
