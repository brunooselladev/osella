import type { Decision } from './types'

export const decisions: Decision[] = [
  {
    id: 'bucked-agents',
    year: '2026',
    caseId: 'bucked-up',
    en: {
      title: 'Organize the AI agents by business domain, not by technology',
      kicker: 'Bucked Up · ecommerce',
      fields: [
        { label: 'Decided', value: 'One specialist agent per area of the business — checkout and money, integrations, background jobs, data, admin, the mobile API, QA — and a router that hands each task to the right one.' },
        { label: 'Why', value: 'So each agent understands an area of the business and its rules, not only a technology.' },
        { label: 'Guardrails', value: 'Nothing can be changed directly on production branches. A schema change requires a reference search and a written rollback, because the store has no migration system.' },
        { label: 'My part', value: 'I designed it and implemented it.' },
        { label: 'Team’s part', value: 'The codebase is shared with Bucked Up’s engineers and other Devias developers, who work with it daily.' },
        { label: 'Result', value: 'Lower cost and fewer errors in day-to-day work.' },
      ],
    },
    es: {
      title: 'Ordenar los agentes de IA por área del negocio, no por tecnología',
      kicker: 'Bucked Up · ecommerce',
      fields: [
        { label: 'Decidí', value: 'Un agente especialista por área del negocio — checkout y dinero, integraciones, procesos en segundo plano, datos, admin, la API de la app, QA — y un router que le pasa cada tarea al que corresponde.' },
        { label: 'Por qué', value: 'Para que cada agente entienda un área del negocio y sus reglas, no solo una tecnología.' },
        { label: 'Protecciones', value: 'Nada se cambia directo en las ramas de producción. Un cambio de esquema exige buscar referencias y escribir el rollback, porque la tienda no tiene sistema de migraciones.' },
        { label: 'Mi parte', value: 'Lo diseñé y lo implementé.' },
        { label: 'La parte del equipo', value: 'El código se comparte con los ingenieros de Bucked Up y con otros desarrolladores de Devias, que lo usan todos los días.' },
        { label: 'Resultado', value: 'Menos costo y menos errores en el trabajo diario.' },
      ],
    },
  },
  {
    id: 'coopef-admin-first',
    year: '2026',
    caseId: 'coopef-gym',
    en: {
      title: 'Ship the admin first, the member app after',
      kicker: 'COOPEF Gym · paid client · in progress',
      fields: [
        { label: 'Decided', value: 'Build the staff dashboard — members, payments, routines, landing — before the app for members.' },
        { label: 'Why', value: 'It started as importing the gym’s spreadsheet, and grew from there.' },
        { label: 'My part', value: 'Sole developer. Next.js and MongoDB.' },
        { label: 'Result', value: 'Nearly 600 members managed in the dashboard. The member app is next.' },
      ],
    },
    es: {
      title: 'Primero el panel, después la app de socios',
      kicker: 'COOPEF Gym · cliente pago · en progreso',
      fields: [
        { label: 'Decidí', value: 'Hacer el panel del equipo — socios, pagos, rutinas, landing — antes que la app para los socios.' },
        { label: 'Por qué', value: 'Empezó importando la planilla del gimnasio, y de ahí creció.' },
        { label: 'Mi parte', value: 'Único desarrollador. Next.js y MongoDB.' },
        { label: 'Resultado', value: 'Casi 600 socios se administran desde el panel. La app de socios viene después.' },
      ],
    },
  },
  {
    id: 'imperio-partner',
    year: '2024',
    caseId: 'imperio-tickets',
    en: {
      title: 'Become a partner, not only the developer',
      kicker: 'Imperio Tickets',
      fields: [
        { label: 'Decided', value: 'Join the business as a partner and keep building the whole platform.' },
        { label: 'My part', value: 'Sole developer of the platform: ticket sales, producer dashboards with settlements and user roles, box office and QR entry scanning.' },
        { label: 'Team’s part', value: 'Sales, producer relationships and the municipal contract are shared with my partners.' },
        { label: 'Result', value: 'More than 1,000 events, including the Municipality of Río Cuarto’s events at the Teatrino and the Viejo Mercado.' },
      ],
    },
    es: {
      title: 'Pasar a ser socio, no solo el desarrollador',
      kicker: 'Imperio Tickets',
      fields: [
        { label: 'Decidí', value: 'Entrar al negocio como socio y seguir construyendo toda la plataforma.' },
        { label: 'Mi parte', value: 'Único desarrollador de la plataforma: venta de entradas, tableros de productor con liquidaciones y roles, boletería y lectura de QR.' },
        { label: 'La parte del equipo', value: 'Las ventas, la relación con los productores y el contrato municipal se comparten con mis socios.' },
        { label: 'Resultado', value: 'Más de 1.000 eventos, entre ellos los de la Municipalidad de Río Cuarto en el Teatrino y el Viejo Mercado.' },
      ],
    },
  },
  {
    id: 'devias-pm',
    year: '2024',
    caseId: 'devias',
    en: {
      title: 'Move into project management without leaving the code',
      kicker: 'Devias',
      fields: [
        { label: 'Decided', value: 'Take on project management while keeping the fullstack work and the frontend team.' },
        { label: 'My part', value: 'Part of middle and senior management. I plan new technology initiatives and new-client proposals. I led collections management, the Devias rebrand and BYM architecture.' },
      ],
    },
    es: {
      title: 'Pasar a la gestión sin dejar el código',
      kicker: 'Devias',
      fields: [
        { label: 'Decidí', value: 'Tomar la gestión de proyectos y seguir con el trabajo fullstack y el equipo de frontend.' },
        { label: 'Mi parte', value: 'Estoy en los mandos medios y altos. Planifico iniciativas tecnológicas y propuestas para clientes nuevos. Lideré la gestión de cobranzas, el rebranding de Devias y la arquitectura de BYM.' },
      ],
    },
  },
  {
    id: 'imperio-backend-first',
    year: '2023',
    caseId: 'imperio-tickets',
    en: {
      title: 'Payments and backend before the redesign',
      kicker: 'Imperio Tickets',
      fields: [
        { label: 'Decided', value: 'Connect Mercado Pago, build the databases and refactor first. Redesign the site last.' },
        { label: 'Why', value: 'Other people were building the frontend. The gap was everything behind it: no backend and no way to take payments.' },
        { label: 'My part', value: 'The backend, the payments and the databases first. Later, the redesign of the whole site.' },
        { label: 'Team’s part', value: 'The original frontend.' },
      ],
    },
    es: {
      title: 'Primero los pagos y el backend, el rediseño después',
      kicker: 'Imperio Tickets',
      fields: [
        { label: 'Decidí', value: 'Conectar Mercado Pago, armar las bases de datos y refactorizar primero. Rediseñar el sitio al final.' },
        { label: 'Por qué', value: 'El frontend lo estaban haciendo otras personas. Lo que faltaba era todo lo de atrás: no había backend ni forma de cobrar.' },
        { label: 'Mi parte', value: 'Primero el backend, los pagos y las bases. Después, el rediseño de todo el sitio.' },
        { label: 'La parte del equipo', value: 'El frontend original.' },
      ],
    },
  },
  {
    id: 'bucked-account',
    year: '2022',
    caseId: 'bucked-up',
    en: {
      title: 'Take the lead on the Bucked Up account',
      kicker: 'Bucked Up through Devias',
      fields: [
        { label: 'Decided', value: 'Lead the account, with three people and four products.' },
        { label: 'My part', value: 'A different role on each product.' },
      ],
    },
    es: {
      title: 'Tomar la cuenta de Bucked Up',
      kicker: 'Bucked Up, a través de Devias',
      fields: [
        { label: 'Decidí', value: 'Liderar la cuenta, con tres personas y cuatro productos.' },
        { label: 'Mi parte', value: 'Un rol distinto en cada producto.' },
      ],
    },
  },
  {
    id: 'devias-join',
    year: '2021',
    caseId: 'devias',
    en: {
      title: 'Join Devias as a junior frontend developer',
      kicker: 'Devias',
      fields: [
        { label: 'Then', value: 'Technical lead in 2022, more Bucked Up products and Devias projects in 2023. I coded the first devias.ar.' },
      ],
    },
    es: {
      title: 'Entrar a Devias como frontend junior',
      kicker: 'Devias',
      fields: [
        { label: 'Después', value: 'Líder técnico en 2022, más productos de Bucked Up y más proyectos de Devias en 2023. Programé la primera versión de devias.ar.' },
      ],
    },
  },
]
