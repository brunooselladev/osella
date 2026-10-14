import type { CaseStudy } from '../types'

export const coopefGym: CaseStudy = {
  id: 'coopef-gym',
  slug: 'coopef-gym',
  status: 'published',
  stages: {
    en: [
      { name: 'Admin dashboard', state: 'done' },
      { name: 'Member app', state: 'next' },
    ],
    es: [
      { name: 'Panel de administración', state: 'done' },
      { name: 'App de socios', state: 'next' },
    ],
  },
  en: {
    title: 'COOPEF Gym: admin for a real gym',
    summary: 'A management platform for COOPEF, a cooperative gym in Río Cuarto, already running on its list of nearly 600 members. It started as an import of the gym’s spreadsheet and grew into the tool the staff uses: members, payments, the management sheet, training routines and the public landing. The app for members comes next.',
    context: 'COOPEF is a cooperative gym in Río Cuarto. This is a paid client, and the product is in progress.',
    role: 'Sole developer, for a paid client.',
    meta: 'Paid client · sole developer · in progress',
    rows: [
      {
        need: 'A gym with nearly 600 members to manage.',
        engineering: { lead: 'Admin dashboard in Next.js and MongoDB', detail: 'Members, payments, routines and the landing page' },
        business: { lead: 'Nearly 600 members in one place', detail: 'Active, suspended and pending, visible at a glance' },
        delivery: { lead: 'Admin dashboard: done', detail: 'Member app: next' },
      },
    ],
    contribution: [
      'It started by importing the gym’s spreadsheet, and it grew from there',
      'Admin dashboard: member list with status and filters, registration, payments, the management sheet, routines, charts and the landing page',
      'Next: an app for members',
    ],
    collective: 'I build it alone. The gym defines its own operation and rules.',
    outcome: 'Staff already run the member list from the dashboard. The member app is the next stage, so this case stays marked as in progress.',
    stack: ['Next.js', 'MongoDB'],
    confidentiality: 'The dashboard shows real members, so this case has no screenshots.',
    cardTitle: 'COOPEF Gym',
    cardLine: 'Admin for a gym, member app next',
    note: 'In progress',
  },
  es: {
    title: 'COOPEF Gym: la administración de un gimnasio real',
    summary: 'Una plataforma de gestión para COOPEF, un gimnasio cooperativo de Río Cuarto, que ya funciona con su padrón de casi 600 socios. Empezó como la importación de la planilla del gimnasio y creció hasta la herramienta que usa el equipo: socios, pagos, planilla de gestión, rutinas y la landing pública. La app para los socios viene después.',
    context: 'COOPEF es un gimnasio cooperativo de Río Cuarto. Es un cliente pago y el producto está en progreso.',
    role: 'Único desarrollador, para un cliente pago.',
    meta: 'Cliente pago · único desarrollador · en progreso',
    rows: [
      {
        need: 'Un gimnasio con casi 600 socios para administrar.',
        engineering: { lead: 'Panel de administración en Next.js y MongoDB', detail: 'Socios, pagos, rutinas y la landing' },
        business: { lead: 'Casi 600 socios en un solo lugar', detail: 'Activos, suspendidos y pendientes, a la vista' },
        delivery: { lead: 'Panel de administración: listo', detail: 'App de socios: después' },
      },
    ],
    contribution: [
      'Empezó importando la planilla del gimnasio, y de ahí creció',
      'Panel: padrón con estado y filtros, alta de socios, pagos, planilla de gestión, rutinas, gráficos y la landing',
      'Lo que sigue: una app para los socios',
    ],
    collective: 'Lo desarrollo solo. El gimnasio define su operación y sus reglas.',
    outcome: 'El equipo ya administra el padrón desde el panel. La app de socios es la etapa que sigue, así que el caso queda marcado como en progreso.',
    stack: ['Next.js', 'MongoDB'],
    confidentiality: 'El panel muestra socios reales, así que este caso no lleva capturas.',
    cardTitle: 'COOPEF Gym',
    cardLine: 'Administración del gimnasio; la app de socios viene después',
    note: 'En progreso',
  },
}
