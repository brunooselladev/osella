'use client'
import Link from 'next/link'
import { useLanguage } from './language-provider'

export function LangToggle({ dark = false }: { dark?: boolean }) { const { lang, setLang } = useLanguage(); return <div className={`flex items-center gap-1 text-[11px] font-bold tracking-[.18em] ${dark ? 'text-white/50' : 'text-[#3b342c]/50'}`}><button onClick={() => setLang('en')} className={lang === 'en' ? (dark ? 'text-white' : 'text-[#3b342c]') : ''}>EN</button><span>/</span><button onClick={() => setLang('es')} className={lang === 'es' ? (dark ? 'text-white' : 'text-[#3b342c]') : ''}>ES</button></div> }
export function TrafficLightBack({ active = 'green' }: { active?: 'red' | 'yellow' | 'green' }) { return <Link href="/" aria-label="Back to portfolio modes" className="flex items-center gap-1.5 rounded-full border border-current/20 px-2.5 py-1.5"><i className={`size-2 rounded-full bg-[#ff453a] ${active === 'red' ? 'shadow-[0_0_9px_#ff453a]' : 'opacity-40'}`} /><i className={`size-2 rounded-full bg-[#ffc400] ${active === 'yellow' ? 'shadow-[0_0_9px_#ffc400]' : 'opacity-40'}`} /><i className={`size-2 rounded-full bg-[#30d158] ${active === 'green' ? 'shadow-[0_0_9px_#30d158]' : 'opacity-40'}`} /></Link> }
export function SectionLabel({ number, children }: { number: string; children: React.ReactNode }) { return <div className="mb-8 flex items-center gap-3 text-xs font-bold uppercase tracking-[.2em] opacity-70"><span>{number}</span><span className="h-px flex-1 bg-current/20"/><span>{children}</span></div> }

