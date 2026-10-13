export const content = {
  name: 'Bruno Osella',
  role: 'Frontend & fullstack developer who leads projects.',
  sub: 'Clear communication, standardized code, real deliveries.',
  location: 'Río Cuarto, Córdoba, AR',
  projects: [
    { title: 'DTC Storefront', problem: 'Slow legacy store', solution: 'Next.js migration with SSR + optimized checkout', metric: '+24% conversion' },
    { title: 'Imperio Tickets', problem: 'Sales spikes crashed the site', solution: 'Realtime queues on Supabase + edge rendering', metric: '+300% traffic spike absorbed' },
    { title: 'Internal Platform', problem: 'Manual per-team reporting', solution: 'React dashboard + AI agents', metric: '-60% reporting time' },
  ],
  timeline: [
    { year: '2026–', role: 'Project Director', company: 'devias.ar' },
    { year: '2022–26', role: 'Front End Team Leader', company: 'devias.ar', detail: 'Talent onboarding, code standards, internal platforms, Bucked Up account lead' },
    { year: '2020–', role: 'Freelance', company: 'Next.js, Astro, Supabase' },
    { year: '2019', role: 'Tech support', company: 'everis', detail: 'SISalud, Hospital San Antonio de Padua' },
  ],
  about: '6+ years across frontend and project direction; trained in Advertising, with a focus on communication and clarity.',
  stack: ['Next.js', 'React', 'Astro', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Supabase', 'MongoDB', 'APIs', 'GitHub', 'Figma', 'AI agents & skills'],
  certs: ['Agile PM', 'Google Project Management'],
  contact: 'hola@brunoosella.dev',
} as const
export type PortfolioContent = typeof content
export const translations = { en: content, es: { ...content, role: 'Desarrollador frontend y fullstack que lidera proyectos.', sub: 'Comunicación clara, código estandarizado, entregas reales.', about: 'Más de 6 años entre frontend y dirección de proyectos; formado en Publicidad, con foco en comunicación y claridad.' } }
export type Lang = 'en' | 'es'
export const getContent = (lang: Lang) => translations[lang]
