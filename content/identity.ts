import type { Lang } from './types'

export const identity = {
  name: 'Bruno Osella',
  email: 'brunooselladev@gmail.com',
  github: 'https://github.com/brunooselladev',
  linkedin: 'https://www.linkedin.com/in/bruno-osella-051114133/',
  location: 'Río Cuarto, Argentina',
  tools: ['Next.js', 'React', 'TypeScript', 'Node.js', 'Supabase', 'MongoDB', 'Mercado Pago', 'Vercel'],
  en: {
    headline: 'I turn business problems into software that works.',
    support: 'I connect business goals, technical decisions, and the people building the product — and I stay close enough to build it myself.',
    ctaWork: 'See how I work',
    ctaContact: 'Discuss a project',
    contactHeading: 'Have a problem that needs software? Tell me about it.',
    about: 'I joined Devias in 2021 as a junior frontend developer. I became technical lead, then a project manager, and I still build the software.',
    experimental: 'Experimental versions',
    fruit: 'Fruit',
    gaming: 'Gaming',
    legend: 'We take as many forms as the client wishes.',
  },
  es: {
    headline: 'Convierto problemas de negocio en software que funciona.',
    support: 'Conecto el objetivo del negocio, las decisiones técnicas y a las personas que construyen el producto, y me quedo lo bastante cerca como para construirlo yo.',
    ctaWork: 'Ver cómo trabajo',
    ctaContact: 'Hablemos de un proyecto',
    contactHeading: '¿Tenés un problema que necesita software? Contame.',
    about: 'Entré a Devias en 2021 como desarrollador frontend junior. Pasé a líder técnico y después a project manager, y sigo construyendo el software.',
    experimental: 'Versiones experimentales',
    fruit: 'Fruit',
    gaming: 'Gaming',
    legend: 'Tomamos tantas formas como el cliente desee.',
  },
  timeline: [
    { year: '2024–', en: { role: 'Project manager', company: 'Devias', detail: 'Frontend team, client projects, and the Bucked Up account' }, es: { role: 'Project manager', company: 'Devias', detail: 'Equipo de frontend, proyectos de clientes y la cuenta de Bucked Up' } },
    { year: '2023', en: { role: 'More products, and Imperio Tickets', company: 'Devias · Imperio' }, es: { role: 'Más productos, e Imperio Tickets', company: 'Devias · Imperio' } },
    { year: '2022', en: { role: 'Technical lead', company: 'Devias', detail: 'Bucked Up account' }, es: { role: 'Líder técnico', company: 'Devias', detail: 'Cuenta de Bucked Up' } },
    { year: '2021', en: { role: 'Junior frontend developer', company: 'Devias' }, es: { role: 'Desarrollador frontend junior', company: 'Devias' } },
  ],
} as const

export function identityCopy(lang: Lang) {
  return identity[lang]
}
