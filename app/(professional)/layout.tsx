import { Geist } from 'next/font/google'
import type { Viewport } from 'next'
import { DevCursor } from '@/components/professional/cursor'
import '../professional.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-pro' })

export const viewport: Viewport = { colorScheme: 'dark', themeColor: '#0c0d0f' }

export default function ProfessionalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`pro ${geist.variable}`}>
      <DevCursor />
      {children}
    </div>
  )
}
