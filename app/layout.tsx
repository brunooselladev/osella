import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, JetBrains_Mono, Cormorant_Garamond, Karla, Press_Start_2P, IBM_Plex_Sans } from 'next/font/google'
import { LanguageProvider } from '@/components/language-provider'
import './globals.css'

const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })
const cormorant = Cormorant_Garamond({ subsets: ['latin'], variable: '--font-serif' })
const karla = Karla({ subsets: ['latin'], variable: '--font-karla' })
const pixel = Press_Start_2P({ subsets: ['latin'], weight: '400', variable: '--font-pixel' })
const plex = IBM_Plex_Sans({ subsets: ['latin'], variable: '--font-plex' })
export const metadata: Metadata = { title: 'Bruno Osella — Portfolio', description: 'Frontend & fullstack developer who leads projects.', generator: 'v0.app' }
export const viewport: Viewport = { colorScheme: 'dark', themeColor: '#101114' }
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body className={`${space.variable} ${mono.variable} ${cormorant.variable} ${karla.variable} ${pixel.variable} ${plex.variable}`}><LanguageProvider>{children}</LanguageProvider>{process.env.NODE_ENV === 'production' && <Analytics/>}</body></html> }

