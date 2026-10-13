'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getContent, type Lang } from '@/content/en'

type LanguageContextValue = { lang: Lang; setLang: (lang: Lang) => void; content: ReturnType<typeof getContent> }
const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')
  useEffect(() => { const stored = window.localStorage.getItem('bo_lang') as Lang | null; if (stored === 'en' || stored === 'es') setLangState(stored) }, [])
  const setLang = (next: Lang) => { setLangState(next); window.localStorage.setItem('bo_lang', next) }
  return <LanguageContext.Provider value={{ lang, setLang, content: getContent(lang) }}>{children}</LanguageContext.Provider>
}
export function useLanguage() { const value = useContext(LanguageContext); if (!value) throw new Error('useLanguage must be used inside LanguageProvider'); return value }

