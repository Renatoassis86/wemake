import { carregarOrcamentoReceitas } from '@/lib/orcamentos'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency } from '@/lib/utils'
import OrcamentoReceitasGrid from '@/components/financeiro/OrcamentoReceitasGrid'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Orçamento 2027 · Gestão Financeira' }

const ANO = 2027

export default async function OrcamentoPage() {
  const r = await carregarOrcamentoReceitas(ANO)

  const db = createAdminClient()
  const { data: contratosRaw } = await db.from('contratos').select('id, escola_id')
  const escolaIds = [...new Set((contratosRaw ?? []).map(c => c.escola_id).filter(Boolean))]
  const { data: escolasRaw } = escolaIds.length
    ? await db.from('escolas').select('id, nome').in('id', escolaIds)
    : { data: [] as { id: string; nome: string }[] }
  const nomePorEscola = new Map((escolasRaw ?? []).map(e => [e.id, e.nome]))
  const contratosOpcoes = (contratosRaw ?? [])
    .map(c => ({ id: c.id as string, nome: nomePorEscola.get(c.escola_id as string) ?? 'Escola sem nome' }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  return (
    <>
      <h2 className="ac-h3">Orçamento {ANO} — Receitas</h2>
      <p className="ac-sec-lead">
        Projeção mensal de receita por escola para {ANO}, a partir da planilha de planejamento financeiro. Os valores são editáveis direto
        na tabela e não recalculam sozinhos a partir do contrato — ligar uma linha a um contrato real é só pra referência e navegação.
      </p>

      <dl className="ac-kpis" style={{ marginBottom: '2rem' }}>
        <div><dt>Total anual projetado</dt><dd className="ac-kpi-m">{formatCurrency(r.totalAnual)}</dd></div>
        <div><dt>Equivalente mensal médio</dt><dd className="ac-kpi-m">{formatCurrency(r.totalAnual / 12)}</dd></div>
        <div><dt>Escolas no orçamento</dt><dd>{r.linhas.length}</dd></div>
      </dl>

      <OrcamentoReceitasGrid ano={ANO} linhasIniciais={r.linhas} contratosOpcoes={contratosOpcoes} />
    </>
  )
}
