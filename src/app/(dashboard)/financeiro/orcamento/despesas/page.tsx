import { carregarOrcamentoDespesas } from '@/lib/orcamentos'
import OrcamentoGrid from '@/components/financeiro/OrcamentoGrid'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Orçamento 2027 — Despesas · Gestão Financeira' }

const ANO = 2027

export default async function OrcamentoDespesasPage() {
  const despesas = await carregarOrcamentoDespesas(ANO)

  return (
    <>
      <h2 className="ac-h3">Orçamento {ANO} — Despesas</h2>
      <p className="ac-sec-lead">
        Despesas projetadas por categoria, do macro ao micro (até 6 níveis, ex.: PESSOAL › Folha › Salários), com
        previsão e execução real mês a mês, editáveis direto na tabela. O acompanhamento de % do previsto e os
        indicadores ficam na Gestão Orçamentária.
      </p>
      <OrcamentoGrid ano={ANO} tipo="despesa" orcamentoInicial={despesas} mostrarAcompanhamento={false} />
    </>
  )
}
