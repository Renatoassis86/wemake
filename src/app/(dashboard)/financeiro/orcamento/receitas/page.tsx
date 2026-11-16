import { carregarOrcamentoReceitas } from '@/lib/orcamentos'
import { createAdminClient } from '@/lib/supabase/admin'
import OrcamentoGrid from '@/components/financeiro/OrcamentoGrid'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Orçamento 2027 — Receitas · Gestão Financeira' }

const ANO = 2027

export default async function OrcamentoReceitasPage() {
  const receitas = await carregarOrcamentoReceitas(ANO)

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
        Projeção de receita por escola para {ANO}, organizada em categorias de até 6 níveis (opcional) — previsão e
        execução real mês a mês, editáveis direto na tabela. O acompanhamento de % do previsto e os indicadores
        ficam na Gestão Orçamentária.
      </p>
      <OrcamentoGrid ano={ANO} tipo="receita" orcamentoInicial={receitas} contratosOpcoes={contratosOpcoes} mostrarAcompanhamento={false} />
    </>
  )
}
