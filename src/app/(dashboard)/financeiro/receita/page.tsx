import { carregarReceita } from '@/lib/gestao-receita'
import { formatCurrency } from '@/lib/utils'
import ProjecaoMensalTable from '@/components/financeiro/ProjecaoMensalTable'
import ReceitaContratadaTable from '@/components/financeiro/ReceitaContratadaTable'
import EmNegociacaoTable from '@/components/financeiro/EmNegociacaoTable'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Receita contratada · Gestão Financeira' }

export default async function ReceitaPage() {
  const r = await carregarReceita()
  if (r.erro) return <p className="ac-aviso is-erro">Não foi possível ler os contratos: {r.erro}</p>

  const emNegociacao = r.linhas.filter(l => !l.assinado).sort((a, b) => b.anual - a.anual)

  return (
    <>
      <h2 className="ac-h3">Receita contratada por escola</h2>
      <p className="ac-sec-lead">
        Contratos assinados, com os valores reais declarados no documento. Valor anual = 1º ano de vigência (mensalidade × 12, ou valor do Kit
        do ano 1); valor total = projeção pra toda a vigência do contrato. Não considera rescisões, carências nem pagamentos efetivos.
      </p>

      {r.semValor ? (
        <section className="ac-setup" aria-labelledby="sv-t">
          <p className="ac-kicker">Dado faltando</p>
          <h2 id="sv-t">{r.semValor} de {r.assinados.length} contratos assinados estão sem valor registrado</h2>
          <p>
            Esses contratos têm alunos cadastrados mas ainda não têm o valor anual (nem o valor total) preenchido no módulo de Contratos.
            Preencha lá pra essa receita aparecer aqui.
          </p>
        </section>
      ) : null}

      <dl className="ac-kpis" style={{ marginBottom: '2rem' }}>
        <div><dt>Receita anual contratada</dt><dd className="ac-kpi-m">{r.receitaAnual ? formatCurrency(r.receitaAnual) : '—'}</dd></div>
        <div><dt>Valor total (toda a vigência)</dt><dd className="ac-kpi-m">{r.receitaTotalContratada ? formatCurrency(r.receitaTotalContratada) : '—'}</dd></div>
        <div><dt>Equivalente mensal</dt><dd className="ac-kpi-m">{r.receitaAnual ? formatCurrency(r.receitaMensal) : '—'}</dd></div>
        <div><dt>Alunos contratados</dt><dd>{r.alunos.toLocaleString('pt-BR')}</dd></div>
        <div><dt>Valor médio por aluno/ano</dt><dd className="ac-kpi-m">{r.ticketAluno ? formatCurrency(r.ticketAluno) : '—'}</dd></div>
      </dl>

      <ReceitaContratadaTable linhasIniciais={r.assinados.map(l => ({
        id: l.id, escola: l.escola, uf: l.uf, modelo: l.modelo, alunos: l.alunos,
        anual: l.anual, totalContrato: l.totalContrato, anos: l.anos, veterana: l.veterana,
      }))} />
      {!r.assinados.length ? <p className="ac-vazio" style={{ marginTop: '1rem' }}>Nenhum contrato assinado com valor registrado ainda.</p> : null}

      <h2 className="ac-h3" style={{ marginTop: '3rem' }}>Projeção mensal</h2>
      <p className="ac-sec-lead">Os mesmos contratos distribuídos pelos 12 meses, no formato da planilha de planejamento financeiro.</p>
      <ProjecaoMensalTable
        ano={2027}
        linhas={r.assinados.map(l => ({
          id: l.id, escola: l.escola, anual: l.anual, mensal: l.mensal,
          mesesReais: l.mesesReais, valoresPorAno: l.valoresPorAno, anos: l.anos,
        }))}
      />

      {emNegociacao.length ? (
        <>
          <h2 className="ac-h3" style={{ marginTop: '3rem' }}>Em negociação</h2>
          <p className="ac-sec-lead">
            Contratos com valor já calculado, mas ainda sem assinatura: {formatCurrency(r.pipelineAnual)} por ano no total. Não entram na receita contratada.
          </p>
          <EmNegociacaoTable linhasIniciais={emNegociacao.map(l => ({
            id: l.id, escola: l.escola, uf: l.uf, alunos: l.alunos, anual: l.anual, enviado: l.enviado,
          }))} />
        </>
      ) : null}
    </>
  )
}
