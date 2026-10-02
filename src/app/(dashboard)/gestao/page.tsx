import Link from 'next/link'
import { GRUPOS_AREAS, TODAS_AREAS } from '@/lib/gestao-geral'
import { carregarReceita } from '@/lib/gestao-receita'
import { formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function GestaoGeralPage() {
  const r = await carregarReceita()
  const ativas = TODAS_AREAS.filter(a => a.status === 'ativo').length

  return (
    <>
      <section aria-label="Indicadores">
        <dl className="ac-kpis">
          <div><dt>Contratos assinados</dt><dd>{r.erro ? '—' : r.assinados.length}</dd></div>
          <div><dt>Receita anual contratada</dt><dd className="ac-kpi-m">{r.erro || !r.receitaAnual ? '—' : formatCurrency(r.receitaAnual)}</dd></div>
          <div><dt>Equivalente mensal</dt><dd className="ac-kpi-m">{r.erro || !r.receitaAnual ? '—' : formatCurrency(r.receitaMensal)}</dd></div>
          <div><dt>Alunos contratados</dt><dd>{r.erro ? '—' : r.alunos.toLocaleString('pt-BR')}</dd></div>
        </dl>
        {r.erro ? <p className="ac-aviso is-erro">Não foi possível ler os contratos: {r.erro}</p> : r.semValor ? (
          <p className="ac-nota ac-nota--alerta">
            {r.semValor} de {r.assinados.length} contratos assinados ainda não têm o valor por aluno registrado na plataforma, por isso a receita
            não aparece. As quantidades de alunos estão corretas. Os valores existem na planilha de Planejamento Financeiro 2027.{' '}
            <Link href="/gestao/receita">Ver a receita por escola →</Link>
          </p>
        ) : (
          <p className="ac-nota">
            Calculado pelos contratos assinados na plataforma comercial: alunos × valor por aluno de cada série, por ano. O equivalente
            mensal é o valor anual dividido por 12. <Link href="/gestao/receita">Ver a receita por escola →</Link>
          </p>
        )}
      </section>

      <section aria-labelledby="areas-t">
        <h2 id="areas-t" className="ac-h3">As áreas da gestão</h2>
        <p className="ac-sec-lead">
          {ativas} de {TODAS_AREAS.length} áreas já têm página. As demais estão definidas e serão construídas na ordem que a equipe priorizar.
        </p>

        <div className="ac-index">
          {GRUPOS_AREAS.map(g => (
            <section key={g.slug} aria-labelledby={`g-${g.slug}`}>
              <div className="ac-index-g">
                <h3 id={`g-${g.slug}`} className="ac-minor" style={{ margin: '0 0 .4rem' }}>{g.nome}</h3>
                <p>{g.texto}</p>
              </div>
              <ul className="ac-rows">
                {g.itens.map(a => {
                  const conteudo = (
                    <>
                      <span className="r-n" aria-hidden="true">{a.status === 'ativo' ? '●' : '○'}</span>
                      <span className="r-h">
                        {a.nome}
                        {a.fonte ? <span className="r-e">{a.fonte}</span> : null}
                      </span>
                      <span className="r-d">{a.descricao}</span>
                      <span className={`r-t${a.status === 'ativo' ? ' is-on' : ''}`}>{a.status === 'ativo' ? 'Disponível' : 'Em estruturação'}</span>
                    </>
                  )
                  return (
                    <li key={a.slug} className={`ac-row${a.status === 'ativo' ? '' : ' is-off'}`}>
                      {a.status === 'ativo' && a.href ? <Link href={a.href}>{conteudo}</Link> : <div className="ac-row-box">{conteudo}</div>}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </>
  )
}
