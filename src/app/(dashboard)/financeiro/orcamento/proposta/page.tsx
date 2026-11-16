import { carregarOrcamentoReceitas, carregarOrcamentoDespesas } from '@/lib/orcamentos'
import { formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Proposta Orçamentária 2027 · Gestão Financeira' }

const ANO = 2027

export default async function PropostaOrcamentariaPage() {
  const [receitas, despesas] = await Promise.all([carregarOrcamentoReceitas(ANO), carregarOrcamentoDespesas(ANO)])
  const resultado = receitas.totalAnual - despesas.totalAnual

  return (
    <>
      <h2 className="ac-h3">Proposta Orçamentária {ANO}</h2>
      <p className="ac-sec-lead">
        O consolidado da receita e da despesa projetadas pra {ANO}, pra fechar a proposta orçamentária do ano. O
        detalhe de cada lado mora nas páginas de Receitas e Despesas.
      </p>

      <dl className="ac-kpis" style={{ marginBottom: '2rem' }}>
        <div><dt>Receita projetada</dt><dd className="ac-kpi-m">{formatCurrency(receitas.totalAnual)}</dd></div>
        <div><dt>Despesa projetada</dt><dd className="ac-kpi-m">{formatCurrency(despesas.totalAnual)}</dd></div>
        <div><dt>Resultado projetado</dt><dd className="ac-kpi-m" style={{ color: resultado >= 0 ? '#1d7a1d' : '#b3261e' }}>{formatCurrency(resultado)}</dd></div>
      </dl>

      <div className="ac-table-wrap" tabIndex={0} role="region" aria-label={`Resumo por categoria de despesa ${ANO}`}>
        <table className="ac-table is-num">
          <thead><tr><th scope="col">Categoria de despesa</th><th scope="col">Previsão {ANO}</th><th scope="col">% da despesa</th></tr></thead>
          <tbody>
            {despesas.arvore.map(g => (
              <tr key={g.id}>
                <td>{g.nome}</td>
                <td>{formatCurrency(g.previsaoTotal)}</td>
                <td>{despesas.totalAnual > 0 ? `${((g.previsaoTotal / despesas.totalAnual) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—'}</td>
              </tr>
            ))}
            {despesas.semCategoria.length ? (
              <tr>
                <td>Sem categoria</td>
                <td>{formatCurrency(despesas.semCategoria.reduce((s, l) => s + l.total, 0))}</td>
                <td>—</td>
              </tr>
            ) : null}
            <tr className="ac-total">
              <td>Total</td>
              <td>{formatCurrency(despesas.totalAnual)}</td>
              <td>100%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="ac-nota" style={{ marginTop: '1rem' }}>
        Esta página ainda está em estruturação — aqui vai entrar o texto formal da proposta orçamentária {ANO}, com
        o histórico de versões e a justificativa de cada frente.
      </p>
    </>
  )
}
