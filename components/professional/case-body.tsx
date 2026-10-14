'use client'

import { caseCopy } from '@/content'
import type { CaseStudy } from '@/content'
import { useLanguage } from '@/components/language-provider'

const ui = {
  en: { role: 'My role', when: 'When', outcome: 'Outcome', stack: 'Stack', did: 'What I did', team: 'What the team owns', products: 'Product', mine: 'What I do', stages: 'Stages', done: 'Done', next: 'Next', site: 'Visit the site' },
  es: { role: 'Mi rol', when: 'Cuándo', outcome: 'Resultado', stack: 'Stack', did: 'Qué hice', team: 'Qué es del equipo', products: 'Producto', mine: 'Qué hago', stages: 'Etapas', done: 'Listo', next: 'Después', site: 'Ver el sitio' },
}

export function CaseBody({ study }: { study: CaseStudy }) {
  const { lang } = useLanguage()
  const copy = caseCopy(study, lang)
  const labels = ui[lang]
  const products = study.products?.[lang]
  const stages = study.stages?.[lang]
  return (
    <article className="pro-case" id={study.id} aria-labelledby={`${study.id}-title`}>
      <h2 id={`${study.id}-title`}>{copy.title}</h2>
      <p className="pro-lede">{copy.context}</p>
      <dl className="pro-facts">
        <div><dt>{labels.role}</dt><dd>{copy.role}</dd></div>
        <div><dt>{labels.when}</dt><dd>{copy.note}</dd></div>
        {copy.stack.length > 0 && <div><dt>{labels.stack}</dt><dd>{copy.stack.join(', ')}</dd></div>}
      </dl>
      <div className="pro-story">
        <h3>{labels.did}</h3>
        <div className="body"><ul>{copy.contribution.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <h3>{labels.team}</h3>
        <div className="body"><p className="pro-note">{copy.collective}</p></div>
        <h3>{labels.outcome}</h3>
        <div className="body"><p>{copy.outcome}</p>{study.url && <p><a href={study.url}>{labels.site}</a></p>}</div>
        {products && products.length > 0 && (
          <>
            <h3>{labels.products}</h3>
            <div className="body">
              <table className="pro-products">
                <thead><tr><th scope="col">{labels.products}</th><th scope="col">{labels.mine}</th></tr></thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.name}><td>{product.name}</td><td>{product.role}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {stages && stages.length > 0 && (
          <>
            <h3>{labels.stages}</h3>
            <div className="body">
              <div className="pro-stages">
                {stages.map((stage) => (
                  <div key={stage.name} className="pro-stage">
                    <span className={`pro-dot ${stage.state}`} aria-hidden="true" />
                    <span>{stage.name} — {stage.state === 'done' ? labels.done : labels.next}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        <h3>{lang === 'es' ? 'Qué no se muestra' : 'What stays private'}</h3>
        <div className="body"><p className="pro-note">{copy.confidentiality}</p></div>
      </div>
    </article>
  )
}
