import { carregarReceita } from '@/lib/gestao-receita'
import { formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Receita contratada · Gestão Geral' }

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export default async function ReceitaPage() {
  const r = await carregarReceita()
  if (r.erro) return <p className="ac-aviso is-erro">Não foi possível ler os contratos: {r.erro}</p>

  const emNegociacao = r.linhas.filter(l => !l.assinado).sort((a, b) => b.anual - a.anual)

  return (
    <>
      <h2 className="ac-h3">Receita contratada por escola</h2>
      <p className="ac-sec-lead">
        Contratos assinados na Jornada Contratual. Valor anual = alunos × valor por aluno de cada série; equivalente mensal = valor anual ÷ 12.
        É uma projeção linear: não considera rescisões, carências, parcelas de livro nem pagamentos efetivos.
      </p>

      {r.semValor ? (
        <section className="ac-setup" aria-labelledby="sv-t">
          <p className="ac-kicker">Dado faltando</p>
          <h2 id="sv-t">{r.semValor} de {r.assinados.length} contratos assinados estão sem valor por aluno</h2>
          <p>
            Nos contratos da plataforma, as quantidades de alunos estão preenchidas, mas o valor por aluno de cada série está zerado. Por isso a
            receita aparece como “—”. Preencha o valor por aluno na Jornada Contratual ou importe o planejamento financeiro da empresa, que já traz
            o valor de cada contrato por mês.
          </p>
        </section>
      ) : null}

      <dl className="ac-kpis" style={{ marginBottom: '2rem' }}>
        <div><dt>Receita anual contratada</dt><dd className="ac-kpi-m">{r.receitaAnual ? formatCurrency(r.receitaAnual) : '—'}</dd></div>
        <div><dt>Equivalente mensal</dt><dd className="ac-kpi-m">{r.receitaAnual ? formatCurrency(r.receitaMensal) : '—'}</dd></div>
        <div><dt>Alunos contratados</dt><dd>{r.alunos.toLocaleString('pt-BR')}</dd></div>
        <div><dt>Valor médio por aluno/ano</dt><dd className="ac-kpi-m">{r.ticketAluno ? formatCurrency(r.ticketAluno) : '—'}</dd></div>
      </dl>

      <div className="ac-table-wrap" tabIndex={0} role="region" aria-label="Receita por escola">
        <table className="ac-table is-num">
          <thead>
            <tr>
              <th scope="col">Escola</th><th scope="col">UF</th><th scope="col">Alunos</th>
              <th scope="col">Valor anual</th><th scope="col">Equivalente mensal</th><th scope="col">Duração</th><th scope="col">% da receita</th>
            </tr>
          </thead>
          <tbody>
            {r.assinados.map(l => (
              <tr key={l.id}>
                <td>{l.escola}</td>
                <td>{l.uf}</td>
                <td>{l.alunos.toLocaleString('pt-BR')}</td>
                <td>{l.anual ? formatCurrency(l.anual) : '—'}</td>
                <td>{l.anual ? formatCurrency(l.mensal) : '—'}</td>
                <td>{l.anos ? `${l.anos} ${l.anos === 1 ? 'ano' : 'anos'}` : '—'}</td>
                <td>{r.receitaAnual && l.anual ? `${((l.anual / r.receitaAnual) * 100).toFixed(1).replace('.', ',')}%` : '—'}</td>
              </tr>
            ))}
            <tr className="ac-total">
              <td>Total</td><td /><td>{r.alunos.toLocaleString('pt-BR')}</td>
              <td>{r.receitaAnual ? formatCurrency(r.receitaAnual) : '—'}</td><td>{r.receitaAnual ? formatCurrency(r.receitaMensal) : '—'}</td><td /><td>{r.receitaAnual ? '100%' : '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {!r.assinados.length ? <p className="ac-vazio" style={{ marginTop: '1rem' }}>Nenhum contrato assinado com valor registrado ainda.</p> : null}

      <h2 className="ac-h3" style={{ marginTop: '3rem' }}>Projeção mensal</h2>
      <p className="ac-sec-lead">Os mesmos contratos distribuídos pelos 12 meses, no formato da planilha de planejamento financeiro.</p>
      <div className="ac-table-wrap" tabIndex={0} role="region" aria-label="Projeção mensal por escola">
        <table className="ac-table is-num is-meses">
          <thead>
            <tr><th scope="col">Escola</th>{MESES.map(m => <th key={m} scope="col">{m}</th>)}</tr>
          </thead>
          <tbody>
            {r.assinados.map(l => (
              <tr key={l.id}>
                <td>{l.escola}</td>
                {MESES.map(m => <td key={m}>{l.anual ? formatCurrency(l.mensal) : '—'}</td>)}
              </tr>
            ))}
            <tr className="ac-total">
              <td>Total</td>
              {MESES.map(m => <td key={m}>{r.receitaAnual ? formatCurrency(r.receitaMensal) : '—'}</td>)}
            </tr>
          </tbody>
        </table>
      </div>

      {emNegociacao.length ? (
        <>
          <h2 className="ac-h3" style={{ marginTop: '3rem' }}>Em negociação</h2>
          <p className="ac-sec-lead">
            Contratos com valor já calculado, mas ainda sem assinatura: {formatCurrency(r.pipelineAnual)} por ano no total. Não entram na receita contratada.
          </p>
          <div className="ac-table-wrap" tabIndex={0} role="region" aria-label="Contratos em negociação">
            <table className="ac-table is-num">
              <thead><tr><th scope="col">Escola</th><th scope="col">UF</th><th scope="col">Alunos</th><th scope="col">Valor anual</th><th scope="col">Situação</th></tr></thead>
              <tbody>
                {emNegociacao.map(l => (
                  <tr key={l.id}>
                    <td>{l.escola}</td><td>{l.uf}</td><td>{l.alunos.toLocaleString('pt-BR')}</td><td>{l.anual ? formatCurrency(l.anual) : '—'}</td>
                    <td>{l.enviado ? 'Contrato enviado' : 'Em andamento'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </>
  )
}
