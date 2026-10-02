import Link from 'next/link'
import type { Metadata } from 'next'
import DocHero from '@/components/academia/DocHero'
import { ACADEMIA_DOCS, GRUPOS, MACROETAPAS, MARCOS, ORIGEM_LABEL } from '@/lib/academia'

export const metadata: Metadata = { title: 'Academia We Make' }

/** Documento que apresenta cada macroetapa. */
const DOC_DA_ETAPA: Record<number, string> = {
  1: 'handoff',
  2: 'procedimento-diagnostico',
  3: 'registro-ativacao-comercial',
  4: 'checklist-pre-onboarding',
  5: 'processo-de-onboarding-2026',
  6: 'ficha-go-live',
  7: 'ficha-go-live',
}

export default function AcademiaIndexPage() {
  return (
    <>
      <DocHero
        variant="index"
        crumbs={[{ label: 'Plataforma We Make', href: '/' }, { label: 'Academia We Make' }]}
        eyebrow="Sistema de implantação We Make · 2027"
        title="Academia We Make"
        deck="Trilha de formação, mentoria e consultoria pedagógica que sustenta a implantação do currículo em toda escola parceira e em toda família educadora que contrata o sistema We Make."
        facts={[
          { k: 'Documentos', v: `${ACADEMIA_DOCS.length}` },
          { k: 'Macroetapas', v: `${MACROETAPAS.length} (${MARCOS.length} marcos no Painel Mestre)` },
          { k: 'Edição', v: 'Setembro de 2026' },
        ]}
      />

      <div className="ac-wrap">
        <div className="ac-article ac-article--wide" style={{ maxWidth: 1100 }}>
          <p className="ac-intro">
            A Academia não é um produto comercializado separadamente. Está incluída em todo contrato do sistema We Make e
            existe porque o currículo, por mais bem estruturado que seja, só se transforma em aprendizagem real quando o
            professor ou o tutor sabe conduzi-lo com segurança, propósito e discernimento pedagógico.
          </p>

          <p className="ac-cta">
            <Link href="/academia/gestao">Gestão da implantação →</Link>
            <span>Painel Mestre, lista de tarefas, quadro, calendário, agenda e workspace, com base nas planilhas oficiais.</span>
          </p>

          <h2 className="ac-h2">A jornada da escola, em sete macroetapas</h2>
          <p className="ac-sec-lead">
            Nenhuma etapa é considerada concluída só porque uma reunião aconteceu: o gate e os entregáveis precisam ser
            atendidos. Cada macroetapa tem um documento que a apresenta.
          </p>
          <ol className="ac-journey">
            {MACROETAPAS.map(m => (
              <li key={m.n}>
                <Link href={`/academia/${DOC_DA_ETAPA[m.n]}`}>
                  <span className="j-n">Macroetapa {m.n}</span>
                  <span className="j-t">{m.nome}</span>
                  <span className="j-g">{m.gate}</span>
                </Link>
              </li>
            ))}
          </ol>

          <h2 className="ac-h2">Os documentos, na ordem em que se lê e se executa</h2>
          <p className="ac-sec-lead">
            Primeiro os fundamentos, depois a implantação na sequência real da escola, por fim o controle de todas as
            escolas no Painel Mestre. Os documentos numerados de 1 a 8 (e 3.1) são os oficiais fornecidos por Dênis; os
            demais são complementares. O Manual do Formador e o Material do Multiplicador descrevem a Ativação Comercial
            feita junto ao time comercial da escola.
          </p>

          <div className="ac-index">
            {GRUPOS.map(g => (
              <section key={g.nome} aria-labelledby={`g-${g.nome}`}>
                <div className="ac-index-g">
                  <h3 id={`g-${g.nome}`} className="ac-minor" style={{ margin: '0 0 .4rem' }}>{g.nome}</h3>
                  <p>{g.texto}</p>
                </div>
                <ul className="ac-rows">
                  {ACADEMIA_DOCS.filter(d => d.grupo === g.nome).map(d => (
                    <li key={d.slug} className="ac-row">
                      <Link href={`/academia/${d.slug}`}>
                        <span className="r-n">{d.oficialNo ?? '—'}</span>
                        <span className="r-h">
                          {d.short}
                          <span className="r-e">{d.kicker}</span>
                          <span className="r-o">{ORIGEM_LABEL[d.origem]}</span>
                        </span>
                        <span className="r-d">{d.deck}</span>
                        <span className="r-t">{d.tipo}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
