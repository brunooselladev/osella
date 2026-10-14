import type { CaseStudy } from '../types'

const products = {
  en: [
    { name: 'Ecommerce', role: 'Frontend and backend, and I lead the frontend team' },
    { name: 'Ambassador app', role: 'Fullstack, end to end' },
    { name: 'Shop app', role: 'Project manager and backend. The technical lead is someone else' },
    { name: 'Bootcamp', role: 'Frontend' },
  ],
  es: [
    { name: 'Ecommerce', role: 'Frontend y backend, y lidero el equipo de frontend' },
    { name: 'App de ambassadors', role: 'Fullstack, de punta a punta' },
    { name: 'Shop app', role: 'Project manager y backend. El líder técnico es otra persona' },
    { name: 'Bootcamp', role: 'Frontend' },
  ],
}

export const buckedUp: CaseStudy = {
  id: 'bucked-up',
  slug: 'bucked-up',
  status: 'published',
  url: 'https://www.buckedup.com/',
  sheet: { needRow: 1, engineeringRow: 0 },
  products,
  en: {
    title: 'Bucked Up: four products, one account',
    summary: 'Since 2022 I’ve led the Bucked Up account at Devias: three people, four products, and a different role on each. I build the ecommerce frontend and backend and lead its frontend team, build the brand-ambassador app end to end, own the Bootcamp frontend, and run the Shop app as project manager and backend developer. I also designed the AI agent setup the team uses on the ecommerce, organized around how the business works rather than around the technology. It lowered the cost of the day-to-day work and cut down errors.',
    context: 'Bucked Up is a US supplement brand with a direct-to-consumer store, an ambassador program, a mobile shop app and a fitness bootcamp. Devias works on all four.',
    role: 'Account lead for Devias since 2022, with 3 direct reports. The role changes per product.',
    meta: 'Client through Devias · account lead since 2022 · 3 people',
    rows: [
      {
        need: 'Four products, one account, three people.',
        engineering: { lead: 'Ecommerce frontend and backend', detail: 'Ambassador app, end to end' },
        business: { lead: 'Three people reporting to me', detail: 'A different role on each product' },
        delivery: { lead: 'I lead the account and its team', detail: 'PM on the Shop app, frontend lead on the store' },
      },
      {
        need: 'A large shared codebase where mistakes reach customers.',
        engineering: { lead: 'AI agents organized by business domain, not by technology', detail: 'Guardrails: no direct changes on production, and schema changes with a written rollback' },
        business: { lead: 'Lower cost and fewer errors in daily work', detail: 'Checkout and money sit with a dedicated specialist' },
        delivery: { lead: 'I designed it and the team works with it', detail: 'The codebase is shared with Bucked Up’s own engineers' },
      },
    ],
    contribution: [
      'Ecommerce: frontend and backend, and lead of the frontend team',
      'Ambassador app: fullstack. It is public, and only brand ambassadors use it',
      'Bootcamp: frontend',
      'Shop app: project manager and backend. The technical lead is someone else',
      'An AI setup that splits the business into domains, with one specialist agent each and a router that hands work over',
      'Guardrails on that setup: production branches stay protected, and a schema change requires a reference search and a rollback',
    ],
    collective: 'The ecommerce codebase is shared with Bucked Up’s own engineers and with other Devias developers. The products and their results belong to the client and the team.',
    outcome: 'The account runs four products with three people. The agent setup lowered cost and errors in day-to-day development. There is no public figure for that change.',
    stack: [],
    confidentiality: 'Screenshots, if any, come from the public site. Internal names, providers and code stay out.',
    cardTitle: 'Bucked Up',
    cardLine: 'Four products, one account',
    note: 'Since 2022',
  },
  es: {
    title: 'Bucked Up: cuatro productos, una cuenta',
    summary: 'Desde 2022 lidero la cuenta de Bucked Up en Devias: tres personas, cuatro productos y un rol distinto en cada uno. Hago el frontend y el backend del ecommerce y lidero su equipo de frontend, desarrollo de punta a punta la app de ambassadors, llevo el frontend del Bootcamp y en la Shop app soy project manager y backend. También diseñé la configuración de agentes de IA con la que trabaja el equipo en el ecommerce, ordenada según el negocio y no según la tecnología. Bajó el costo del trabajo diario y redujo errores.',
    context: 'Bucked Up es una marca de suplementos de Estados Unidos, con tienda propia, un programa de ambassadors, una app de shop y un bootcamp. Devias trabaja en los cuatro.',
    role: 'Líder de la cuenta para Devias desde 2022, con 3 personas a cargo. El rol cambia según el producto.',
    meta: 'Cliente a través de Devias · lidero la cuenta desde 2022 · 3 personas',
    rows: [
      {
        need: 'Cuatro productos, una cuenta, tres personas.',
        engineering: { lead: 'Frontend y backend del ecommerce', detail: 'App de ambassadors, de punta a punta' },
        business: { lead: 'Tres personas a mi cargo', detail: 'Un rol distinto en cada producto' },
        delivery: { lead: 'Lidero la cuenta y al equipo', detail: 'PM en la Shop app, líder de frontend en la tienda' },
      },
      {
        need: 'Un código compartido y grande, donde un error le llega al cliente.',
        engineering: { lead: 'Agentes de IA ordenados por área del negocio, no por tecnología', detail: 'Protecciones: nada se cambia directo en producción, y un cambio de esquema lleva su rollback' },
        business: { lead: 'Menos costo y menos errores en el trabajo diario', detail: 'El checkout y el dinero quedan en un especialista' },
        delivery: { lead: 'Lo diseñé yo y el equipo trabaja con eso', detail: 'El código se comparte con los ingenieros de Bucked Up' },
      },
    ],
    contribution: [
      'Ecommerce: frontend y backend, y liderazgo del equipo de frontend',
      'App de ambassadors: fullstack. Es pública y la usan los ambassadors de la marca',
      'Bootcamp: frontend',
      'Shop app: project manager y backend. El líder técnico es otra persona',
      'Una configuración de agentes que divide el negocio en áreas, con un especialista por área y un router que reparte el trabajo',
      'Protecciones: las ramas de producción quedan bloqueadas, y un cambio de esquema exige buscar referencias y escribir el rollback',
    ],
    collective: 'El código del ecommerce se comparte con los ingenieros de Bucked Up y con otros desarrolladores de Devias. Los productos y sus resultados son del cliente y del equipo.',
    outcome: 'La cuenta sostiene cuatro productos con tres personas. Los agentes bajaron el costo y los errores del desarrollo diario. No hay una cifra pública de ese cambio.',
    stack: [],
    confidentiality: 'Si hay capturas, salen del sitio público. Nombres internos, proveedores y código quedan afuera.',
    cardTitle: 'Bucked Up',
    cardLine: 'Cuatro productos, una cuenta',
    note: 'Desde 2022',
  },
}
