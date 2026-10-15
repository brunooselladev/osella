// /fruit layout: its own stylesheet, a light colour scheme and the cream theme colour.

// ===== External modules =====
import type { Metadata, Viewport } from 'next'

// ===== Styles =====
import './fruit.css'

// ===== Constants =====

export const metadata: Metadata = { title: 'Fruit' }
export const viewport: Viewport = { colorScheme: 'light', themeColor: '#F7EFE1' }

// ===== Layout =====

const FruitLayout = ({ children }: { children: React.ReactNode }) => children

export default FruitLayout
