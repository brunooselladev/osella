'use client'
import Link from 'next/link'
import { LangToggle, TrafficLightBack, SectionLabel } from '@/components/shared'
import { useLanguage } from '@/components/language-provider'
import { caseCopy, decisions, publishedCases } from '@/content'
import { identity, identityCopy } from '@/content/identity'

export default function GamingPage() {
  const { lang } = useLanguage()
  const copy = identityCopy(lang)
  return (
    <main className="gaming-shell min-h-screen bg-[#150b28] text-[#f8f2ff]">
      <nav className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b-4 border-[#4a3572] bg-[#150b28]/95 px-5 py-4 backdrop-blur">
        <Link href="/" className="flex items-center gap-3 font-pixel text-[10px] text-[#ffb020]"><span className="grid size-7 place-items-center border-2 border-[#ffb020]">BO</span>PLAYER: BRUNO OSELLA</Link>
        <div className="flex items-center gap-4 font-pixel text-[9px]"><LangToggle dark /><TrafficLightBack active="red" /></div>
      </nav>
      <section className="gaming-hero relative flex min-h-[78vh] items-center justify-center overflow-hidden px-5 text-center">
        <div className="stars" />
        <div className="relative z-[1]">
          <p className="font-pixel text-xs text-[#5ac8fa]">WORLD 1-1 // PORTFOLIO QUEST</p>
          <h1 className="gaming-title mt-8 font-pixel text-4xl leading-[1.6] text-[#ffb020] sm:text-7xl">BRUNO<br />OSELLA</h1>
          <p className="mx-auto mt-8 max-w-lg text-lg text-white/65">{copy.headline}</p>
          <p className="mx-auto mt-4 max-w-lg text-base text-white/45">{copy.support}</p>
          <a href="#levels" className="mt-10 inline-block border-4 border-[#ffd60a] bg-[#ffb020] px-6 py-4 font-pixel text-xs text-[#150b28] shadow-[8px_8px_0_#000]">▸ {lang === 'es' ? 'EMPEZAR' : 'PRESS START'}</a>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-24" id="levels">
        <SectionLabel number="01">{lang === 'es' ? 'Elegí un nivel' : 'Select level'}</SectionLabel>
        <div className="grid gap-6 md:grid-cols-2">
          {publishedCases.map((study, i) => {
            const card = caseCopy(study, lang)
            return (
              <article key={study.id} className="pixel-card">
                <div className="flex items-center justify-between font-pixel text-[10px] text-[#5ac8fa]"><span>LEVEL 1-{i + 1}</span><span>{card.note}</span></div>
                <div className="pixel-art mt-6">QUEST 0{i + 1}</div>
                <h2 className="mt-6 font-pixel text-sm leading-loose text-[#ffb020]">{card.cardTitle}</h2>
                <p className="mt-4 text-sm text-white/55">{card.cardLine}</p>
                <ul className="mt-4 flex flex-col gap-3">
                  {card.rows.map((row) => (
                    <li key={row.need}>
                      <p className="text-sm text-white/45">{row.need}</p>
                      <p className="text-sm text-[#ffb020]">{row.engineering.lead}</p>
                    </li>
                  ))}
                </ul>
                <Link href={`/work/${study.slug}`} className="mt-7 inline-block border-t-2 border-[#4a3572] pt-4 font-pixel text-[9px] text-[#38d9a9]">{lang === 'es' ? 'VER CASO' : 'OPEN CASE'}</Link>
              </article>
            )
          })}
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-14 px-5 py-24 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <SectionLabel number="02">{lang === 'es' ? 'Historia' : 'Character lore'}</SectionLabel>
          <div className="pixel-dialog"><p className="font-pixel text-xs leading-loose text-[#150b28]">{copy.about}</p></div>
        </div>
        <div>
          <SectionLabel number="03">{lang === 'es' ? 'Inventario' : 'Inventory'}</SectionLabel>
          <div className="inventory">
            {identity.tools.map((item, i) => (
              <div key={item} className="inventory-slot"><span className="font-pixel text-xl">{['◈', '◆', '▣', '✦', '⬡', '◉'][i % 6]}</span><small>{item}</small></div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-24">
        <SectionLabel number="04">{lang === 'es' ? 'Cómo trabajo' : 'How I work'}</SectionLabel>
        <ol className="flex flex-col">
          {decisions.map((decision) => {
            const study = publishedCases.find((item) => item.id === decision.caseId)
            return (
              <li key={decision.id} className="grid gap-2 border-t-4 border-[#4a3572] py-5 sm:grid-cols-[88px_1fr_auto] sm:items-baseline sm:gap-6">
                <span className="font-pixel text-[10px] text-[#ff6b81]">{decision.year}</span>
                <span className="text-lg">{decision[lang].title}</span>
                <span className="text-sm text-white/45">{study ? caseCopy(study, lang).cardTitle : ''}</span>
              </li>
            )
          })}
        </ol>
      </section>
      <footer className="border-t-4 border-[#4a3572] px-5 py-20 text-center">
        <p className="font-pixel text-xs text-[#ff6b81]">{lang === 'es' ? '¿SEGUIMOS?' : 'CONTINUE?'}</p>
        <h2 className="mx-auto mt-6 max-w-xl text-3xl">{copy.contactHeading}</h2>
        <a href={`mailto:${identity.email}`} className="mt-8 inline-block border-4 border-[#ffd60a] bg-[#ffb020] px-6 py-4 font-pixel text-xs text-[#150b28] shadow-[8px_8px_0_#000]">▸ {identity.email}</a>
        <div className="mt-10 flex justify-center gap-6 font-pixel text-[9px] text-[#5ac8fa]">
          <a href={identity.github}>GITHUB</a>
          <a href={identity.linkedin}>LINKEDIN</a>
          <span>{identity.location}</span>
        </div>
      </footer>
    </main>
  )
}
