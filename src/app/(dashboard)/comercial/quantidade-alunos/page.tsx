import { createAdminClient } from '@/lib/supabase/admin'
import PageHeader from '@/components/layout/PageHeader'
import { calcTotalAlunosContrato } from '@/lib/contratos'
import { QuantidadeAlunosClient, type EscolaLinha } from './QuantidadeAlunosClient'

export const dynamic = 'force-dynamic'

export default async function QuantidadeAlunosPage() {
  const admin = createAdminClient()

  const [{ data: escolas }, { data: contratos }] = await Promise.all([
    admin.from('escolas').select('id, nome, cidade, estado').order('nome'),
    // select('*') em vez de listar colunas — evita quebrar a página inteira
    // caso `livro_impresso` ainda não exista no banco (migração pendente,
    // ver add_livro_impresso.sql). O campo some do resultado até rodar.
    admin.from('contratos').select('*'),
  ])

  const contratosPorEscola = new Map((contratos ?? []).map(c => [c.escola_id, c]))

  // Base automática: qualquer escola que já entrou no funil de contratação
  // (minuta em diante) — mesma regra usada em metas/page.tsx (alunosMeta).
  const linhas: EscolaLinha[] = (escolas ?? [])
    .filter(e => {
      const c = contratosPorEscola.get(e.id)
      return !!c && (c.minuta_enviada || c.contrato_enviado || c.contrato_assinado)
    })
    .map(e => {
      const c = contratosPorEscola.get(e.id)!
      return {
        escolaId: e.id,
        nome: e.nome,
        cidade: e.cidade ?? null,
        uf: e.estado ?? null,
        livroImpresso: !!c.livro_impresso,
        total: calcTotalAlunosContrato(c),
        qtds: Object.fromEntries(
          ['infantil2_qtd', 'infantil3_qtd', 'infantil4_qtd', 'infantil5_qtd',
            'fund1_ano1_qtd', 'fund1_ano2_qtd', 'fund1_ano3_qtd', 'fund1_ano4_qtd', 'fund1_ano5_qtd',
            'fund2_ano6_qtd', 'fund2_ano7_qtd', 'fund2_ano8_qtd', 'fund2_ano9_qtd',
            'medio_1s_qtd', 'medio_2s_qtd', 'medio_3s_qtd'].map(campo => [campo, c[campo] ?? 0]),
        ),
      }
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  // Escolas disponíveis pra adicionar manualmente (veteranas que ainda não
  // estão na lista acima) — todas as que não entraram no filtro de cima.
  const idsNaLista = new Set(linhas.map(l => l.escolaId))
  const escolasDisponiveis = (escolas ?? [])
    .filter(e => !idsNaLista.has(e.id))
    .map(e => ({ id: e.id, nome: e.nome, uf: e.estado ?? null }))

  const livroColunaExiste = (contratos ?? []).length === 0 || contratos!.some(c => 'livro_impresso' in c)

  return (
    <div>
      <PageHeader
        title="Quantidade de Alunos"
        subtitle="Alunos por série em cada escola parceira, e pedido de livro pra gráfica"
      />
      <div style={{ padding: '2rem 2.5rem' }}>
        <QuantidadeAlunosClient
          linhasIniciais={linhas}
          escolasDisponiveis={escolasDisponiveis}
          livroColunaExiste={livroColunaExiste}
        />
      </div>
    </div>
  )
}
